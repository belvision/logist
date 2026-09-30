import { CreateCargoDto, UpdateCargoDto } from './cargo.schema';
import { companyExists, insertCargo, updateCargoById, deleteCargoById, getCargosByCompany } from './cargo.repository';

/**
 * Создать груз.
 */
export async function createCargoService(dto: CreateCargoDto) {
  const exists = await companyExists(dto.id_company);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };

  const cargo = await insertCargo({
    id_company: dto.id_company as unknown as any,
    departure_point: dto.departure_point,
    arrival_point: dto.arrival_point,
    id_car_type: dto.id_car_type,
    id_tip_zagryzki: dto.id_tip_zagryzki,
    opisanie: dto.opisanie,
    tonn: dto.tonn,
    m3: dto.m3,
    price: dto.price,
    payment: dto.payment,
    date_start: new Date(dto.date_start),
    date_end: new Date(dto.date_end),
    irrelevant: dto.irrelevant ?? 0,
    departure_place_id: (dto.departure_place_id ?? {}) as any,
    arrival_place_id: (dto.arrival_place_id ?? {}) as any,
    status: dto.status ?? 0,
  });
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
  // Приводим типы к ожидаемым БД: даты -> Date, json-поля -> объекты
  const values: Partial<typeof dto> = {};
  if (dto.id_company !== undefined) values.id_company = dto.id_company as unknown as any;
  if (dto.departure_point !== undefined) values.departure_point = dto.departure_point;
  if (dto.arrival_point !== undefined) values.arrival_point = dto.arrival_point;
  if (dto.id_car_type !== undefined) values.id_car_type = dto.id_car_type;
  if (dto.id_tip_zagryzki !== undefined) values.id_tip_zagryzki = dto.id_tip_zagryzki;
  if (dto.opisanie !== undefined) values.opisanie = dto.opisanie;
  if (dto.tonn !== undefined) values.tonn = dto.tonn as any;
  if (dto.m3 !== undefined) values.m3 = dto.m3 as any;
  if (dto.price !== undefined) values.price = dto.price as any;
  if (dto.payment !== undefined) values.payment = dto.payment as any;
  if (dto.date_start !== undefined) values.date_start = dto.date_start ? new Date(dto.date_start) : (undefined as any);
  if (dto.date_end !== undefined) values.date_end = dto.date_end ? new Date(dto.date_end) : (undefined as any);
  if (dto.irrelevant !== undefined) values.irrelevant = dto.irrelevant as any;
  if (dto.departure_place_id !== undefined) values.departure_place_id = (dto.departure_place_id ?? {}) as any;
  if (dto.arrival_place_id !== undefined) values.arrival_place_id = (dto.arrival_place_id ?? {}) as any;
  if (dto.status !== undefined) values.status = dto.status as any;

  const cargo = await updateCargoById(id, values as any);
  if (!cargo) return { ok: false as const, status: 404, error: 'Груз не найден' };
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