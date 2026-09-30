import { BuildRouteDto } from './osrm.schema';

const OSRM_BASE = process.env.OSRM_URL || 'http://10.1.1.215:5000';

export async function buildRouteService(dto: BuildRouteDto) {
  try {
    const { points, avoidMotorwayToll = false, preferShortest = false } = dto;
    
    if (points.length < 2) {
      throw new Error('At least 2 points required');
    }
    
    // Формируем координаты для OSRM
    const coords = points.map(p => `${p.lon},${p.lat}`).join(';');
    
    // Параметры запроса
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      alternatives: 'false',
      annotations: 'nodes'
    });

    const url = `${OSRM_BASE}/route/v1/driving/${coords}?${params.toString()}`;
    
    console.log('OSRM request:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OSRM ${response.status}: ${text.slice(0, 180)}`);
    }

    const data = await response.json();
    const route = (data as any)?.routes?.[0];
    
    if (!route) {
      throw new Error('OSRM: no route found');
    }

    // Собираем все узлы из всех сегментов маршрута
    const allNodes: number[] = [];
    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.annotation?.nodes) {
          allNodes.push(...leg.annotation.nodes);
        }
      }
    }

    return {
      ok: true,
      data: {
        nodes: allNodes,
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
      }
    };

  } catch (error) {
    console.error('OSRM service error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'OSRM service error'
    };
  }
}
