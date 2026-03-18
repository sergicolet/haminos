import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        // Obtenemos los últimos 100 logs de Firestore
        const snapshot = await adminDb.collection('haminos_chat_logs')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const logsBySession: Record<string, any> = {};

        snapshot.docs.forEach(docSnap => {
            const row = { id: docSnap.id, ...docSnap.data() } as any;

            const rawTime = row.timestamp;
            let timeString = new Date().toISOString();
            if (rawTime) {
                if (typeof rawTime.toDate === 'function') {
                    timeString = rawTime.toDate().toISOString();
                } else {
                    const parsed = new Date(rawTime);
                    if (!isNaN(parsed.getTime())) timeString = parsed.toISOString();
                }
            }

            if (!logsBySession[row.session_id]) {
                logsBySession[row.session_id] = {
                    id: row.session_id,
                    title: `Chat del ${new Date(timeString).toLocaleDateString()}`,
                    date: timeString,
                    messages: []
                };
            }

            // Añadimos el mensaje del usuario
            logsBySession[row.session_id].messages.push({
                id: row.id, 
                content: row.message,
                role: row.sender || 'user',
                timestamp: timeString,
                category: row.category,
                metadata: row.metadata
            });

            // Si existe respuesta del bot nativa en el documento de Firebase, la añadimos como mensaje posterior
            if (row.bot_response) {
                logsBySession[row.session_id].messages.push({
                    id: `${row.id}-bot`,
                    content: row.bot_response,
                    role: 'assistant',
                    timestamp: new Date(new Date(timeString).getTime() + 1000).toISOString()
                });
            }
        });

        // Convertimos el objeto a array y ordenamos los mensajes dentro de cada sesión
        const logs = Object.values(logsBySession).map(session => {
            session.messages.sort((a: any, b: any) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
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
        console.error('Error fetching logs from Firebase:', error.message);
        return NextResponse.json([]);
    }
}
