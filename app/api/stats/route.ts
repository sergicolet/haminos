import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Obtener conteo de mensajes por día (últimos 7 días)
        const dailyResult = await query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM haminos_chat_logs
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);

        // Obtener categorías de eventos de tracking
        const categoriesResult = await query(`
      SELECT 
        event as name,
        COUNT(*) as value
      FROM haminos_chat_tracking
      GROUP BY event
      ORDER BY value DESC
    `);

        return NextResponse.json({
            daily: dailyResult.rows.map(row => ({
                date: new Date(row.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                count: parseInt(row.count)
            })),
            categories: categoriesResult.rows.map(row => ({
                name: row.name,
                value: parseInt(row.value)
            }))
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
