import { NextResponse } from 'next/server';
import { getIndex, createEmbedding } from '@/lib/pinecone';

export async function GET() {
  try {
    const index = getIndex();
    // List vector IDs. By default it returns 100 results.
    const listResults = await index.listPaginated({ limit: 100 });
    
    const rawIds = listResults.vectors?.map((v) => v.id) || [];
    const ids = Array.from(new Set(rawIds)).filter(id => typeof id === 'string' && id.trim().length > 0);
    
    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const fetchResults = await index.fetch({ ids });

    const vectors = Object.values(fetchResults.records).map((record) => ({
      id: record.id,
      metadata: record.metadata || {},
    }));

    return NextResponse.json(vectors);
  } catch (error: any) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, metadata = {} } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const embedding = await createEmbedding(text);
    const index = getIndex();
    // Use a provided ID or generate one
    const id = metadata.id || `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await index.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: { ...metadata, text },
        },
      ]
    });

    return NextResponse.json({ id, success: true });
  } catch (error: any) {
    console.error('Error creating knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, text, metadata = {} } = await req.json();
    if (!id || !text) return NextResponse.json({ error: 'ID and text are required' }, { status: 400 });

    const embedding = await createEmbedding(text);
    const index = getIndex();

    await index.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: { ...metadata, text },
        },
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
        // Fallback to body if not in query
        const body = await req.json().catch(() => ({}));
        if (!body.id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        const index = getIndex();
        await index.deleteOne(body.id);
        return NextResponse.json({ success: true });
    }

    const index = getIndex();
    await index.deleteOne(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
