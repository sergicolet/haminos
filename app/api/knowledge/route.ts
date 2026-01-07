import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Función auxiliar para inicializar los clientes de forma segura
function getClients() {
    const apiKey = process.env.PINECONE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const indexName = process.env.PINECONE_INDEX || 'haminos';

    if (!apiKey) throw new Error("Falta PINECONE_API_KEY");
    if (!openaiKey) throw new Error("Falta OPENAI_API_KEY");

    const pinecone = new Pinecone({ apiKey });
    const openai = new OpenAI({ apiKey: openaiKey });

    return { pinecone, openai, indexName };
}

export async function GET() {
    try {
        const { pinecone, indexName } = getClients();
        const index = pinecone.Index(indexName);

        // Intentamos obtener los vectores. 
        // Usamos query con vector cero para traer los más "relevantes" (que en este caso son casi todos si el topK es alto)
        // Opcionalmente, si Pinecone lo permite, podríamos usar listPaginated pero requiere fetch individual.
        const queryResponse = await index.query({
            vector: Array(768).fill(0),
            topK: 1000, // Aumentamos para traer "todo" el bloc de notas
            includeMetadata: true,
        });

        // Ordenamos por ID o algún criterio para que no salte de posición cada vez
        const knowledge = queryResponse.matches?.map(match => ({
            id: match.id,
            text: match.metadata?.text || 'Sin contenido',
            score: match.score,
            metadata: match.metadata
        })).sort((a, b) => a.id.localeCompare(b.id)) || [];

        return NextResponse.json(knowledge);
    } catch (error: any) {
        console.error('Error in Knowledge GET:', error);
        return NextResponse.json({
            error: "Error al leer Pinecone",
            details: error.message,
            code: error.status || 500
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id, text } = await req.json();

        if (!id || !text) {
            return NextResponse.json({ error: "Faltan datos (id o texto)" }, { status: 400 });
        }

        const { pinecone, openai, indexName } = getClients();

        // 1. Generar el nuevo embedding con OpenAI (ajustado a 768 dimensiones)
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            dimensions: 768
        });
        const vector = embeddingResponse.data[0].embedding;

        // 2. Actualizar en Pinecone
        const index = pinecone.Index(indexName);
        await index.upsert([{
            id: id,
            values: vector,
            metadata: { text: text }
        }]);

        return NextResponse.json({ success: true, message: "Conocimiento actualizado correctamente" });
    } catch (error: any) {
        console.error('Error in Knowledge POST:', error);

        let friendlyMessage = "Error al actualizar el conocimiento";
        if (error.message.includes("401")) friendlyMessage = "Error de Autenticación: Revisa tus API Keys.";
        if (error.message.includes("quota")) friendlyMessage = "Error de Cuota: OpenAI no tiene saldo suficiente.";

        return NextResponse.json({
            error: friendlyMessage,
            details: error.message,
            code: error.status || 500
        }, { status: 500 });
    }
}
