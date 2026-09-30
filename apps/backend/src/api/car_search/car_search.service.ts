import { CarSearchDto } from './car_search.schema';
import { getCargoParams, findMatchingCars } from './car_search.repository';
import { searchPlaces } from '../nominatim/nominatim.repository';

// Радиус Земли в километрах для расчёта расстояния по формуле гаверсина.
const EARTH_RADIUS_KM = 6371;

/**
 * Вычисляет расстояние между двумя точками на поверхности Земли (haversine).
 * @param lat1 Широта первой точки
 * @param lon1 Долгота первой точки
 * @param lat2 Широта второй точки
 * @param lon2 Долгота второй точки
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Поиск подходящих автомобилей для заданного груза.
 * 1) Получает параметры груза (масса, объём, пункт отправления).
 * 2) Находит координаты пункта отправления через Nominatim.
 * 3) Находит автомобили, подходящие по грузоподъёмности и объёму.
 * 4) Фильтрует найденные автомобили по радиусу от места отправления груза.
 */
export async function searchCarsForCargoService(dto: CarSearchDto) {
  try {
    // Получаем вес, объём и пункт отправления груза.
    const cargoParams = await getCargoParams(dto.id_cargo);
    if (!cargoParams) {
      return { ok: false as const, status: 404, error: 'Груз не найден' };
    }

    // Получаем координаты населённого пункта. Используем Nominatim для поиска.
    const places = await searchPlaces(cargoParams.departure_point);
    if (!places || places.length === 0) {
      return { ok: false as const, status: 404, error: 'Координаты пункта отправления не найдены' };
    }
    // Берём координаты первого совпадения.
    const firstPlace = places[0].place;
    const firstKey = Object.keys(firstPlace)[0];
    const cargoLat = firstPlace[firstKey].lat;
    const cargoLon = firstPlace[firstKey].lon;

    // Находим автомобили, подходящие по грузоподъёмности и объёму.
    const cars = await findMatchingCars(cargoParams);

    // Фильтрация по радиусу: оставляем только те автомобили, у которых хотя бы одна точка в places
    // находится в заданном радиусе от пункта отправления груза.
    const radiusKm = dto.radius ?? 50;
    const filtered = cars.filter((car: any) => {
      const placesObj = car.places as Record<string, { lat: number; lon: number }>;
      if (!placesObj) return false;
      return Object.values(placesObj).some(({ lat, lon }) => {
        // Пропускаем нулевые координаты
        if (!lat || !lon) return false;
        const dist = haversineDistance(cargoLat, cargoLon, lat, lon);
        return dist <= radiusKm;
      });
    });

    return { ok: true as const, status: 200, items: filtered };
  } catch (error) {
    console.error('Search cars for cargo service error:', error);
    return { ok: false as const, status: 500, error: 'Ошибка поиска автомобилей для груза' };
  }
}