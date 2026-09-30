import { CreateCargoDto, UpdateCargoDto } from './cargo.schema';
import { companyExists, insertCargo, updateCargoById, deleteCargoById, getCargosByCompany, getCargoById } from './cargo.repository';
import { notifyCompanyUsers, notifyOtherCompaniesAboutCargo } from '../notifications/notifications.service';
import { cargo } from '../../db/schema/schema';

const OSRM_URL = process.env.OSRM_URL || 'http://10.1.1.215:5000';

/**
 * Извлекает упрощенные nodes из OSRM ответа.
 * Сохраняет первую, последнюю и каждую 50-ю точку в правильном порядке.
 */
function extractSimplifiedNodes(osrmResponse: any): number[] {
  const r = osrmResponse.routes?.[0];
  if (!r || !r.legs || !Array.isArray(r.legs)) {
    return [];
  }
  
  // Собираем все nodes из всех legs в правильном порядке
  const allNodes: number[] = [];
  
  r.legs.forEach((leg: any, legIndex: number) => {
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
  });
  
  if (allNodes.length === 0) {
    return [];
  }
  
  // Берем каждую 50-ю точку, но гарантируем первую и последнюю
  const simplifiedNodes: number[] = [];
  
  // Всегда первая точка
  simplifiedNodes.push(allNodes[0]);
  
  // Каждая 50-я точка (начиная с 50-й)
  for (let i = 50; i < allNodes.length; i += 50) {
    simplifiedNodes.push(allNodes[i]);
  }
  
  // Всегда последняя точка (если еще не добавлена)
  const lastNode = allNodes[allNodes.length - 1];
  if (simplifiedNodes[simplifiedNodes.length - 1] !== lastNode) {
    simplifiedNodes.push(lastNode);
  }
  
  return simplifiedNodes;
}

/**
 * Строит маршрут через OSRM и возвращает упрощенные nodes.
 */
async function buildCargoRouteNodes(
  departureCoords: { lat: number; lon: number },
  arrivalCoords: { lat: number; lon: number },
  waypoints: Array<{ lat: number; lon: number }> = []
): Promise<number[]> {
  try {
    // Строим полный маршрут: начальная точка + промежуточные + конечная
    const allPoints = [departureCoords, ...waypoints, arrivalCoords];
    const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
    
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'nodes'
    });
    
    const osrmUrl = `${OSRM_URL}/route/v1/driving/${pointsString}?${params.toString()}`;
    console.log('Building cargo route nodes:', osrmUrl);
    
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
    return extractSimplifiedNodes(data);
  } catch (error) {
    console.error('Error building cargo route nodes:', error);
    // Возвращаем пустой массив при ошибке, чтобы не блокировать создание груза
    return [];
  }
}

/**
 * Создать груз.
 */
export async function createCargoService(dto: CreateCargoDto) {
  const exists = await companyExists(dto.id_company);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };

  // Извлекаем координаты для построения маршрута
  let departureCoords: { lat: number; lon: number } | null = null;
  let arrivalCoords: { lat: number; lon: number } | null = null;
  const waypoints: Array<{ lat: number; lon: number }> = [];

  // Получаем координаты точки отправления
  if (dto.departure_place_id) {
    const depKeys = Object.keys(dto.departure_place_id);
    if (depKeys.length > 0) {
      const depPlaceId = depKeys[0];
      departureCoords = (dto.departure_place_id as any)[depPlaceId];
    }
  }

  // Получаем координаты точки прибытия
  if (dto.arrival_place_id) {
    const arrKeys = Object.keys(dto.arrival_place_id);
    if (arrKeys.length > 0) {
      const arrPlaceId = arrKeys[0];
      arrivalCoords = (dto.arrival_place_id as any)[arrPlaceId];
    }
  }

  // Получаем промежуточные точки (waypoints) из departure_place_id
  if (dto.departure_place_id && typeof dto.departure_place_id === 'object' && 'waypoints' in dto.departure_place_id) {
    const waypointsData = (dto.departure_place_id as any).waypoints;
    if (Array.isArray(waypointsData)) {
      waypoints.push(...waypointsData.map((wp: any) => ({ lat: wp.lat, lon: wp.lon })));
    }
  }

  // Строим маршрут и получаем упрощенные nodes
  let routeNodes: number[] = [];
  if (departureCoords && arrivalCoords) {
    routeNodes = await buildCargoRouteNodes(departureCoords, arrivalCoords, waypoints);
    console.log(`Built route with ${routeNodes.length} simplified nodes for cargo`);
  } else {
    console.warn('Cannot build route nodes: missing coordinates');
  }

  const now = new Date();
  const cargo = await insertCargo({
    id_company: dto.id_company as unknown as any,
    created_by: dto.created_by as unknown as any,
    departure_point: dto.departure_point,
    arrival_point: dto.arrival_point,
    id_car_type: dto.id_car_type,
    id_tip_zagryzki: dto.id_tip_zagryzki,
    opisanie: dto.opisanie,
    tonn: dto.tonn,
    m3: dto.m3,
    length: dto.length as any,
    width: dto.width as any,
    height: dto.height as any,
    price: dto.price,
    payment: dto.payment,
    date_start: new Date(dto.date_start),
    date_end: new Date(dto.date_end),
    irrelevant: dto.irrelevant ?? 0,
    departure_place_id: (dto.departure_place_id ?? {}) as any,
    arrival_place_id: (dto.arrival_place_id ?? {}) as any,
    route_nodes: routeNodes as any,
    status: dto.status ?? 0,
    created_at: dto.created_at ? new Date(dto.created_at) : now,
    updated_at: dto.updated_at ? new Date(dto.updated_at) : now,
  });

  // Отправляем уведомление ДРУГИМ компаниям (перевозчикам) о новом грузе
  try {
    await notifyOtherCompaniesAboutCargo(
      dto.id_company, // Исключаем эту компанию
      cargo,
      {
        cargo_id: cargo.id_cargo,
        departure_point: dto.departure_point,
        arrival_point: dto.arrival_point,
        tonn: dto.tonn,
        m3: dto.m3,
        date_start: dto.date_start,
        date_end: dto.date_end,
      }
    );
  } catch (error) {
    console.error('Failed to send notification about new cargo:', error);
    // Не прерываем создание груза, если не удалось отправить уведомление
  }

  return { ok: true as const, status: 201, cargo };
}

/**
 * Обновить груз по ID.
 */
export async function updateCargoService(id: number, dto: UpdateCargoDto) {
  if (dto.id_company) {
    const exists = await companyExists(dto.id_company);
    if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };
  }

  // Получаем текущий груз для проверки изменений маршрута
  const currentCargo = await getCargoById(id);
  if (!currentCargo) return { ok: false as const, status: 404, error: 'Груз не найден' };

  // Проверяем, изменился ли маршрут (нужно пересчитать nodes)
  const routeChanged = 
    dto.departure_place_id !== undefined || 
    dto.arrival_place_id !== undefined;

  // Если маршрут изменился, пересчитываем nodes
  let routeNodes: number[] | undefined = undefined;
  if (routeChanged) {
    // Используем новые значения или текущие из БД
    const departurePlaceId = dto.departure_place_id ?? currentCargo.departure_place_id;
    const arrivalPlaceId = dto.arrival_place_id ?? currentCargo.arrival_place_id;

    let departureCoords: { lat: number; lon: number } | null = null;
    let arrivalCoords: { lat: number; lon: number } | null = null;
    const waypoints: Array<{ lat: number; lon: number }> = [];

    // Получаем координаты точки отправления
    if (departurePlaceId && typeof departurePlaceId === 'object') {
      const depKeys = Object.keys(departurePlaceId);
      if (depKeys.length > 0) {
        const depPlaceId = depKeys[0];
        departureCoords = (departurePlaceId as any)[depPlaceId];
      }

      // Получаем промежуточные точки (waypoints)
      if ('waypoints' in departurePlaceId) {
        const waypointsData = (departurePlaceId as any).waypoints;
        if (Array.isArray(waypointsData)) {
          waypoints.push(...waypointsData.map((wp: any) => ({ lat: wp.lat, lon: wp.lon })));
        }
      }
    }

    // Получаем координаты точки прибытия
    if (arrivalPlaceId && typeof arrivalPlaceId === 'object') {
      const arrKeys = Object.keys(arrivalPlaceId);
      if (arrKeys.length > 0) {
        const arrPlaceId = arrKeys[0];
        arrivalCoords = (arrivalPlaceId as any)[arrPlaceId];
      }
    }

    // Строим маршрут и получаем упрощенные nodes
    if (departureCoords && arrivalCoords) {
      routeNodes = await buildCargoRouteNodes(departureCoords, arrivalCoords, waypoints);
      console.log(`Rebuilt route with ${routeNodes.length} simplified nodes for cargo ${id}`);
    }
  }

  // Приводим типы к ожидаемым БД: даты -> Date, json-поля -> объекты
  const values: Parameters<typeof updateCargoById>[1] = {};
  if (dto.id_company !== undefined) values.id_company = dto.id_company as unknown as any;
  if (dto.departure_point !== undefined) values.departure_point = dto.departure_point;
  if (dto.arrival_point !== undefined) values.arrival_point = dto.arrival_point;
  if (dto.id_car_type !== undefined) values.id_car_type = dto.id_car_type;
  if (dto.id_tip_zagryzki !== undefined) values.id_tip_zagryzki = dto.id_tip_zagryzki;
  if (dto.opisanie !== undefined) values.opisanie = dto.opisanie;
  if (dto.tonn !== undefined) values.tonn = dto.tonn as any;
  if (dto.m3 !== undefined) values.m3 = dto.m3 as any;
  if (dto.length !== undefined) values.length = dto.length as any;
  if (dto.width !== undefined) values.width = dto.width as any;
  if (dto.height !== undefined) values.height = dto.height as any;
  if (dto.price !== undefined) values.price = dto.price as any;
  if (dto.payment !== undefined) values.payment = dto.payment as any;
  if (dto.date_start !== undefined) values.date_start = dto.date_start ? new Date(dto.date_start) : (undefined as any);
  if (dto.date_end !== undefined) values.date_end = dto.date_end ? new Date(dto.date_end) : (undefined as any);
  if (dto.irrelevant !== undefined) values.irrelevant = dto.irrelevant as any;
  if (dto.departure_place_id !== undefined) values.departure_place_id = (dto.departure_place_id ?? {}) as any;
  if (dto.arrival_place_id !== undefined) values.arrival_place_id = (dto.arrival_place_id ?? {}) as any;
  if (routeNodes !== undefined) values.route_nodes = routeNodes as any;
  if (dto.status !== undefined) values.status = dto.status as any;
  if (dto.created_at !== undefined) values.created_at = dto.created_at ? new Date(dto.created_at) : (undefined as any);
  if (dto.updated_at !== undefined) values.updated_at = dto.updated_at ? new Date(dto.updated_at) : (undefined as any);
  
  // Всегда обновляем updated_at при изменении
  values.updated_at = new Date().toISOString() as any;

  const cargo = await updateCargoById(id, values as any);
  if (!cargo) return { ok: false as const, status: 404, error: 'Груз не найден' };

  // Отправляем уведомление о обновлении груза
  try {
    await notifyCompanyUsers(
      cargo.id_company,
      'cargo_updated',
      'Груз обновлен',
      `Обновлен груз из ${cargo.departure_point} в ${cargo.arrival_point}`,
      {
        cargo_id: cargo.id_cargo,
        link: `/company/${cargo.id_company}/cargo`,
      },
      'low'
    );
  } catch (error) {
    console.error('Failed to send notification for cargo update:', error);
  }

  return { ok: true as const, status: 200, cargo };
}

/**
 * Удалить груз по ID.
 */
export async function deleteCargoService(id: number) {
  const cargo = await deleteCargoById(id);
  if (!cargo) return { ok: false as const, status: 404, error: 'Груз не найден' };
  return { ok: true as const, status: 200 };
}

/**
 * Получить список всех грузов компании по ID компании.
 */
export async function getCargosByCompanyService(companyId: string) {
  try {
    const cargos = await getCargosByCompany(companyId);
    return { ok: true as const, status: 200, items: cargos };
  } catch (error) {
    console.error('Error in getCargosByCompanyService:', error);
    return { ok: false as const, status: 500, error: 'Ошибка получения списка грузов' };
  }
}

export async function getCargoByIdService(id: number) {
  const cargo = await getCargoById(id);
  if (!cargo) return { ok: false as const, status: 404, error: 'Груз не найден' };
  return { ok: true as const, status: 200, cargo };
}