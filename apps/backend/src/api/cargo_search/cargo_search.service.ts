import { CargoSearchDto } from './cargo_search.schema';
import { getCarParams, findMatchingCargo } from './cargo_search.repository';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // км
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Поиск подходящих грузов для автомобиля
 */
export async function searchCargoForCarService(dto: CargoSearchDto) {
  try {
    // Получаем параметры автомобиля
    const carParams = await getCarParams(dto.id_cars);
    if (!carParams) {
      return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
    }

    // Ищем подходящие грузы по параметрам авто
    const matchingCargo = await findMatchingCargo(carParams);

    // Если у автомобиля есть активные города, фильтруем грузы по радиусу от каждого активного города
    const radiusKm = dto.radius ?? 20;
    const activePoints: Array<{ lat: number; lon: number }> = [];
    if (carParams.places && typeof carParams.places === 'object') {
      for (const key of Object.keys(carParams.places as any)) {
        const p = (carParams.places as any)[key];
        if (!p) continue;
        if (p.active === false) continue;
        if (typeof p.lat === 'number' && typeof p.lon === 'number') {
          activePoints.push({ lat: p.lat, lon: p.lon });
        }
      }
    }

    if (activePoints.length === 0) {
      return { ok: true as const, status: 200, items: matchingCargo };
    }

    const filtered = matchingCargo.filter((cg: any) => {
      const dep = cg?.departure_place_id;
      if (!dep || typeof dep !== 'object') return false;
      const keys = Object.keys(dep);
      if (keys.length === 0) return false;
      const k = keys[0];
      const lat = dep[k]?.lat;
      const lon = dep[k]?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return false;
      // допустим, если расстояние от любого активного города <= radiusKm, то оставляем
      return activePoints.some((pt) => haversineDistance(pt.lat, pt.lon, lat, lon) <= radiusKm);
    });

    return { ok: true as const, status: 200, items: filtered };
  } catch (error) {
    console.error('Search cargo for car service error:', error);
    return { ok: false as const, status: 500, error: 'Ошибка поиска грузов для автомобиля' };
  }
}
