import { CreateRouteDto, UpdateRouteDto } from './routes.schema';
import { carExists, insertRoute, updateRouteById, deleteRouteById } from './routes.repository';

export async function createRouteService(dto: CreateRouteDto) {
  if (dto.id_cars) {
    const exists = await carExists(dto.id_cars);
    if (!exists) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  const route = await insertRoute({
    id_cars: dto.id_cars,
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
  if (dto.id_cars) {
    const exists = await carExists(dto.id_cars);
    if (!exists) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
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
