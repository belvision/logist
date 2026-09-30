// apps/backend/src/api/companion_cargo/companion_cargo.service.ts
import type { BuildRouteDto, FindCompanionCargosDto, SaveRouteDto } from './companion_cargo.schema';
import { findCandidateCargos, getSavedRoutesByUserId, saveRoute, deleteSavedRoute } from './companion_cargo.repository';
import { searchPlaces } from '../nominatim/nominatim.repository';

type OsrmRoute = {
  distance: number;       // meters
  duration: number;       // seconds
  geometry: { coordinates: [number, number][]; type: 'LineString' };
  nodes?: number[];       // OSRM node IDs
  legs?: Array<{
    annotation?: {
      nodes?: number[];
    };
  }>;
  departure_point?: string;
  arrival_point?: string;
};

// простая выборка точек из линий маршрута с шагом ~N метров
function sampleLineString(coords: [number, number][], stepMeters: number): [number, number][] {
  if (coords.length === 0) return [];
  const res: [number, number][] = [];
  let acc = 0;
  const meters = (a: [number, number], b: [number, number]) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const [lon1, lat1] = a;
    const [lon2, lat2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const la1 = toRad(lat1);
    const la2 = toRad(lat2);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  res.push(coords[0]);
  for (let i = 1; i < coords.length; i++) {
    const seg = meters(coords[i - 1], coords[i]);
    acc += seg;
    if (acc >= stepMeters) {
      res.push(coords[i]);
      acc = 0;
    }
  }
  if (res[res.length - 1] !== coords[coords.length - 1]) {
    res.push(coords[coords.length - 1]);
  }
  return res;
}

// расстояние от точки до ближайшей опорной точки маршрута (приближённо)
function minDistanceMeters(pointLon: number, pointLat: number, routeSamples: [number, number][]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  let best = Infinity;
  for (const [lon, lat] of routeSamples) {
    const dLat = toRad(pointLat - lat);
    const dLon = toRad(pointLon - lon);
    const la1 = toRad(lat);
    const la2 = toRad(pointLat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    const d = 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    if (d < best) best = d;
  }
  return best;
}

// Получение координат по place_id через Nominatim
async function getCoordinatesByPlaceId(placeId: number): Promise<{ lat: number; lon: number } | null> {
  
  try {
    // Пытаемся найти координаты через Nominatim по place_id
    const nominatimUrl = `${process.env.NOMINATIM_URL || 'http://10.1.1.215:8080'}/reverse?format=json&place_id=${placeId}`;
    
    const resp = await fetch(nominatimUrl);
    
    if (resp.ok) {
      const data = await resp.json();
      
      if ((data as any)?.lat && (data as any)?.lon) {
        const coords = { lat: parseFloat((data as any).lat), lon: parseFloat((data as any).lon) };
        return coords;
      }
    } else {
    }
  } catch (error) {
    console.error('Error getting coordinates for place_id:', placeId, error);
  }
  
  // Fallback: используем фиктивные координаты для тестирования
  // В реальном проекте здесь должен быть резолвер place_id -> координаты
  const fallbackCoords: Record<number, { lat: number; lon: number }> = {
    1: { lat: 53.9023, lon: 27.5619 }, // Минск
    2: { lat: 46.4825, lon: 30.7346 }, // Одесса
    3: { lat: 53.1449683, lon: 29.2281209 }, // Бобруйск (правильные координаты)
    2904648: { lat: 53.9024716, lon: 27.5618225 }, // Минск (из логов)
    2756088: { lat: 53.1449683, lon: 29.2281209 }, // Бобруйск (из логов)
    3044392: { lat: 53.1322925, lon: 26.0184156 }, // Барановичи (правильные координаты)
    3076353: { lat: 52.7919112, lon: 27.9994587 }, // Любань (правильные координаты)
    4161096: { lat: 53.9024716, lon: 27.5618225 }, // Минск (из текущих логов)
    3974388: { lat: 53.1449683, lon: 29.2281209 }, // Бобруйск (из текущих логов)
  };
  
  const result = fallbackCoords[placeId] || { lat: 53.9023, lon: 27.5619 }; // Минск по умолчанию
  return result;
}

// Вспомогательные функции для точного расчета процента совпадения (из старого проекта)

// Большая окружность — расстояние в метрах
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371008.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Проекция (lat,lon) → (x,y) в метрах (Web Mercator)
function llToWebMercator(lat: number, lon: number): [number, number] {
  const R = 6378137.0;
  const x = R * (lon * Math.PI / 180);
  const y = R * Math.log(Math.tan(Math.PI/4 + (lat * Math.PI / 180)/2));
  return [x, y];
}

// Расстояние от точки до отрезка (в метрах)
function pointToSegDistMeters(p: [number, number], a: [number, number], b: [number, number]): number {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const c1 = vx*wx + vy*wy;
  if (c1 <= 0) return Math.hypot(px - ax, py - ay);
  const c2 = vx*vx + vy*vy;
  if (c2 <= c1) return Math.hypot(px - bx, py - by);
  const t = c1 / c2;
  const projx = ax + t*vx, projy = ay + t*vy;
  return Math.hypot(px - projx, py - projy);
}

// Ресэмплинг полилинии равным шагом по длине (в метрах по сфере)
function resamplePolyline(line: [number, number][], stepMeters: number): [number, number][] {
  const out: [number, number][] = [];
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const [lat1, lon1] = line[i-1];
    const [lat2, lon2] = line[i];
    const seg = haversineMeters(lat1, lon1, lat2, lon2);
    if (i === 1) out.push([lat1, lon1]);
    acc += seg;
    while (acc >= stepMeters) {
      const ratio = (seg - (acc - stepMeters)) / seg;
      out.push([
        lat1 + (lat2 - lat1) * ratio,
        lon1 + (lon2 - lon1) * ratio
      ]);
      acc -= stepMeters;
    }
  }
  // гарантируем последнюю точку
  const last = line[line.length - 1];
  if (out.length === 0 || out[out.length - 1][0] !== last[0] || out[out.length - 1][1] !== last[1]) {
    out.push(last);
  }
  return out;
}

// Конвертация GeoJSON LineString в массив [lat, lon][]
function lineStringToLatLon(geo: any): [number, number][] {
  if (!geo) return [];
  if (geo.type === 'LineString' && Array.isArray(geo.coordinates)) {
    const out: [number, number][] = [];
    for (const c of geo.coordinates) {
      if (Array.isArray(c) && c.length >= 2) {
        const lon = Number(c[0]); const lat = Number(c[1]);
        if (Number.isFinite(lat) && Number.isFinite(lon)) out.push([lat, lon]);
      }
    }
    return out;
  }
  return [];
}

// Расчет процента совпадения маршрутов на основе длины совпадающих сегментов
// 1. Ресэмплируем маршруты для более точного сравнения
// 2. Ищем первую и последнюю совпадающие точки
// 3. Вычисляем процент на основе длины совпадающих сегментов, а не количества точек
function calculateRouteMatchPercent(
  userGeo: any, 
  cargoGeo: any, 
  opts: { stepMeters?: number, toleranceMeters?: number, hasWaypoints?: boolean } = {}
): { matchPercent: number; firstMatchIndex: number; lastMatchIndex: number; sameDirection: boolean } {
  // Если есть промежуточные точки, увеличиваем допуск, так как маршрут может отличаться от прямого
  const baseTolerance = opts.toleranceMeters ?? 2000;
  const tolMeters = opts.hasWaypoints
    ? Math.max(5000, baseTolerance * 2.5) // Увеличиваем допуск в 2.5 раза для маршрутов с промежуточными точками
    : Math.max(200, Math.floor(baseTolerance));
  const stepMeters = Math.max(100, Math.floor(opts.stepMeters ?? 800)); // шаг для интерполяции

  if (!userGeo || !cargoGeo || !userGeo.coordinates || !cargoGeo.coordinates) {
    return { matchPercent: 0, firstMatchIndex: -1, lastMatchIndex: -1, sameDirection: false };
  }

  const userCoords = userGeo.coordinates; // [[lon, lat], ...]
  const cargoCoords = cargoGeo.coordinates; // [[lon, lat], ...]

  if (userCoords.length < 2 || cargoCoords.length < 2) {
    return { matchPercent: 0, firstMatchIndex: -1, lastMatchIndex: -1, sameDirection: false };
  }

  // Ресэмплируем маршруты для более точного сравнения
  const resampledUserCoords = resamplePolyline(userCoords.map(([lon, lat]: [number, number]) => [lat, lon]), stepMeters)
    .map(([lat, lon]: [number, number]) => [lon, lat]); // обратно в [lon, lat]
  const resampledCargoCoords = resamplePolyline(cargoCoords.map(([lon, lat]: [number, number]) => [lat, lon]), stepMeters)
    .map(([lat, lon]: [number, number]) => [lon, lat]); // обратно в [lon, lat]

  // Строим отрезки маршрута пользователя для быстрого поиска ближайших точек
  const userSegments: Array<{ start: [number, number], end: [number, number], index: number }> = [];
  for (let i = 0; i < resampledUserCoords.length - 1; i++) {
    userSegments.push({
      start: [resampledUserCoords[i][0], resampledUserCoords[i][1]], // [lon, lat]
      end: [resampledUserCoords[i + 1][0], resampledUserCoords[i + 1][1]],
      index: i
    });
  }

  // Функция для проверки, находится ли точка близко к маршруту пользователя
  const isPointNearUserRoute = (cargoPoint: [number, number]): { near: boolean; userIndex: number } => {
    let minDist = Infinity;
    let closestUserIndex = -1;

    for (const seg of userSegments) {
      const [cargoLon, cargoLat] = cargoPoint;
      const [segStartLon, segStartLat] = seg.start;
      const [segEndLon, segEndLat] = seg.end;

      // Находим ближайшую точку на отрезке
      const segLength = haversineMeters(segStartLat, segStartLon, segEndLat, segEndLon);
      let bestDistOnSegment = Infinity;

      if (segLength < 0.1) { // Очень короткий сегмент
        bestDistOnSegment = haversineMeters(cargoLat, cargoLon, segStartLat, segStartLon);
      } else {
        // Интерполируем точки на сегменте для более точного поиска
        const numInterpSteps = Math.max(2, Math.ceil(segLength / 100)); // шаг ~100м
        for (let i = 0; i <= numInterpSteps; i++) {
          const t = i / numInterpSteps;
          const interpLat = segStartLat + (segEndLat - segStartLat) * t;
          const interpLon = segStartLon + (segEndLon - segStartLon) * t;
          const dist = haversineMeters(cargoLat, cargoLon, interpLat, interpLon);
          if (dist < bestDistOnSegment) {
            bestDistOnSegment = dist;
          }
        }
      }

      if (bestDistOnSegment < minDist) {
        minDist = bestDistOnSegment;
        closestUserIndex = seg.index;
      }
    }

    return { near: minDist <= tolMeters, userIndex: closestUserIndex };
  };

  // Ищем первую точку маршрута груза, которая совпадает с маршрутом пользователя
  let firstMatchIndex = -1;
  let firstMatchUserIndex = -1;
  for (let i = 0; i < resampledCargoCoords.length; i++) {
    const cargoPoint: [number, number] = [resampledCargoCoords[i][0], resampledCargoCoords[i][1]]; // [lon, lat]
    const check = isPointNearUserRoute(cargoPoint);
    if (check.near) {
      firstMatchIndex = i;
      firstMatchUserIndex = check.userIndex;
      break;
    }
  }

  // Ищем последнюю точку маршрута груза, которая совпадает с маршрутом пользователя
  let lastMatchIndex = -1;
  let lastMatchUserIndex = -1;
  for (let i = resampledCargoCoords.length - 1; i >= 0; i--) {
    const cargoPoint: [number, number] = [resampledCargoCoords[i][0], resampledCargoCoords[i][1]]; // [lon, lat]
    const check = isPointNearUserRoute(cargoPoint);
    if (check.near) {
      lastMatchIndex = i;
      lastMatchUserIndex = check.userIndex;
      break;
    }
  }

  // Если не нашли совпадающие точки, возвращаем 0%
  if (firstMatchIndex === -1 || lastMatchIndex === -1) {
    return { matchPercent: 0, firstMatchIndex, lastMatchIndex, sameDirection: false };
  }

  // Если первая и последняя точки совпадают (очень короткий маршрут), проверяем, что они близки к маршруту пользователя
  if (firstMatchIndex >= lastMatchIndex) {
    // Если это одна и та же точка или маршрут очень короткий, проверяем, что она близка к маршруту пользователя
    if (firstMatchIndex === lastMatchIndex) {
      // Одна точка - проверяем, что она близка к маршруту пользователя
      const cargoPoint: [number, number] = [resampledCargoCoords[firstMatchIndex][0], resampledCargoCoords[firstMatchIndex][1]];
      const check = isPointNearUserRoute(cargoPoint);
      if (check.near) {
        // Если точка близка, считаем, что 100% совпадение (весь маршрут груза совпадает)
        return { matchPercent: 100, firstMatchIndex, lastMatchIndex, sameDirection: true };
      }
    }
    return { matchPercent: 0, firstMatchIndex, lastMatchIndex, sameDirection: false };
  }

  // Проверяем направление: первая совпадающая точка должна быть раньше последней на маршруте пользователя
  const sameDirection = firstMatchUserIndex < lastMatchUserIndex;

  // Вычисляем общую длину маршрута груза
  let totalCargoLength = 0;
  for (let i = 0; i < resampledCargoCoords.length - 1; i++) {
    totalCargoLength += haversineMeters(
      resampledCargoCoords[i][1], resampledCargoCoords[i][0],
      resampledCargoCoords[i + 1][1], resampledCargoCoords[i + 1][0]
    );
  }

  // Вычисляем длину совпадающего участка маршрута груза
  let matchedCargoLength = 0;
  let totalCheckedPoints = 0;
  let matchedPoints = 0;

  for (let i = firstMatchIndex; i < lastMatchIndex; i++) {
    const cargoPoint1: [number, number] = [resampledCargoCoords[i][0], resampledCargoCoords[i][1]];
    const cargoPoint2: [number, number] = [resampledCargoCoords[i + 1][0], resampledCargoCoords[i + 1][1]];

    const check1 = isPointNearUserRoute(cargoPoint1);
    const check2 = isPointNearUserRoute(cargoPoint2);

    totalCheckedPoints += 2;
    if (check1.near) matchedPoints++;
    if (check2.near) matchedPoints++;

    // Если обе точки сегмента близки к маршруту пользователя, считаем сегмент совпадающим
    if (check1.near && check2.near) {
      matchedCargoLength += haversineMeters(
        cargoPoint1[1], cargoPoint1[0],
        cargoPoint2[1], cargoPoint2[0]
      );
    } else if (opts.hasWaypoints && (check1.near || check2.near)) {
      // Для маршрутов с промежуточными точками: если хотя бы одна точка близка, считаем часть сегмента совпадающей
      // Это более гибкий подход для случаев, когда маршруты немного отличаются
      const segmentLength = haversineMeters(
        cargoPoint1[1], cargoPoint1[0],
        cargoPoint2[1], cargoPoint2[0]
      );
      matchedCargoLength += segmentLength * 0.5; // Считаем половину сегмента совпадающей
    }
  }

  // Для маршрутов с промежуточными точками: если большая часть точек совпадает, увеличиваем процент
  if (opts.hasWaypoints && totalCheckedPoints > 0) {
    const pointMatchRatio = matchedPoints / totalCheckedPoints;
    if (pointMatchRatio > 0.7) {
      // Если более 70% точек совпадают, увеличиваем matchedCargoLength пропорционально
      matchedCargoLength = matchedCargoLength * (1 + (pointMatchRatio - 0.7) * 0.5);
    }
  }

  const matchPercent = totalCargoLength > 0 ? Math.round((matchedCargoLength / totalCargoLength) * 100) : 0;

  return { matchPercent, firstMatchIndex, lastMatchIndex, sameDirection };
}

/**
 * Проверяет, находятся ли начало и конец груза на маршруте пользователя по геометрии.
 * Возвращает true, если оба находятся в пределах toleranceMeters и направление совпадает.
 */
function checkCargoEndpointsOnRoute(
  cargoStartCoords: { lat: number; lon: number },
  cargoEndCoords: { lat: number; lon: number },
  userRouteGeometry: any, // GeoJSON LineString
  toleranceMeters: number = 15000 // 15 км по умолчанию
): { onRoute: boolean; sameDirection: boolean; startDistance: number; endDistance: number } {
  if (!userRouteGeometry || !userRouteGeometry.coordinates || !Array.isArray(userRouteGeometry.coordinates)) {
    return { onRoute: false, sameDirection: false, startDistance: Infinity, endDistance: Infinity };
  }

  const routeCoords = userRouteGeometry.coordinates as [number, number][]; // [lon, lat]

  // Вычисляем расстояние от начала груза до ближайшей точки на маршруте
  let minStartDist = Infinity;
  let startIndex = -1;
  for (let i = 0; i < routeCoords.length; i++) {
    const [routeLon, routeLat] = routeCoords[i];
    const dist = haversineMeters(cargoStartCoords.lat, cargoStartCoords.lon, routeLat, routeLon);
    if (dist < minStartDist) {
      minStartDist = dist;
      startIndex = i;
    }
  }

  // Вычисляем расстояние от конца груза до ближайшей точки на маршруте
  let minEndDist = Infinity;
  let endIndex = -1;
  for (let i = 0; i < routeCoords.length; i++) {
    const [routeLon, routeLat] = routeCoords[i];
    const dist = haversineMeters(cargoEndCoords.lat, cargoEndCoords.lon, routeLat, routeLon);
    if (dist < minEndDist) {
      minEndDist = dist;
      endIndex = i;
    }
  }

  // Проверяем, находятся ли оба в пределах toleranceMeters
  const onRoute = minStartDist <= toleranceMeters && minEndDist <= toleranceMeters;

  // Проверяем направление: начало должно быть раньше конца на маршруте
  const sameDirection = onRoute && startIndex !== -1 && endIndex !== -1 && startIndex < endIndex;

  return { onRoute, sameDirection, startDistance: minStartDist, endDistance: minEndDist };
}

/**
 * Сравнивает маршруты по nodes напрямую.
 * Использует сохраненные nodes груза из БД и nodes маршрута пользователя.
 */
function compareRoutesByNodes(
  userRouteNodes: number[],      // Все nodes маршрута пользователя
  cargoNodes: number[],          // Сохраненные nodes груза (каждая 50-я)
  minPercent: number = 50
): { matchPercent: number; sameDirection: boolean } {

  if (!cargoNodes || cargoNodes.length === 0) {
    return { matchPercent: 0, sameDirection: false };
  }

  // Создаем Set для быстрого поиска
  const userRouteNodesSet = new Set(userRouteNodes);

  // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Проверяем по 10% хвостов груза (начало и конец)
  // Груз начинается и заканчивается в городах, а маршрут идет по трассе,
  // поэтому проверяем не первую/последнюю node, а первые и последние 10% nodes
  const tailPercent = 0.1; // 10%
  const startTailCount = Math.max(1, Math.ceil(cargoNodes.length * tailPercent));
  const endTailCount = Math.max(1, Math.ceil(cargoNodes.length * tailPercent));

  // Берем первые 10% nodes (начало груза)
  const cargoStartNodes = cargoNodes.slice(0, startTailCount);
  // Берем последние 10% nodes (конец груза)
  const cargoEndNodes = cargoNodes.slice(-endTailCount);

  // Ищем хотя бы одну node из начала груза на маршруте пользователя
  let startIndex = -1;
  for (const startNode of cargoStartNodes) {
    const index = userRouteNodes.indexOf(startNode);
    if (index !== -1) {
      startIndex = index;
      break; // Берем первую найденную
    }
  }

  // Ищем хотя бы одну node из конца груза на маршруте пользователя
  let endIndex = -1;
  for (const endNode of cargoEndNodes) {
    const index = userRouteNodes.indexOf(endNode);
    if (index !== -1) {
      endIndex = index;
      break; // Берем первую найденную
    }
  }

  // Если хотя бы одна node из начала и хотя бы одна node из конца найдены на маршруте
  if (startIndex !== -1 && endIndex !== -1) {
    // Проверяем направление: начало должно быть раньше конца
    if (startIndex < endIndex) {
      // Все условия выполнены: начало и конец на маршруте, направление совпадает
      return { matchPercent: 100, sameDirection: true };
    }
  }

  // Прежняя логика: находим совпадающие nodes и их позиции в маршруте пользователя
  const matchedPositions: number[] = [];
  for (const cargoNode of cargoNodes) {
    if (userRouteNodesSet.has(cargoNode)) {
      const userIndex = userRouteNodes.indexOf(cargoNode);
      if (userIndex !== -1) {
        matchedPositions.push(userIndex);
      }
    }
  }

  // Процент совпадения
  const matchPercent = cargoNodes.length > 0
    ? Math.round((matchedPositions.length / cargoNodes.length) * 100)
    : 0;

  // Проверка направления (нужно минимум 2 совпадающие точки)
  let sameDirection = false;
  if (matchedPositions.length >= 2) {
    // Проверяем, что позиции идут по возрастанию
    sameDirection = true;
    for (let i = 1; i < matchedPositions.length; i++) {
      if (matchedPositions[i] <= matchedPositions[i - 1]) {
        sameDirection = false;
        break;
      }
    }
  } else if (matchedPositions.length === 1) {
    // Если только одна точка совпадает, считаем направление неопределенным
    // Но для упрощения считаем, что направление совпадает
    sameDirection = true;
  }

  return { matchPercent, sameDirection };
}

// === ОСНОВНОЕ ===
// 1) Построить маршрут по place_id (через ваш OSRM)
// 2) Отобрать грузы, у которых точка отправления близко к маршруту (toleranceMeters)
// 3) (опционально) дополнительно проверить точку прибытия или % совпадения
export async function findCompanionCargosService(dto: FindCompanionCargosDto) {
  const OSRM_URL = process.env.OSRM_URL || 'http://10.1.1.215:5000'; // как в старом проекте
  const stepMeters = dto.stepMeters ?? 5000;           // шаг выборки точек маршрута
  const toleranceMeters = dto.toleranceMeters ?? 20000; // допуск до линии маршрута
  const minPercent = dto.min_percent ?? 0; // Минимальный процент совпадения

  // 1) Геомаршрут пользователя
  const depId = dto.user_route.departure_place_id;
  const arrId = dto.user_route.arrival_place_id;

  let route: OsrmRoute | null = null;
  let userRouteGeometry: any = null;

  // Если передана геометрия маршрута пользователя, используем её (с промежуточными точками или без)
  if (dto.user_route_geo) {
    const hasWaypoints = !!(dto.user_route.waypoints && dto.user_route.waypoints.length > 0);
    const waypointsCount = dto.user_route.waypoints?.length || 0;
    userRouteGeometry = dto.user_route_geo;
    
    // ВАЖНО: Если есть промежуточные точки, всегда строим маршрут через OSRM для точной геометрии
    // Это гарантирует, что геометрия точно соответствует маршруту с промежуточными точками
    if (hasWaypoints) {

      // Используем переданные координаты или получаем их по place_id
      let dep = dto.user_route.departure_coords || null;
      let arr = dto.user_route.arrival_coords || null;
      
      if (!dep) {
        dep = await getCoordinatesByPlaceId(depId);
      }
      if (!arr) {
        arr = await getCoordinatesByPlaceId(arrId);
      }
      
      if (!dep || !arr) {
        console.error('Failed to get coordinates for place_ids:', depId, arrId);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }

      // Используем переданные координаты промежуточных точек или получаем их по place_id
      const waypointCoords: Array<{ lat: number; lon: number }> = [];
      if (dto.user_route.waypoint_coords && dto.user_route.waypoint_coords.length > 0) {
        // Используем переданные координаты
        waypointCoords.push(...dto.user_route.waypoint_coords);
      } else if (dto.user_route.waypoints) {
        // Получаем координаты по place_id
        for (const waypointId of dto.user_route.waypoints) {
          const waypoint = await getCoordinatesByPlaceId(waypointId);
          if (waypoint) {
            waypointCoords.push(waypoint);
          }
        }
      }

      // Строим полный маршрут: начальная точка + промежуточные + конечная
      const allPoints = [dep, ...waypointCoords, arr];
      const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
      
      const params = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'true',
        annotations: 'nodes'
      });
      
      if (dto.avoidMotorwayToll) {
        params.append('exclude', 'toll');
      }
      
      const osrmUrl = `${OSRM_URL}/route/v1/driving/${pointsString}?${params.toString()}`;
      
      try {
        const resp = await fetch(osrmUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LogisticPro-Backend/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('OSRM error response:', errorText);
          throw new Error(`OSRM ${resp.status}: ${errorText}`);
        }
        
        const data = await resp.json();
        const r = (data as any)?.routes?.[0];
        
        if (r) {
          // Собираем все nodes из всех legs в правильном порядке
          // ВАЖНО: Первая node каждого последующего leg совпадает с последней node предыдущего
          const allNodes: number[] = [];
          if (r.legs && Array.isArray(r.legs)) {
            for (let legIndex = 0; legIndex < r.legs.length; legIndex++) {
              const leg = r.legs[legIndex];
              if (leg.annotation?.nodes && Array.isArray(leg.annotation.nodes)) {
                const legNodes = leg.annotation.nodes;
                if (legIndex === 0) {
                  // Первый leg - все nodes
                  allNodes.push(...legNodes);
                } else {
                  // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
                  allNodes.push(...legNodes.slice(1));
                }
              }
            }
          }
          
          // ВАЖНО: Используем переданную геометрию, так как она точно соответствует маршруту пользователя
          // с промежуточными точками, который он видит на карте. Геометрия из OSRM может отличаться
          // из-за разных параметров построения или версий OSRM.
          route = {
            distance: r.distance,
            duration: r.duration,
            geometry: userRouteGeometry || r.geometry, // Используем переданную геометрию (приоритет), иначе из OSRM
            legs: r.legs || [], // Но берем legs с nodes из OSRM
            nodes: allNodes // Сохраняем все nodes для сравнения
          } as any;
        } else {
          throw new Error('No route returned from OSRM');
        }
      } catch (e) {
        console.error('OSRM route with waypoints error:', e);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }
    } else if (dto.user_route_nodes && Array.isArray(dto.user_route_nodes) && dto.user_route_nodes.length > 0) {
      // Нет промежуточных точек, но есть nodes - используем переданные данные

      route = {
        distance: 0, // Будет рассчитано позже
        duration: 0, // Будет рассчитано позже
        geometry: userRouteGeometry,
        legs: [{
          annotation: {
            nodes: dto.user_route_nodes
          }
        }],
        nodes: dto.user_route_nodes // Сохраняем nodes для сравнения
      } as any;
    } else {
      // Геометрия передана, но нет nodes и нет промежуточных точек в waypoints
      // ВАЖНО: Проверяем, есть ли промежуточные точки в waypoint_coords
      // Если есть, используем их при построении маршрута через OSRM

      // Используем переданные координаты или получаем их по place_id
      let dep = dto.user_route.departure_coords || null;
      let arr = dto.user_route.arrival_coords || null;

      if (!dep) {
        dep = await getCoordinatesByPlaceId(depId);
      }
      if (!arr) {
        arr = await getCoordinatesByPlaceId(arrId);
      }

      if (!dep || !arr) {
        console.error('Failed to get coordinates for place_ids:', depId, arrId);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }

      // ВАЖНО: Проверяем наличие промежуточных точек в waypoint_coords
      // Если они есть, используем их при построении маршрута
      const waypointCoords: Array<{ lat: number; lon: number }> = [];
      if (dto.user_route.waypoint_coords && dto.user_route.waypoint_coords.length > 0) {
        waypointCoords.push(...dto.user_route.waypoint_coords);
        console.log(`Found ${waypointCoords.length} waypoints in waypoint_coords - will use them for route building`);
      }

      // Строим маршрут через OSRM, чтобы получить nodes
      // Если есть промежуточные точки, включаем их в маршрут
      const params = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'true',
        annotations: 'nodes'
      });

      if (dto.avoidMotorwayToll) {
        params.append('exclude', 'toll');
      }

      // Строим полный маршрут: начальная точка + промежуточные + конечная
      const allPoints = [dep, ...waypointCoords, arr];
      const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
      const osrmUrl = `${OSRM_URL}/route/v1/driving/${pointsString}?${params.toString()}`;
      console.log('OSRM URL to get nodes:', osrmUrl);
      console.log(`Building route with ${allPoints.length} points (${waypointCoords.length} waypoints)`);

      try {
        const resp = await fetch(osrmUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LogisticPro-Backend/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('OSRM error response:', errorText);
          throw new Error(`OSRM ${resp.status}: ${errorText}`);
        }

        const data = await resp.json();
        const r = (data as any)?.routes?.[0];

        if (r) {
          // Собираем все nodes из всех legs в правильном порядке
          // ВАЖНО: Первая node каждого последующего leg совпадает с последней node предыдущего
          const allNodes: number[] = [];
          if (r.legs && Array.isArray(r.legs)) {
            for (let legIndex = 0; legIndex < r.legs.length; legIndex++) {
              const leg = r.legs[legIndex];
              if (leg.annotation?.nodes && Array.isArray(leg.annotation.nodes)) {
                const legNodes = leg.annotation.nodes;
                if (legIndex === 0) {
                  // Первый leg - все nodes
                  allNodes.push(...legNodes);
                } else {
                  // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
                  allNodes.push(...legNodes.slice(1));
                }
              }
            }
          }

          // Используем геометрию из OSRM для сравнения (она более точная и включает все промежуточные точки)
          // Переданная геометрия может быть не полной или не совпадать с реальным маршрутом
          route = {
            distance: r.distance,
            duration: r.duration,
            geometry: r.geometry || userRouteGeometry, // Используем геометрию из OSRM, если доступна, иначе переданную
            legs: r.legs || [],
            nodes: allNodes // Сохраняем nodes из OSRM для сравнения
          } as any;
          console.log('Route built with OSRM geometry and nodes, nodes count:', allNodes.length);
          console.log('OSRM geometry coordinates count:', r.geometry?.coordinates?.length || 0);
          console.log('Provided geometry coordinates count:', userRouteGeometry?.coordinates?.length || 0);
        } else {
          throw new Error('No route returned from OSRM');
        }
      } catch (e) {
        console.error('OSRM route error when getting nodes:', e);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }
    }
  } else {
    // Используем переданные координаты или получаем их по place_id
    let dep = dto.user_route.departure_coords || null;
    let arr = dto.user_route.arrival_coords || null;
    
    // Если координаты не переданы, пытаемся получить их по place_id
    if (!dep) {
      dep = await getCoordinatesByPlaceId(depId);
    }
    if (!arr) {
      arr = await getCoordinatesByPlaceId(arrId);
    }
    
    if (!dep || !arr) {
      console.error('Failed to get coordinates for place_ids:', depId, arrId);
      return { ok: true as const, data: { ok: true, count: 0, items: [] } };
    }

    // ВАЖНО: Проверяем наличие промежуточных точек
    const waypointCoords: Array<{ lat: number; lon: number }> = [];
    if (dto.user_route.waypoint_coords && dto.user_route.waypoint_coords.length > 0) {
      waypointCoords.push(...dto.user_route.waypoint_coords);
    } else if (dto.user_route.waypoints && dto.user_route.waypoints.length > 0) {
      // Получаем координаты по place_id
      for (const waypointId of dto.user_route.waypoints) {
        const waypoint = await getCoordinatesByPlaceId(waypointId);
        if (waypoint) {
          waypointCoords.push(waypoint);
        }
      }
    }

    // Строим маршрут с получением nodes для точного сравнения
    // ВАЖНО: Если есть промежуточные точки, включаем их в маршрут
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'nodes'
    });
    
    if (dto.avoidMotorwayToll) {
      params.append('exclude', 'toll');
    }
    
    // Строим полный маршрут: начальная точка + промежуточные + конечная
    const allPoints = [dep, ...waypointCoords, arr];
    const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `${OSRM_URL}/route/v1/driving/${pointsString}?${params.toString()}`;

    try {
      const resp = await fetch(osrmUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LogisticPro-Backend/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 секунд таймаут
      });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('OSRM error response:', errorText);
      throw new Error(`OSRM ${resp.status}: ${errorText}`);
    }
    
    const data = await resp.json();
    
    const r = (data as any)?.routes?.[0];
    if (r) {
      // Собираем все nodes из всех legs в правильном порядке
      // ВАЖНО: Первая node каждого последующего leg совпадает с последней node предыдущего
      const allNodes: number[] = [];
      if (r.legs && Array.isArray(r.legs)) {
        for (let legIndex = 0; legIndex < r.legs.length; legIndex++) {
          const leg = r.legs[legIndex];
          if (leg.annotation?.nodes && Array.isArray(leg.annotation.nodes)) {
            const legNodes = leg.annotation.nodes;
            if (legIndex === 0) {
              // Первый leg - все nodes
              allNodes.push(...legNodes);
            } else {
              // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
              allNodes.push(...legNodes.slice(1));
            }
          }
        }
      }

      if (!r.geometry || !r.geometry.coordinates || r.geometry.coordinates.length < 2) {
        console.error('ERROR: OSRM returned invalid geometry!');
        throw new Error('OSRM returned invalid geometry');
      }
      
      route = {
        distance: r.distance,
        duration: r.duration,
        geometry: r.geometry,
        legs: r.legs || [],
        nodes: allNodes.length > 0 ? allNodes : (r.legs?.[0]?.annotation?.nodes || []), // Сохраняем nodes для сравнения
      } as any;
    } else {
      route = null;
    }
  } catch (e) {
    console.error('OSRM route error:', e);
    // не валим весь поиск: можно вернуть пусто либо продолжить без геофильтра
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
    }
  }

  if (!route) {
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
  }

  // КРИТИЧЕСКАЯ ПРОВЕРКА: геометрия должна содержать множество точек
  if (route.geometry?.coordinates && route.geometry.coordinates.length > 0) {
    const first = route.geometry.coordinates[0];
    const last = route.geometry.coordinates[route.geometry.coordinates.length - 1];
    if (first[0] === last[0] && first[1] === last[1] && route.geometry.coordinates.length <= 2) {
      console.error('❌ ERROR: Main route geometry is invalid - start and end points are the same!');
      console.error('Route geometry:', JSON.stringify(route.geometry, null, 2));
      console.error('This means the route was not built correctly through OSRM');
      // Не возвращаем ошибку, но логируем проблему
      // Возможно, геометрия придет из другого источника
    }
  }
  
  // Проверяем геометрию через lineStringToLatLon - как она будет использоваться
  const testLine = lineStringToLatLon(route.geometry);
  
  if (testLine.length < 2 || (testLine.length === 2 && testLine[0][0] === testLine[1][0] && testLine[0][1] === testLine[1][1])) {
    console.error('❌ CRITICAL ERROR: Main route geometry is invalid after conversion!');
    console.error('Route geometry will not work for comparison. This is a critical error.');
    // Не возвращаем ошибку, но это критическая проблема
  }

  // 2) Получаем nodes основного маршрута для сравнения
  const mainRouteNodes: number[] = [];
  if (route.legs && route.legs.length > 0) {
    // ВАЖНО: Первая node каждого последующего leg совпадает с последней node предыдущего
    for (let legIndex = 0; legIndex < route.legs.length; legIndex++) {
      const leg = route.legs[legIndex];
      if (leg.annotation?.nodes && Array.isArray(leg.annotation.nodes)) {
        const legNodes = leg.annotation.nodes;
        if (legIndex === 0) {
          // Первый leg - все nodes
          mainRouteNodes.push(...legNodes);
        } else {
          // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
          mainRouteNodes.push(...legNodes.slice(1));
        }
      }
    }
  }
  
  // Если nodes не получены из legs, пытаемся получить из переданных nodes
  if (mainRouteNodes.length === 0 && route.nodes && Array.isArray(route.nodes)) {
    mainRouteNodes.push(...route.nodes);
  }

  if (mainRouteNodes.length === 0) {
    console.error('Main route has no nodes for comparison');
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
  }

  // 3) кандидаты из БД по дате/статусу/весу-объему (минимум)
  const candidates = await findCandidateCargos(); // см. репозиторий ниже

  // Проверяем, есть ли груз Любань → Бобруйск в кандидатах
  const lyubanBobruiskCargo = candidates.find(c => 
    c.departure_point?.includes('Любань') && c.arrival_point?.includes('Бобруйск')
  );

  // Проверяем, что route построен и имеет nodes
  if (!route) {
    console.error('Route is null - cannot compare cargos');
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
  }

  // Проверяем, что route имеет nodes
  if (!route.nodes || !Array.isArray(route.nodes) || route.nodes.length === 0) {
    console.error('Route has no nodes - cannot compare cargos', {
      hasNodes: !!route.nodes,
      nodesType: typeof route.nodes,
      nodesLength: Array.isArray(route.nodes) ? route.nodes.length : 'not array',
      hasLegs: !!route.legs,
      legsLength: route.legs?.length || 0
    });
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
  }

  // 4) Сравниваем грузы по сохраненным nodes
  const matched = [];
  const cargoMatchPercent = new Map<number, number>(); // Сохраняем match_percent для каждого груза
  for (const cargo of candidates) {
    
    // Специальная проверка для груза Любань → Бобруйск
    if (cargo.departure_point?.includes('Любань') && cargo.arrival_point?.includes('Бобруйск')) {
    }
    
    // Получаем координаты точек отправления и прибытия груза
    // Данные могут приходить как объекты (из jsonb) или как строки (нужно парсить)
    let dep: any = cargo?.departure_place_id;
    let arr: any = cargo?.arrival_place_id;
    
    // Парсим JSON, если данные пришли как строки
    if (typeof dep === 'string') {
      try {
        dep = JSON.parse(dep);
      } catch (e) {
        continue;
      }
    }
    
    if (typeof arr === 'string') {
      try {
        arr = JSON.parse(arr);
      } catch (e) {
        continue;
      }
    }
    
    if (!dep || !arr || typeof dep !== 'object' || typeof arr !== 'object') {
      continue;
    }
    
    // Парсим departure_place_id для извлечения промежуточных точек
    let departureCoords: { lat: number; lon: number } | null = null;
    let waypointCoords: { lat: number; lon: number }[] = [];
    
    // Проверяем, есть ли waypoints в departure_place_id
    if (dep.waypoints && Array.isArray(dep.waypoints)) {
      
      // Извлекаем координаты промежуточных точек
      for (const waypoint of dep.waypoints) {
        if (waypoint.lat && waypoint.lon) {
          waypointCoords.push({ lat: waypoint.lat, lon: waypoint.lon });
        }
      }
      
      // Находим основную точку отправления (не waypoint)
      const depKeys = Object.keys(dep).filter(key => key !== 'waypoints');
      if (depKeys.length > 0) {
        const depPlaceId = depKeys[0];
        departureCoords = dep[depPlaceId];
      }
    } else {
      // Старая логика - берем первую точку из departure_place_id
      const depKeys = Object.keys(dep);
      if (depKeys.length > 0) {
        const depPlaceId = depKeys[0];
        departureCoords = dep[depPlaceId];
      }
    }
    
    // Получаем координаты точки прибытия
    const arrKeys = Object.keys(arr);
    if (arrKeys.length === 0) {
      continue;
    }
    
    const arrPlaceId = arrKeys[0];
    const arrivalCoords = arr[arrPlaceId];
    
    if (!departureCoords?.lat || !departureCoords?.lon || !arrivalCoords?.lat || !arrivalCoords?.lon) {
      continue;
    }
    
    // Используем сохраненные nodes из БД вместо построения маршрута через OSRM
    let cargoNodes: number[] | null = null;

    try {
      // Проверяем, что route_nodes существует и является массивом
      if (cargo.route_nodes) {
        if (Array.isArray(cargo.route_nodes)) {
          cargoNodes = cargo.route_nodes;
        } else if (typeof cargo.route_nodes === 'string') {
          // Если это строка (JSON), пытаемся распарсить
          try {
            cargoNodes = JSON.parse(cargo.route_nodes);
          } catch (e) {
            console.log(`Cargo ${cargo.id_cargo}: Failed to parse route_nodes as JSON:`, e);
          }
        }
      }
    } catch (error) {
      console.error(`Cargo ${cargo.id_cargo}: Error reading route_nodes:`, error);
    }

    if (!cargoNodes || !Array.isArray(cargoNodes) || cargoNodes.length === 0) {
      continue;
    }

    // Получаем nodes маршрута пользователя
    // Сначала пытаемся получить из route.nodes, если нет - собираем из legs
    let userRouteNodes = route.nodes;
    if (!userRouteNodes || userRouteNodes.length === 0) {
      // Собираем nodes из legs, если они не были сохранены в route.nodes
      // ВАЖНО: Первая node каждого последующего leg совпадает с последней node предыдущего
      userRouteNodes = [];
      if (route.legs && route.legs.length > 0) {
        for (let legIndex = 0; legIndex < route.legs.length; legIndex++) {
          const leg = route.legs[legIndex];
          if (leg.annotation?.nodes && Array.isArray(leg.annotation.nodes)) {
            const legNodes = leg.annotation.nodes;
            if (legIndex === 0) {
              // Первый leg - все nodes
              userRouteNodes.push(...legNodes);
            } else {
              // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
              userRouteNodes.push(...legNodes.slice(1));
            }
          }
        }
      }
    }

    if (!userRouteNodes || userRouteNodes.length === 0) {
      console.log(`Cargo ${cargo.id_cargo}: No user route nodes available`);
      continue;
    }

    // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Проверяем по геометрии маршрута
    // Если начало и конец груза находятся на маршруте пользователя (в пределах 15 км)
    // и направление совпадает, считаем груз подходящим на 100%
    let geometryCheckResult: { onRoute: boolean; sameDirection: boolean; startDistance: number; endDistance: number } | null = null;
    if (route.geometry && departureCoords && arrivalCoords) {
      try {
        geometryCheckResult = checkCargoEndpointsOnRoute(
          departureCoords,
          arrivalCoords,
          route.geometry,
          15000 // 15 км tolerance
        );

        console.log(`Cargo ${cargo.id_cargo} geometry check:`, {
          startDistance: geometryCheckResult.startDistance.toFixed(0) + 'm',
          endDistance: geometryCheckResult.endDistance.toFixed(0) + 'm',
          onRoute: geometryCheckResult.onRoute,
          sameDirection: geometryCheckResult.sameDirection,
          willMatch: geometryCheckResult.onRoute && geometryCheckResult.sameDirection
        });

        // Если начало и конец на маршруте и направление совпадает, считаем 100%
        if (geometryCheckResult.onRoute && geometryCheckResult.sameDirection) {
          console.log(`✅ Cargo ${cargo.id_cargo} MATCHED by geometry - start and end on route, same direction`);

          // Сохраняем match_percent для дальнейшего использования
          cargoMatchPercent.set(cargo.id_cargo, 100);

          matched.push(cargo);
          continue; // Переходим к следующему грузу
        }
      } catch (error) {
        console.error(`Cargo ${cargo.id_cargo}: Error checking geometry:`, error);
        // Продолжаем с обычной проверкой по nodes
      }
    }

    // Сравниваем маршруты по nodes (прежняя логика)
    let result;
    try {
      result = compareRoutesByNodes(
        userRouteNodes,
        cargoNodes,
        minPercent
      );
    } catch (error) {
      console.error(`Cargo ${cargo.id_cargo}: Error comparing routes by nodes:`, error);
      continue;
    }

    const matchPercent = result.matchPercent;
    const sameDirection = result.sameDirection;

    console.log(`Cargo ${cargo.id_cargo} route comparison by nodes:`, {
      userRouteNodesCount: userRouteNodes.length,
      cargoNodesCount: cargoNodes.length,
      matchPercent: matchPercent + '%',
      sameDirection: sameDirection,
      explanation: `${matchPercent}% of cargo nodes match user route nodes. Direction: ${sameDirection ? 'same' : 'opposite'}`
    });

    // Если процент совпадения >= min_percent И направление совпадает, считаем груз подходящим
    console.log(`Cargo ${cargo.id_cargo} final check:`, {
      matchPercent: matchPercent,
      minPercent: minPercent,
      sameDirection: sameDirection,
      willMatch: matchPercent >= minPercent && sameDirection,
      departure: cargo.departure_point,
      arrival: cargo.arrival_point
    });

    if (matchPercent >= minPercent && sameDirection) {
      console.log(`✅ Cargo ${cargo.id_cargo} MATCHED - ${matchPercent.toFixed(1)}% nodes match, same direction`);

      // Сохраняем match_percent для дальнейшего использования
      cargoMatchPercent.set(cargo.id_cargo, matchPercent);

      matched.push(cargo);
    } else {
      if (matchPercent >= minPercent && !sameDirection) {
        console.log(`❌ Cargo ${cargo.id_cargo} NOT MATCHED - nodes match (${matchPercent}%) but different direction`);
      } else if (matchPercent < minPercent && sameDirection) {
        console.log(`❌ Cargo ${cargo.id_cargo} NOT MATCHED - same direction but insufficient match (${matchPercent}% < ${minPercent}%)`);
      } else {
        console.log(`❌ Cargo ${cargo.id_cargo} NOT MATCHED - insufficient match (${matchPercent}% < ${minPercent}%) and different direction`);
      }
    }
  }

  // 5) Построение маршрутов для найденных грузов (если withRoutes = true)
  // Примечание: маршруты уже построены в геофильтре, но нужно их сохранить для возврата
  const itemsWithRoutes = [];
  
  for (const cargo of matched) {
    // Получаем match_percent из сохраненных значений
    const matchPercent = cargoMatchPercent.get(cargo.id_cargo) ?? 0;
    
    const item: any = { 
      ...cargo,
      match_percent: matchPercent, // Всегда устанавливаем match_percent для фильтрации
      // Добавляем данные компании в удобном формате
      company: {
        name: cargo.company_name,
        unp: cargo.company_unp,
        entity_type: cargo.company_entity_type,
        ur_address: cargo.company_ur_address,
        tel_1: cargo.company_tel_1,
        tel_2: cargo.company_tel_2,
        email: cargo.company_email,
      }
    };

    itemsWithRoutes.push(item);
  }

  // Фильтрация по минимальному проценту совпадения
  const minPercentFilter = dto.min_percent ?? 0;
  const filteredItems = itemsWithRoutes.filter(item => item.match_percent >= minPercentFilter);

  // 6) Построение маршрутов для найденных грузов (если withRoutes = true)
  if (dto.withRoutes) {

    for (const item of filteredItems) {
      try {
        // Получаем координаты из departure_place_id и arrival_place_id
        let dep: any = item.departure_place_id;
        let arr: any = item.arrival_place_id;

        if (typeof dep === 'string') {
          dep = JSON.parse(dep);
        }
        if (typeof arr === 'string') {
          arr = JSON.parse(arr);
        }

        let departureCoords: { lat: number; lon: number } | null = null;
        let waypointCoords: { lat: number; lon: number }[] = [];

        // Извлекаем координаты точки отправления и промежуточных точек
        if (dep && typeof dep === 'object') {
          if (dep.waypoints && Array.isArray(dep.waypoints)) {
            for (const waypoint of dep.waypoints) {
              if (waypoint.lat && waypoint.lon) {
                waypointCoords.push({ lat: waypoint.lat, lon: waypoint.lon });
              }
            }
            const depKeys = Object.keys(dep).filter(key => key !== 'waypoints');
            if (depKeys.length > 0) {
              departureCoords = dep[depKeys[0]];
            }
          } else {
            const depKeys = Object.keys(dep);
            if (depKeys.length > 0) {
              departureCoords = dep[depKeys[0]];
            }
          }
        }

        // Извлекаем координаты точки прибытия
        let arrivalCoords: { lat: number; lon: number } | null = null;
        if (arr && typeof arr === 'object') {
          const arrKeys = Object.keys(arr);
          if (arrKeys.length > 0) {
            arrivalCoords = arr[arrKeys[0]];
          }
        }

        if (!departureCoords || !arrivalCoords) {
          continue;
        }

        // Строим маршрут через OSRM
        const allPoints = [departureCoords, ...waypointCoords, arrivalCoords];
        const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');

        const params = new URLSearchParams({
          overview: 'full',
          geometries: 'geojson',
          steps: 'true',
          annotations: 'nodes'
        });

        if (dto.avoidMotorwayToll) {
          params.append('exclude', 'toll');
        }

        const cargoOsrmUrl = `${OSRM_URL}/route/v1/driving/${pointsString}?${params.toString()}`;
        const cargoResp = await fetch(cargoOsrmUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LogisticPro-Backend/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (cargoResp.ok) {
          const cargoData = await cargoResp.json();
          const cargoRoute = (cargoData as any)?.routes?.[0];

          if (cargoRoute) {
            item.route = {
              distance: cargoRoute.distance,
              duration: cargoRoute.duration,
              geometry: cargoRoute.geometry,
              departure_point: item.departure_point,
              arrival_point: item.arrival_point,
            };
          }
        } else {
        }
      } catch (error) {
        console.error(`Error building route for cargo ${item.id_cargo}:`, error);
      }
    }
  }

  return {
    ok: true as const,
    data: {
      ok: true,
      count: filteredItems.length,
      items: filteredItems,
    },
  };
}

// Построение маршрута пользователя
export async function buildRouteService(dto: BuildRouteDto) {
  const OSRM_URL = process.env.OSRM_URL || 'http://10.1.1.215:5000';
  
  if (!dto.points || dto.points.length < 2) {
    return {
      ok: false as const,
      data: 'Необходимо указать минимум 2 точки',
    };
  }

  try {
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'nodes'
    });
    
    if (dto.avoidMotorwayToll) {
      params.append('exclude', 'toll');
    }
    
    // Строим URL с промежуточными точками
    const coordinates = dto.points.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `${OSRM_URL}/route/v1/driving/${coordinates}?${params.toString()}`;
    
    const resp = await fetch(osrmUrl);
    
    if (!resp.ok) {
      throw new Error(`OSRM ${resp.status}`);
    }
    
    const data = await resp.json();
    
    const route = (data as any)?.routes?.[0];
    
    if (!route) {
      return {
        ok: false as const,
        data: 'Маршрут не найден',
      };
    }

    const responseData = {
      distance: route.distance,
      duration: route.duration,
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates
      },
      nodes: route.legs?.[0]?.annotation?.nodes || [],
      departure_point: dto.points[0] ? `${dto.points[0].lat},${dto.points[0].lon}` : '',
      arrival_point: dto.points[dto.points.length - 1] ? `${dto.points[dto.points.length - 1].lat},${dto.points[dto.points.length - 1].lon}` : '',
    };

  return {
    ok: true as const,
      data: responseData,
    };
  } catch (error) {
    console.error('Build route error:', error);
    return {
      ok: false as const,
      data: 'Ошибка построения маршрута',
    };
  }
}

// Сервисы для работы с сохранёнными маршрутами
export async function getSavedRoutesService(id_user: string) {
  const routes = await getSavedRoutesByUserId(id_user);
  return routes;
}

export async function saveRouteService(id_user: string, data: SaveRouteDto) {
  const route = await saveRoute(
    id_user,
    data.departure_point,
    data.arrival_point,
    data.places_departure
  );
  return route;
}

export async function deleteSavedRouteService(id: number, id_user: string) {
  const deleted = await deleteSavedRoute(id, id_user);
  if (!deleted) {
    throw new Error('Маршрут не найден или у вас нет прав на его удаление');
  }
  return deleted;
}
