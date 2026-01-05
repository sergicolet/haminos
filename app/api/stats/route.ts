import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Stats de Mensajes por día
        const dailyStats = await query(`
      SELECT TO_CHAR(timestamp, 'DD/MM') as date, COUNT(*) as count
      FROM haminos_chat_logs
      GROUP BY date
      ORDER BY MIN(timestamp) ASC
      LIMIT 7
    `);

        // Stats de Categorías (basado en eventos de tracking)
        const categoryStats = await query(`
      SELECT event as name, COUNT(*) as value
      FROM haminos_chat_tracking
      GROUP BY event
      ORDER BY value DESC
    `);

        return NextResponse.json({
            daily: dailyStats.rows,
            categories: categoryStats.rows
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
