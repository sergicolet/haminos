import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Obtenemos los logs ordenados por fecha descendente
        // Ahora cada fila contiene tanto el mensaje del usuario como la respuesta del bot
        const result = await query(`
      SELECT * FROM haminos_chat_logs 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

        // Procesamos los datos para agruparlos por sesión
        const logsBySession: Record<string, any> = {};

        result.rows.forEach((row) => {
            if (!logsBySession[row.session_id]) {
                logsBySession[row.session_id] = {
                    id: row.session_id,
                    // Usamos el mensaje del usuario como título, o los primeros caracteres
                    title: `Chat del ${new Date(row.timestamp).toLocaleDateString()}`,
                    date: new Date(row.timestamp).toISOString(),
                    messages: []
                };
            }

            // Añadimos el mensaje del usuario
            logsBySession[row.session_id].messages.push({
                id: row.id, // ID original de la fila
                content: row.message,
                role: 'user',
                timestamp: new Date(row.timestamp).toISOString(),
                category: row.category, // Incluimos la categoría si está disponible
                metadata: row.metadata
            });

            // Si existe respuesta del bot en la misma fila, la añadimos como mensaje posterior
            if (row.bot_response) {
                logsBySession[row.session_id].messages.push({
                    id: `${row.id}-bot`, // ID sintético para el mensaje del bot
                    content: row.bot_response,
                    role: 'assistant',
                    // Simulamos que el bot respondió 1 segundo después para mantener orden visual si es necesario, 
                    // aunque el sort del frontend lo manejará por índice
                    timestamp: new Date(new Date(row.timestamp).getTime() + 1000).toISOString()
                });
            }
        });

        // Convertimos el objeto a array y ordenamos los mensajes dentro de cada sesión
        const logs = Object.values(logsBySession).map(session => {
            // Ordenamos mensajes por timestamp ascendente (antiguos arriba)
            session.messages.sort((a: any, b: any) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            // El título puede ser la categoría del primer mensaje si existe
            const firstMsg = session.messages.find((m: any) => m.role === 'user');
            if (firstMsg?.category) {
                session.title = `Consulta: ${firstMsg.category} (${new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
            }
            return session;
        });

        // Ordenamos las sesiones por la fecha de su último mensaje (más reciente primero)
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
