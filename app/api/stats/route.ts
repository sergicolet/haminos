import { NextResponse } from 'next/server';

// Mock stats para testing local sin base de datos
const mockStats = {
    daily: [
        { date: '2026-01-01', count: 5 },
        { date: '2026-01-02', count: 8 },
        { date: '2026-01-03', count: 12 },
        { date: '2026-01-04', count: 7 },
        { date: '2026-01-05', count: 15 },
        { date: '2026-01-06', count: 10 }
    ],
    categories: [
        { name: 'Consulta Productos', value: 25 },
        { name: 'Consulta Envíos', value: 12 },
        { name: 'Producto Visto', value: 18 },
        { name: 'Test Evento', value: 5 }
    ]
};

export async function GET() {
    // Simular un pequeño delay como si fuera una consulta real
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(mockStats);
}
