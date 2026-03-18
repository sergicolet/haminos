import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Obtenemos del chatbot todos los logs de los últimos 7 días
    const snapshotLogs = await adminDb().collection('haminos_chat_logs')
      .where('timestamp', '>=', sevenDaysAgo.toISOString())
      .get();

    const dailyMap: Record<string, number> = {};
    const categoriesMap: Record<string, number> = {};

    snapshotLogs.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      // Contar por día
      if (data.timestamp) {
        let dateObj = new Date();
        if (typeof data.timestamp.toDate === 'function') {
            dateObj = data.timestamp.toDate();
        } else {
            const parsed = new Date(data.timestamp);
            if (!isNaN(parsed.getTime())) dateObj = parsed;
        }
        
        const dateKey = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
      }

      // Agrupar categorías
      if (data.category && typeof data.category === 'string') {
        const cat = data.category.replace(/[\n\r]/g, '').trim() || 'Desconocido';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      }
    });

    // Asegurarnos de ordenar los últimos 7 días de forma correlativa para el gráfico
    const formattedDaily = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        formattedDaily.push({
            date: dateKey,
            count: dailyMap[dateKey] || 0
        });
    }

    // Formatear categorías ordenadas de mayor a menor
    const categories = Object.keys(categoriesMap).map(name => ({
      name,
      value: categoriesMap[name]
    })).sort((a, b) => b.value - a.value);

    // Conteo total masivo y ultra-rápido de enventos en Firebase (Count Aggregation API)
    const trackingSnapshot = await adminDb().collection('haminos_tracking_events').count().get();
    const trackingTotal = trackingSnapshot.data().count;

    return NextResponse.json({
      daily: formattedDaily,
      categories,
      trackingTotal
    });
  } catch (error: any) {
    console.error('Error fetching stats from Firebase:', error.message);
    return NextResponse.json({
      daily: [],
      categories: [],
      trackingTotal: 0
    });
  }
}
