import { BuildRouteDto } from './osrm.schema';

const OSRM_BASE = process.env.OSRM_URL || 'http://10.1.1.215:5000';

export async function buildRouteService(dto: BuildRouteDto) {
  try {
    const { start, end, avoidMotorwayToll = false, preferShortest = false } = dto;
    
    // Формируем координаты для OSRM точно как в старом проекте
    const coords = `${start.lon},${start.lat};${end.lon},${end.lat}`;
    
    // Параметры запроса точно как в старом проекте
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
    const route = data?.routes?.[0];
    
    if (!route) {
      throw new Error('OSRM: no route found');
    }

    // Извлекаем узлы и геометрию точно как в старом проекте
    const nodes = route?.legs?.[0]?.annotation?.nodes || [];
    const geometry = route?.geometry || null;

    return {
      ok: true,
      data: {
        nodes,
        geometry,
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
