import { NextResponse } from 'next/server';

// Mock data para testing local sin base de datos
const mockLogs = [
    {
        id: 1,
        session_id: 'test-session-001',
        message: 'Hola, necesito información sobre productos para piel sensible',
        sender: 'user',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 2,
        session_id: 'test-session-001',
        message: '¡Hola! Claro, tengo varios productos ideales para piel sensible. ¿Buscas algo específico como crema hidratante, limpiador o serum?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString()
    },
    {
        id: 3,
        session_id: 'test-session-001',
        message: 'Me interesa una crema hidratante',
        sender: 'user',
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString()
    },
    {
        id: 4,
        session_id: 'test-session-001',
        message: 'Te recomiendo la Crema Hidratante Calmante de La Roche-Posay, perfecta para piel sensible. ¿Quieres ver más detalles?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 110 * 60 * 1000 + 20000).toISOString()
    },
    {
        id: 5,
        session_id: 'test-session-002',
        message: 'Busco un protector solar',
        sender: 'user',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
        id: 6,
        session_id: 'test-session-002',
        message: 'Tenemos excelentes opciones de protectores solares. ¿Para qué tipo de piel?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 60 * 60 * 1000 + 15000).toISOString()
    },
    {
        id: 7,
        session_id: 'test-session-003',
        message: 'Hola esto es un test',
        sender: 'user',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
        id: 8,
        session_id: 'test-session-003',
        message: '¡Hola! Veo que haces un test. ¿En qué puedo ayudarte hoy con productos o dudas sobre dermocosmética?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 30 * 60 * 1000 + 10000).toISOString()
    }
];

export async function GET() {
    // Simular un pequeño delay como si fuera una consulta real
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(mockLogs);
}
