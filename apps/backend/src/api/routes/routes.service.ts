import { CreateRouteDto, UpdateRouteDto } from './routes.schema';
import { carExists, insertRoute, updateRouteById, deleteRouteById, selectRoutesByCompany, getUserCompany } from './routes.repository';

export async function createRouteService(dto: CreateRouteDto) {
  // Проверяем наличие автомобиля (обязательное поле)
  if (!dto.id_cars) {
    return { ok: false as const, status: 400, error: 'Необходимо выбрать автомобиль' };
  }

  const exists = await carExists(dto.id_cars);
  if (!exists) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  const route = await insertRoute({
    id_cars: dto.id_cars,
    id_company: dto.id_company!,
    created_by: dto.created_by!,
    departure_point: dto.departure_point,
    arrival_point: dto.arrival_point,
    places_departure: (dto.places_departure ?? {}) as any,
    places_arrival: (dto.places_arrival ?? {}) as any,
    date_start: dto.date_start ? new Date(dto.date_start) : new Date(),
    opisanie: dto.opisanie,
  });
  return { ok: true as const, status: 201, route };
}

export async function updateRouteService(id: number, dto: UpdateRouteDto) {
  // Если обновляется id_cars, проверяем его существование
  if (dto.id_cars !== undefined) {
    if (!dto.id_cars) {
      return { ok: false as const, status: 400, error: 'Необходимо выбрать автомобиль' };
    }
    const exists = await carExists(dto.id_cars);
    if (!exists) {
      return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
    }
  }
  // Приводим типы к ожидаемым БД: даты -> Date, json-поля -> объекты
  const values: Partial<typeof import('../../db/schema/schema').routes.$inferInsert> = {};
  if (dto.id_cars !== undefined) values.id_cars = dto.id_cars as any;
  if (dto.departure_point !== undefined) values.departure_point = dto.departure_point as any;
  if (dto.arrival_point !== undefined) values.arrival_point = dto.arrival_point as any;
  if (dto.places_departure !== undefined) values.places_departure = (dto.places_departure ?? {}) as any;
  if (dto.places_arrival !== undefined) values.places_arrival = (dto.places_arrival ?? {}) as any;
  if (dto.date_start !== undefined) values.date_start = dto.date_start ? new Date(dto.date_start) : (undefined as any);
  if (dto.opisanie !== undefined) values.opisanie = dto.opisanie as any;

  const route = await updateRouteById(id, values);
  if (!route) return { ok: false as const, status: 404, error: 'Маршрут не найден' };
  return { ok: true as const, status: 200, route };
}

export async function deleteRouteService(id: number) {
  const route = await deleteRouteById(id);
  if (!route) return { ok: false as const, status: 404, error: 'Маршрут не найден' };
  return { ok: true as const, status: 200 };
}

export async function listCompanyRoutesService(companyId: string) {
  try {
    const routes = await selectRoutesByCompany(companyId);
    return { ok: true as const, status: 200, items: routes };
  } catch (error) {
    console.error('Error in listCompanyRoutesService:', error);
    return { ok: false as const, status: 500, error: 'Ошибка получения списка маршрутов' };
  }
}

export async function getUserCompanyService(userId: string) {
  try {
    const userCompany = await getUserCompany(userId);
    if (!userCompany) {
      return { ok: false as const, status: 400, error: 'Пользователь не состоит ни в одной компании' };
    }
    return { ok: true as const, status: 200, company: userCompany };
  } catch (error) {
    console.error('Error in getUserCompanyService:', error);
    return { ok: false as const, status: 500, error: 'Ошибка получения компании пользователя' };
  }
}
