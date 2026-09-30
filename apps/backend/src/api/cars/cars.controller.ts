import { CreateCarSchema, UpdateCarSchema, ToggleCarFlagsSchema } from './cars.schema';
import { createCarService, updateCarService, deleteCarService, toggleCarFlagsService, listCarsByCompanyService, getCarByIdService } from './cars.service';
import db from '../../db/client';
import { tip_car, tip_zagryzki } from '../../db/schema/schema';
import { asc, gt } from 'drizzle-orm';

// схемы вынесены в cars.schema.ts

// ===== Handlers =====
export async function createCarHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCarSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await createCarService(parsed.data);
  return c.json(res.ok ? { ok: true, car: res.car } : { error: res.error }, res.status);
}

export async function updateCarHandler(c: any) {
  const idParam = c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateCarSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await updateCarService(id, parsed.data);
  return c.json(res.ok ? { ok: true, car: res.car } : { error: res.error }, res.status);
}

export async function deleteCarHandler(c: any) {
  const idParam = c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }
  const res = await deleteCarService(id);
  return c.json(res.ok ? { ok: true } : { error: res.error }, res.status);
}

export async function toggleCarFlagsHandler(c: any) {
  const idParam = c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }
  const body = await c.req.json().catch(() => ({}));
  const parsed = ToggleCarFlagsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await toggleCarFlagsService(id, parsed.data);
  return c.json(res.ok ? { ok: true, car: res.car } : { error: res.error }, res.status);
}


// ===== Справочники =====
export async function getCarTypesHandler(c: any) {
  const list = await db
    .select()
    .from(tip_car)
    .where(gt(tip_car.status, 0))
    .orderBy(asc(tip_car.status));
  return c.json({ items: list }, 200);
}

export async function getLoadTypesHandler(c: any) {
  const list = await db
    .select()
    .from(tip_zagryzki)
    .where(gt(tip_zagryzki.status, 0))
    .orderBy(asc(tip_zagryzki.status));
  return c.json({ items: list }, 200);
}

// ===== Список автомобилей по компании =====
export async function listCompanyCarsHandler(c: any) {
  const companyId = (c.req.query('id_company') || '').toString().trim();
  if (!companyId) return c.json({ error: 'id_company обязателен' }, 400);
  const res = await listCarsByCompanyService(companyId);
  return c.json(res.ok ? { items: res.items } : { error: res.error }, res.status);
}

// ===== Получить автомобиль по ID =====
export async function getCarByIdHandler(c: any) {
  const id = parseInt(c.req.param('id') || '0');
  if (!id || isNaN(id)) return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
  const res = await getCarByIdService(id);
  return c.json(res.ok ? res.car : { error: res.error }, res.status);
}


