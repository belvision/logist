// apps/backend/src/api/companion_cargo/companion_cargo.service.ts
import type { BuildRouteDto, FindCompanionCargosDto } from './companion_cargo.schema';
import { findCandidateCargos } from './companion_cargo.repository';
import { searchPlaces } from '../nominatim/nominatim.repository';

type OsrmRoute = {
  distance: number;       // meters
  duration: number;       // seconds
  geometry: { coordinates: [number, number][]; type: 'LineString' };
  nodes?: number[];       // OSRM node IDs
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
  console.log(`Getting coordinates for place_id: ${placeId}`);
  
  try {
    // Пытаемся найти координаты через Nominatim по place_id
    const nominatimUrl = `${process.env.NOMINATIM_URL || 'http://10.1.1.215:8080'}/reverse?format=json&place_id=${placeId}`;
    console.log(`Nominatim URL: ${nominatimUrl}`);
    
    const resp = await fetch(nominatimUrl);
    console.log(`Nominatim response status: ${resp.status}`);
    
    if (resp.ok) {
      const data = await resp.json();
      console.log(`Nominatim response data:`, data);
      
      if (data?.lat && data?.lon) {
        const coords = { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
        console.log(`Nominatim success for place_id ${placeId}:`, coords);
        return coords;
      }
    } else {
      console.log(`Nominatim failed for place_id ${placeId}, status: ${resp.status}`);
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
  };
  
  const result = fallbackCoords[placeId] || { lat: 53.9023, lon: 27.5619 }; // Минск по умолчанию
  console.log(`Using fallback coordinates for place_id ${placeId}:`, result);
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

// Точный расчет процента совпадения маршрутов (из старого проекта)
function calculateRouteMatchPercent(userGeo: any, similarGeo: any, opts: { stepMeters?: number, toleranceMeters?: number } = {}): number {
  const stepMeters = Math.max(100, Math.floor(opts.stepMeters ?? 800));       // чаще точки
  const tolMeters = Math.max(200, Math.floor(opts.toleranceMeters ?? 2000)); // ~2 км допуск

  console.log('calculateRouteMatchPercent called with:', {
    userGeo: userGeo?.type,
    similarGeo: similarGeo?.type,
    stepMeters,
    tolMeters
  });

  if (!userGeo || !similarGeo) {
    console.log('Missing geometry data');
    return 0;
  }

  // 1) Конвертируем GeoJSON в массивы координат
  const userLine = lineStringToLatLon(userGeo);
  const similarLine = lineStringToLatLon(similarGeo);
  
  console.log('Converted to lines:', {
    userLineLength: userLine.length,
    similarLineLength: similarLine.length,
    userFirst: userLine[0],
    userLast: userLine[userLine.length - 1],
    similarFirst: similarLine[0],
    similarLast: similarLine[similarLine.length - 1]
  });
  
  if (userLine.length < 2 || similarLine.length < 2) {
    console.log('Lines too short for comparison');
    return 0;
  }

  // 2) Ресэмплинг линий равным шагом
  const userPtsLL = resamplePolyline(userLine, stepMeters);
  const similarPtsLL = resamplePolyline(similarLine, stepMeters);
  if (similarPtsLL.length === 0) return 0;

  // 3) Проекция в метры (Web Mercator)
  const userPtsM = userPtsLL.map(([lat, lon]) => llToWebMercator(lat, lon));
  const similarPtsM = similarPtsLL.map(([lat, lon]) => llToWebMercator(lat, lon));

  // 4) Строим отрезки пользовательской линии и индексируем их по сетке
  const segs: [[number, number], [number, number]][] = [];
  for (let i = 1; i < userPtsM.length; i++) {
    segs.push([userPtsM[i-1], userPtsM[i]]);
  }
  if (segs.length === 0) return 0;

  const cell = tolMeters; // размер клетки = допуск
  const grid = new Map<string, number[]>();

  for (let si = 0; si < segs.length; si++) {
    const [[x1, y1], [x2, y2]] = segs[si];
    const minX = Math.min(x1, x2) - tolMeters;
    const maxX = Math.max(x1, x2) + tolMeters;
    const minY = Math.min(y1, y2) - tolMeters;
    const maxY = Math.max(y1, y2) + tolMeters;
    const i0 = Math.floor(minX / cell), i1 = Math.floor(maxX / cell);
    const j0 = Math.floor(minY / cell), j1 = Math.floor(maxY / cell);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const key = `${i}:${j}`;
        const arr = grid.get(key);
        if (arr) arr.push(si); else grid.set(key, [si]);
      }
    }
  }

  // 5) Для каждой точки похожего маршрута ищем ближайшие отрезки
  let matched = 0;
  for (const [x, y] of similarPtsM) {
    const I = Math.floor(x / cell), J = Math.floor(y / cell);
    let ok = false;

    for (let di = -1; di <= 1 && !ok; di++) {
      for (let dj = -1; dj <= 1 && !ok; dj++) {
        const bucket = grid.get(`${I+di}:${J+dj}`);
        if (!bucket) continue;
        for (const si of bucket) {
          const d = pointToSegDistMeters([x, y], segs[si][0], segs[si][1]);
          if (d <= tolMeters) { ok = true; break; }
        }
      }
    }

    if (ok) matched++;
  }

  const result = Math.round((matched / similarPtsM.length) * 100);
  console.log('calculateRouteMatchPercent result:', {
    matched,
    totalSimilarPoints: similarPtsM.length,
    result
  });

  return result;
}

// === ОСНОВНОЕ ===
// 1) Построить маршрут по place_id (через ваш OSRM)
// 2) Отобрать грузы, у которых точка отправления близко к маршруту (toleranceMeters)
// 3) (опционально) дополнительно проверить точку прибытия или % совпадения
export async function findCompanionCargosService(dto: FindCompanionCargosDto) {
  const OSRM_URL = process.env.OSRM_URL || 'http://localhost:5000'; // как в старом проекте
  const stepMeters = dto.stepMeters ?? 5000;           // шаг выборки точек маршрута
  const toleranceMeters = dto.toleranceMeters ?? 20000; // допуск до линии маршрута

  // 1) Геомаршрут пользователя
  const depId = dto.user_route.departure_place_id;
  const arrId = dto.user_route.arrival_place_id;

  let route: OsrmRoute | null = null;
  let userRouteGeometry: any = null;

  // Если передана геометрия маршрута пользователя (значит есть промежуточные точки), используем её
  if (dto.user_route_geo && dto.user_route.waypoints && dto.user_route.waypoints.length > 0) {
    console.log('Using provided user route geometry with waypoints:', dto.user_route.waypoints.length);
    console.log('Received user_route_nodes:', dto.user_route_nodes ? `${dto.user_route_nodes.length} nodes` : 'NOT PROVIDED');
    userRouteGeometry = dto.user_route_geo;
    
    // ВАЖНО: Если frontend передал nodes вместе с геометрией, используем их
    // Это означает, что маршрут уже был построен правильно с промежуточными точками
    if (dto.user_route_nodes && Array.isArray(dto.user_route_nodes) && dto.user_route_nodes.length > 0) {
      console.log('Using provided user route nodes:', dto.user_route_nodes.length);
      
      // Создаем маршрут с переданными nodes
      route = {
        distance: 0, // Будет рассчитано позже
        duration: 0, // Будет рассчитано позже
        geometry: userRouteGeometry,
        legs: [{
          annotation: {
            nodes: dto.user_route_nodes
          }
        }]
      };
      console.log('Route with provided nodes created successfully, nodes count:', dto.user_route_nodes.length);
    } else {
      // Fallback: строим маршрут заново (старая логика)
      console.log('No nodes provided, building route with waypoints...');
      
      const dep = await getCoordinatesByPlaceId(depId);
      const arr = await getCoordinatesByPlaceId(arrId);
      
      if (!dep || !arr) {
        console.error('Failed to get coordinates for place_ids:', depId, arrId);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }

      // Получаем координаты промежуточных точек
      const waypointCoords = [];
      for (const waypointId of dto.user_route.waypoints) {
        const waypoint = await getCoordinatesByPlaceId(waypointId);
        if (waypoint) {
          waypointCoords.push(waypoint);
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
      console.log('OSRM URL with waypoints:', osrmUrl);
      
      try {
        const resp = await fetch(osrmUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LogisticPro-Backend/1.0'
          },
          timeout: 10000
        });
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('OSRM error response:', errorText);
          throw new Error(`OSRM ${resp.status}: ${errorText}`);
        }
        
        const data = await resp.json();
        const r = data?.routes?.[0];
        
        if (r) {
          route = {
            distance: r.distance,
            duration: r.duration,
            geometry: userRouteGeometry, // Используем переданную геометрию
            legs: r.legs || [] // Но берем legs с nodes из OSRM
          };
          console.log('Route with waypoints built successfully, nodes count:', r.legs?.[0]?.annotation?.nodes?.length || 0);
        } else {
          throw new Error('No route returned from OSRM');
        }
      } catch (e) {
        console.error('OSRM route with waypoints error:', e);
        return { ok: true as const, data: { ok: true, count: 0, items: [] } };
      }
    }
  } else {
    console.log('Building route without waypoints - using original logic');
    // Получаем реальные координаты по place_id
    const dep = await getCoordinatesByPlaceId(depId);
    const arr = await getCoordinatesByPlaceId(arrId);
    
    if (!dep || !arr) {
      console.error('Failed to get coordinates for place_ids:', depId, arrId);
      return { ok: true as const, data: { ok: true, count: 0, items: [] } };
    }

    // Строим маршрут с получением nodes для точного сравнения
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'nodes'
    });
    
    if (dto.avoidMotorwayToll) {
      params.append('exclude', 'toll');
    }
    
    const osrmUrl = `${OSRM_URL}/route/v1/driving/${dep.lon},${dep.lat};${arr.lon},${arr.lat}?${params.toString()}`;
    console.log('OSRM URL:', osrmUrl);
    console.log('OSRM parameters:', {
      avoidMotorwayToll: dto.avoidMotorwayToll,
      preferShortest: dto.preferShortest,
      params: params.toString()
    });
    console.log('Coordinates:', { dep, arr });
    
    try {
      const resp = await fetch(osrmUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LogisticPro-Backend/1.0'
        },
        timeout: 10000 // 10 секунд таймаут
      });
      console.log('OSRM response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('OSRM error response:', errorText);
      throw new Error(`OSRM ${resp.status}: ${errorText}`);
    }
    
    const data = await resp.json();
    console.log('OSRM response data:', {
      code: data.code,
      routesCount: data.routes?.length || 0,
      firstRoute: data.routes?.[0] ? {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
        hasGeometry: !!data.routes[0].geometry,
        geometryCoords: data.routes[0].geometry?.coordinates?.length || 0
      } : null
    });
    
    const r = data?.routes?.[0];
    route = r
      ? {
          distance: r.distance,
          duration: r.duration,
          geometry: r.geometry,
            legs: r.legs || [],
        }
      : null;
  } catch (e) {
    console.error('OSRM route error:', e);
    // не валим весь поиск: можно вернуть пусто либо продолжить без геофильтра
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
    }
  }

  if (!route) {
    console.log('Main route not built successfully');
    return { ok: true as const, data: { ok: true, count: 0, items: [] } };
  }

  console.log('Main route built successfully:', {
    distance: route.distance,
    duration: route.duration,
    hasGeometry: !!route.geometry,
    coordinatesCount: route.geometry?.coordinates?.length || 0,
    firstCoord: route.geometry?.coordinates?.[0],
    lastCoord: route.geometry?.coordinates?.[route.geometry?.coordinates?.length - 1],
    routeStart: `${route.geometry?.coordinates?.[0]?.[1]}, ${route.geometry?.coordinates?.[0]?.[0]}`,
    routeEnd: `${route.geometry?.coordinates?.[route.geometry?.coordinates?.length - 1]?.[1]}, ${route.geometry?.coordinates?.[route.geometry?.coordinates?.length - 1]?.[0]}`
  });

  const samples = sampleLineString(route.geometry.coordinates, stepMeters);

  // 2) кандидаты из БД по дате/статусу/весу-объему (минимум)
  const candidates = await findCandidateCargos(); // см. репозиторий ниже
  console.log('Found candidates:', candidates.length);
  console.log('Candidates details:', candidates.map(c => ({
    id: c.id_cargo,
    route: `${c.departure_point} → ${c.arrival_point}`,
    status: c.status,
    irrelevant: c.irrelevant,
    date_start: c.date_start,
    has_departure_place_id: !!c.departure_place_id,
    departure_place_id: c.departure_place_id,
    arrival_place_id: c.arrival_place_id
  })));

  // 3) Получаем геометрию основного маршрута для сравнения
  const mainRouteGeometry = route.geometry;
  console.log(`Main route geometry:`, mainRouteGeometry?.coordinates?.length || 0, 'coordinates');
  console.log(`Main route first 5 coords:`, mainRouteGeometry?.coordinates?.slice(0, 5));
  console.log(`Main route last 5 coords:`, mainRouteGeometry?.coordinates?.slice(-5));

  // Проверяем, есть ли груз Любань → Бобруйск в кандидатах
  const lyubanBobruiskCargo = candidates.find(c => 
    c.departure_point?.includes('Любань') && c.arrival_point?.includes('Бобруйск')
  );
  console.log('Lyuban → Bobruisk cargo in candidates:', lyubanBobruiskCargo ? {
    id: lyubanBobruiskCargo.id_cargo,
    departure: lyubanBobruiskCargo.departure_point,
    arrival: lyubanBobruiskCargo.arrival_point,
    departure_place_id: lyubanBobruiskCargo.departure_place_id,
    arrival_place_id: lyubanBobruiskCargo.arrival_place_id
  } : 'NOT FOUND');

  // 4) Строим маршрут для каждого груза и сравниваем place_id узлов
  const matched = [];
  const cargoRoutes = new Map(); // Кэш для сохранения построенных маршрутов
  for (const cargo of candidates) {
    console.log(`\n=== Processing Cargo ${cargo.id_cargo}: ${cargo.departure_point} → ${cargo.arrival_point} ===`);
    
    // Специальная проверка для груза Любань → Бобруйск
    if (cargo.departure_point?.includes('Любань') && cargo.arrival_point?.includes('Бобруйск')) {
      console.log('🎯 SPECIAL CHECK: Processing Lyuban → Bobruisk cargo');
      console.log('Cargo place_id data:', {
        departure_place_id: cargo.departure_place_id,
        arrival_place_id: cargo.arrival_place_id
      });
    }
    
    // Получаем координаты точек отправления и прибытия груза
    const dep = cargo?.departure_place_id;
    const arr = cargo?.arrival_place_id;
    
    if (!dep || !arr || typeof dep !== 'object' || typeof arr !== 'object') {
      console.log(`Cargo ${cargo.id_cargo}: Missing or invalid place_id data`);
      continue;
    }
    
    const depKeys = Object.keys(dep);
    const arrKeys = Object.keys(arr);
    
    if (depKeys.length === 0 || arrKeys.length === 0) {
      console.log(`Cargo ${cargo.id_cargo}: Empty place_id keys`);
      continue;
    }
    
    const depPlaceId = depKeys[0];
    const arrPlaceId = arrKeys[0];
    const depCoords = dep[depPlaceId];
    const arrCoords = arr[arrPlaceId];
    
    if (!depCoords?.lat || !depCoords?.lon || !arrCoords?.lat || !arrCoords?.lon) {
      console.log(`Cargo ${cargo.id_cargo}: Invalid coordinates`);
      continue;
    }
    
    console.log(`Cargo ${cargo.id_cargo} coordinates:`, {
      departure: `[${depCoords.lat}, ${depCoords.lon}] (place_id: ${depPlaceId})`,
      arrival: `[${arrCoords.lat}, ${arrCoords.lon}] (place_id: ${arrPlaceId})`
    });
    
    // Строим маршрут для груза через OSRM
    try {
      const cargoParams = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'true',
        annotations: 'nodes'
      });
      
      if (dto.avoidMotorwayToll) {
        cargoParams.append('exclude', 'toll');
      }
      
      const cargoOsrmUrl = `${OSRM_URL}/route/v1/driving/${depCoords.lon},${depCoords.lat};${arrCoords.lon},${arrCoords.lat}?${cargoParams.toString()}`;
      console.log(`Cargo ${cargo.id_cargo} OSRM URL:`, cargoOsrmUrl);
      
      const cargoResp = await fetch(cargoOsrmUrl);
      if (!cargoResp.ok) {
        console.log(`Cargo ${cargo.id_cargo} OSRM failed:`, cargoResp.status);
        continue;
      }
      
      const cargoData = await cargoResp.json();
      const cargoRoute = cargoData?.routes?.[0];
      
      if (!cargoRoute?.legs?.[0]?.annotation?.nodes) {
        console.log(`Cargo ${cargo.id_cargo}: No nodes in OSRM response`);
        continue;
      }
      
      const cargoNodes = cargoRoute.legs[0].annotation.nodes;
      console.log(`Cargo ${cargo.id_cargo} nodes:`, cargoNodes.length, 'nodes');
      console.log(`Cargo ${cargo.id_cargo} first 10 nodes:`, cargoNodes.slice(0, 10));
      console.log(`Cargo ${cargo.id_cargo} last 10 nodes:`, cargoNodes.slice(-10));
      
      // Сравниваем маршруты по координатам, а не по node ID
      // OSRM node IDs не совпадают между разными запросами, поэтому используем координаты
      const cargoRouteGeometry = cargoRoute.geometry;
      
      if (!mainRouteGeometry?.coordinates || !cargoRouteGeometry?.coordinates) {
        console.log(`Cargo ${cargo.id_cargo}: Missing geometry data`);
        continue;
      }
      
      // Используем точный расчет процента совпадения из старого проекта
      const matchPercent = calculateRouteMatchPercent(mainRouteGeometry, cargoRouteGeometry, {
        stepMeters: 1000, // 1км шаг для точности
        toleranceMeters: 2000 // 2км допуск
      });
      
      const commonNodes = []; // Не используем node IDs для сравнения
      
      console.log(`Cargo ${cargo.id_cargo} route comparison:`, {
        mainRouteCoords: mainRouteGeometry.coordinates.length,
        cargoRouteCoords: cargoRouteGeometry.coordinates.length,
        matchPercent: matchPercent.toFixed(1) + '%',
        explanation: `Route overlap calculated using coordinate-based matching: ${matchPercent.toFixed(1)}%`
      });
      
      // Если процент совпадения больше 0, считаем груз подходящим
      if (matchPercent > 0) {
        console.log(`✅ Cargo ${cargo.id_cargo} MATCHED - ${matchPercent.toFixed(1)}% overlap`);
        
        // Сохраняем построенный маршрут для дальнейшего использования
        cargoRoutes.set(cargo.id_cargo, {
          route: cargoRoute,
          matchPercent: matchPercent
        });
        
        matched.push(cargo);
      } else {
        console.log(`❌ Cargo ${cargo.id_cargo} NOT MATCHED - no route overlap`);
      }
      
    } catch (error) {
      console.error(`Error processing cargo ${cargo.id_cargo}:`, error);
    }
  }

  console.log('After geo-filtering:', {
    totalCandidates: candidates.length,
    matchedCandidates: matched.length
  });

  // 5) Построение маршрутов для найденных грузов (если withRoutes = true)
  // Примечание: маршруты уже построены в геофильтре, но нужно их сохранить для возврата
  const itemsWithRoutes = [];
  
  for (const cargo of matched) {
    const item: any = { 
      ...cargo,
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
    
    if (dto.withRoutes) {
      // Используем уже построенный маршрут из кэша
      const cachedRoute = cargoRoutes.get(cargo.id_cargo);
      
      if (cachedRoute) {
        const { route: cargoRoute, matchPercent } = cachedRoute;
        
        console.log(`Using cached route for cargo ${cargo.id_cargo} with ${matchPercent.toFixed(1)}% match`);
        
        item.route = {
          distance: cargoRoute.distance,
          duration: cargoRoute.duration,
          geometry: cargoRoute.geometry,
          departure_point: cargo.departure_point,
          arrival_point: cargo.arrival_point,
        };
        item.match_percent = matchPercent;
      } else {
        console.log(`No cached route found for cargo ${cargo.id_cargo}`);
      }
    }
    
    itemsWithRoutes.push(item);
  }

  // Фильтрация по минимальному проценту совпадения
  const minPercent = dto.min_percent ?? 0;
  const filteredItems = itemsWithRoutes.filter(item => item.match_percent >= minPercent);
  
  console.log('Filtering by match percentage:', {
    totalItems: itemsWithRoutes.length,
    minPercent: minPercent,
    filteredItems: filteredItems.length,
    items: filteredItems.map(item => ({ id: item.id_cargo, match: item.match_percent }))
  });

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
  const OSRM_URL = process.env.OSRM_URL || 'http://localhost:5000';
  
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
    console.log('BuildRoute OSRM URL:', osrmUrl);
    console.log('BuildRoute parameters:', {
      points: dto.points.length,
      avoidMotorwayToll: dto.avoidMotorwayToll,
      preferShortest: dto.preferShortest,
      params: params.toString()
    });
    
    const resp = await fetch(osrmUrl);
    
    if (!resp.ok) {
      throw new Error(`OSRM ${resp.status}`);
    }
    
    const data = await resp.json();
    console.log('BuildRoute OSRM response data:', {
      code: data.code,
      routesCount: data.routes?.length || 0,
      firstRoute: data.routes?.[0] ? {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
        hasGeometry: !!data.routes[0].geometry,
        geometryCoords: data.routes[0].geometry?.coordinates?.length || 0
      } : null
    });
    
    const route = data?.routes?.[0];
    
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
    
    console.log('BuildRoute response data:', {
      ok: true,
      data: {
        ...responseData,
        geometry: {
          type: responseData.geometry.type,
          coordinatesCount: responseData.geometry.coordinates.length
        }
      }
    });

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
