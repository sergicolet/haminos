import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
    try {
        // Insertar mensajes de chat de prueba
        await query(`
      INSERT INTO haminos_chat_logs (session_id, message, sender, timestamp) VALUES
      ('test-session-001', 'Hola, necesito información sobre productos para piel sensible', 'user', NOW() - INTERVAL '2 hours'),
      ('test-session-001', '¡Hola! Claro, tengo varios productos ideales para piel sensible. ¿Buscas algo específico como crema hidratante, limpiador o serum?', 'bot', NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds'),
      ('test-session-001', 'Me interesa una crema hidratante', 'user', NOW() - INTERVAL '1 hour 50 minutes'),
      ('test-session-001', 'Te recomiendo la Crema Hidratante Calmante de La Roche-Posay, perfecta para piel sensible. ¿Quieres ver más detalles?', 'bot', NOW() - INTERVAL '1 hour 50 minutes' + INTERVAL '20 seconds'),
      ('test-session-002', 'Busco un protector solar', 'user', NOW() - INTERVAL '1 hour'),
      ('test-session-002', 'Tenemos excelentes opciones de protectores solares. ¿Para qué tipo de piel?', 'bot', NOW() - INTERVAL '1 hour' + INTERVAL '15 seconds'),
      ('test-session-003', 'Hola esto es un test', 'user', NOW() - INTERVAL '30 minutes'),
      ('test-session-003', '¡Hola! Veo que haces un test. ¿En qué puedo ayudarte hoy con productos o dudas sobre dermocosmética?', 'bot', NOW() - INTERVAL '30 minutes' + INTERVAL '10 seconds')
      ON CONFLICT DO NOTHING
    `);

        // Insertar eventos de tracking de prueba
        await query(`
      INSERT INTO haminos_chat_tracking (session_id, event, product_handle, product_title, timestamp) VALUES
      ('test-session-001', 'consulta_productos', NULL, NULL, NOW() - INTERVAL '2 hours'),
      ('test-session-001', 'producto_visto', 'crema-hidratante-laroche', 'Crema Hidratante La Roche-Posay', NOW() - INTERVAL '1 hour 45 minutes'),
      ('test-session-002', 'consulta_productos', NULL, NULL, NOW() - INTERVAL '1 hour'),
      ('test-session-002', 'consulta_envios', NULL, NULL, NOW() - INTERVAL '50 minutes'),
      ('test-session-003', 'test_evento', NULL, NULL, NOW() - INTERVAL '30 minutes')
      ON CONFLICT DO NOTHING
    `);

        return NextResponse.json({
            success: true,
            message: 'Datos de prueba insertados correctamente'
        });
    } catch (error: any) {
        console.error('Error inserting test data:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
