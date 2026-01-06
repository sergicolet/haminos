import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(
            'SELECT * FROM haminos_chat_logs ORDER BY timestamp DESC LIMIT 100'
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
