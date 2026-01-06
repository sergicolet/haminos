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

        // Obtener categorías (leyendo de la columna 'category' directamente)
        const categoriesResult = await query(`
      SELECT 
        category as name,
        COUNT(*) as value
      FROM haminos_chat_logs
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY value DESC
    `);

        return NextResponse.json({
            daily: dailyResult.rows.map(row => ({
                date: new Date(row.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                count: parseInt(row.count)
            })),
            categories: categoriesResult.rows.map(row => ({
                // Limpiamos posibles saltos de línea o espacios extra que el LLM haya podido meter
                name: row?.name?.replace(/[\n\r]/g, '')?.trim() || 'Desconocido',
                value: parseInt(row.value)
            }))
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
