import { CarSearchPublicDto } from './car_search_public.schema';
import { findCarsInRadius } from './car_search_public.repository';
import { searchPlaces } from '../nominatim/nominatim.repository';

// Радиус Земли в километрах для расчёта расстояния по формуле гаверсина.
const EARTH_RADIUS_KM = 6371;

/**
 * Вычисляет расстояние между двумя точками на поверхности Земли (haversine).
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
 * Публичный поиск автомобилей по местоположению и фильтрам.
 * 1) Получает координаты места поиска через Nominatim.
 * 2) Находит автомобили в радиусе с учетом фильтров.
 * 3) Возвращает автомобили с информацией о компаниях-владельцах.
 */
export async function searchCarsPublicService(dto: CarSearchPublicDto) {
  try {
    // Получаем координаты места поиска через Nominatim
    const places = await searchPlaces(dto.location);
    if (!places || places.length === 0) {
      return { 
        ok: false as const, 
        status: 404, 
        error: 'Место поиска не найдено. Проверьте правильность написания.' 
      };
    }

    // Берем координаты первого совпадения
    const firstPlace = places[0].place;
    const firstKey = Object.keys(firstPlace)[0];
    const searchLat = firstPlace[firstKey].lat;
    const searchLon = firstPlace[firstKey].lon;

    // Находим автомобили в радиусе с фильтрами
    const cars = await findCarsInRadius({
      lat: searchLat,
      lon: searchLon,
      radiusKm: dto.radius!,
      tonnMin: dto.tonn_min,
      tonnMax: dto.tonn_max,
      m3Min: dto.m3_min,
      m3Max: dto.m3_max,
    });

    // Фильтруем автомобили по радиусу (проверяем каждую точку в places)
    const radiusKm = dto.radius!;
    
    // Логируем первые несколько автомобилей для диагностики
    if (cars.length > 0) {
    }
    
    const filteredCars = cars.filter((car: any) => {
      // Парсим places, если это строка (JSONB может вернуться как строка)
      let placesObj: Record<string, { lat: number; lon: number; active?: boolean; label?: string }> | null = null;
      
      if (typeof car.places === 'string') {
        try {
          placesObj = JSON.parse(car.places);
        } catch (e) {
          return false;
        }
      } else if (typeof car.places === 'object' && car.places !== null) {
        placesObj = car.places;
      } else {
        return false;
      }
      
      if (!placesObj || typeof placesObj !== 'object' || Array.isArray(placesObj)) {
        return false;
      }
      
      const placeEntries = Object.entries(placesObj);
      if (placeEntries.length === 0) {
        return false;
      }
      
      const hasMatch = placeEntries.some(([placeId, place]) => {
        // Проверяем, что place - это объект
        if (!place || typeof place !== 'object' || Array.isArray(place)) {
          return false;
        }
        
        const { lat, lon, active } = place;
        
        // Проверяем, что координаты валидны (не null, не undefined, не NaN)
        if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) {
          return false;
        }
        
        // Преобразуем в числа на случай, если они строки
        const latNum = Number(lat);
        const lonNum = Number(lon);
        
        // Пропускаем неактивные места
        if (active === false) {
          return false;
        }
        
        const dist = haversineDistance(searchLat, searchLon, latNum, lonNum);
        const isInRadius = dist <= radiusKm;
        
        return isInRadius;
      });
      
      if (!hasMatch) {
      }
      
      return hasMatch;
    });
    
    // Добавляем информацию о расстоянии до места поиска для каждого автомобиля
    const carsWithDistance = filteredCars.map((car: any) => {
      // Парсим places, если это строка (JSONB может вернуться как строка)
      let placesObj: Record<string, { lat: number; lon: number; active?: boolean; label?: string }> | null = null;
      
      if (typeof car.places === 'string') {
        try {
          placesObj = JSON.parse(car.places);
        } catch (e) {
          placesObj = null;
        }
      } else if (typeof car.places === 'object' && car.places !== null) {
        placesObj = car.places;
      }
      
      let minDistance = Infinity;
      let closestPlace = null;

      if (placesObj && typeof placesObj === 'object' && !Array.isArray(placesObj)) {
        Object.entries(placesObj).forEach(([placeId, place]) => {
          if (!place || typeof place !== 'object' || Array.isArray(place)) {
            return;
          }
          
          const { lat, lon, active } = place;
          
          // Преобразуем в числа на случай, если они строки
          const latNum = Number(lat);
          const lonNum = Number(lon);
          
          // Проверяем, что координаты валидны и место активно
          if (latNum != null && lonNum != null && !isNaN(latNum) && !isNaN(lonNum) && active !== false) {
            const dist = haversineDistance(searchLat, searchLon, latNum, lonNum);
            if (dist < minDistance) {
              minDistance = dist;
              closestPlace = { placeId, lat: latNum, lon: lonNum };
            }
          }
        });
      }

      return {
        ...car,
        distance_km: minDistance === Infinity ? null : Math.round(minDistance * 10) / 10,
        closest_place: closestPlace,
      };
    });

    // Сортируем по расстоянию
    carsWithDistance.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    return { 
      ok: true as const, 
      status: 200, 
      items: carsWithDistance,
      search_location: {
        name: dto.location,
        lat: searchLat,
        lon: searchLon,
      }
    };
  } catch (error) {
    console.error('Public car search service error:', error);
    return { 
      ok: false as const, 
      status: 500, 
      error: 'Ошибка поиска автомобилей' 
    };
  }
}
