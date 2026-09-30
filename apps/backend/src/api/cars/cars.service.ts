import { CreateCarDto, UpdateCarDto, ToggleCarFlagsDto } from './cars.schema';
import { companyExists, insertCar, updateCarById, deleteCarById, selectCarsByCompany, selectCarById } from './cars.repository';

export async function createCarService(dto: CreateCarDto) {
  const exists = await companyExists(dto.id_company);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };

  const car = await insertCar({
    id_company: dto.id_company as unknown as any,
    title: dto.title,
    id_car_type: dto.id_car_type,
    id_tip_zagryzki: dto.id_tip_zagryzki,
    tonn_min: dto.tonn_min,
    tonn_max: dto.tonn_max,
    m3_min: dto.m3_min,
    m3_max: dto.m3_max,
    price: dto.price,
    subscription: dto.subscription ?? false,
    search: dto.search ?? true,
    places: (dto.places ?? {}) as any,
  });
  return { ok: true as const, status: 201, car };
}

export async function updateCarService(id: number, dto: UpdateCarDto) {
  if (dto.id_company) {
    const exists = await companyExists(dto.id_company);
    if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };
  }
  const car = await updateCarById(id, dto as any);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}

export async function deleteCarService(id: number) {
  const car = await deleteCarById(id);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200 };
}

export async function toggleCarFlagsService(id: number, dto: ToggleCarFlagsDto) {
  const partial: any = {};
  if (dto.subscription !== undefined) partial.subscription = dto.subscription;
  if (dto.search !== undefined) partial.search = dto.search;
  const car = await updateCarById(id, partial);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}

export async function listCarsByCompanyService(companyId: string) {
  const exists = await companyExists(companyId);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };
  const items = await selectCarsByCompany(companyId);
  return { ok: true as const, status: 200, items };
}

export async function getCarByIdService(id: number) {
  const car = await selectCarById(id);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}


