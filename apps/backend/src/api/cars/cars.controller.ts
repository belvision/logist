import { CreateCarSchema, UpdateCarSchema, ToggleCarFlagsSchema, AddDriverToCarSchema, RemoveDriverFromCarSchema } from './cars.schema';
import { createCarService, updateCarService, deleteCarService, toggleCarFlagsService, listCarsByCompanyService, getCarByIdService, uploadCarImagesService, deleteCarImageService, addDriverToCarService, removeDriverFromCarService, getCarDriversService, getCompanyDriversService } from './cars.service';
import { isUserInCompany } from '../company/company.repository';
import db from '../../db/client';
import { tip_car, tip_zagryzki } from '../../db/schema/schema';
import { asc, gt } from 'drizzle-orm';
import { parseMultipartForm, validateImages } from '../../lib/fileUpload';

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

// ===== Загрузка изображений для автомобиля =====
export async function uploadCarImagesHandler(c: any) {
  try {
    const id = parseInt(c.req.param('id') || '0');
    if (!id || isNaN(id)) {
      return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
    }

    const { files } = await parseMultipartForm(c);
    
    if (!files || files.length === 0) {
      return c.json({ error: 'Не загружено ни одного файла' }, 400);
    }

    // Валидация файлов (максимум 5 изображений, каждое до 5MB)
    validateImages(files, 5, 5);

    const res = await uploadCarImagesService(id, files);
    return c.json(res.ok ? { ok: true, images: res.images } : { error: res.error }, res.status);
  } catch (error: any) {
    console.error('Error uploading car images:', error);
    return c.json({ error: error.message || 'Ошибка при загрузке изображений' }, 400);
  }
}

// ===== Удаление изображения автомобиля =====
export async function deleteCarImageHandler(c: any) {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const imageUrl = c.req.query('imageUrl');
    
    if (!id || isNaN(id)) {
      return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
    }
    
    if (!imageUrl) {
      return c.json({ error: 'URL изображения обязателен' }, 400);
    }

    const res = await deleteCarImageService(id, imageUrl);
    return c.json(res.ok ? { ok: true } : { error: res.error }, res.status);
  } catch (error: any) {
    console.error('Error deleting car image:', error);
    return c.json({ error: error.message || 'Ошибка при удалении изображения' }, 400);
  }
}

// ===== Управление водителями автомобиля =====
export async function addDriverToCarHandler(c: any) {
  const carId = parseInt(c.req.param('id') || '0');
  if (!carId || isNaN(carId)) {
    return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = AddDriverToCarSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 400);
  }

  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  // Получаем компанию текущего пользователя
  const car = await getCarByIdService(carId);
  if (!car.ok || !car.car) {
    return c.json({ error: 'Автомобиль не найден' }, 404);
  }

  const userCompany = await isUserInCompany(currentUserId, car.car.id_company);
  if (!userCompany) {
    return c.json({ error: 'У вас нет прав для управления этим автомобилем' }, 403);
  }

  const res = await addDriverToCarService(carId, parsed.data, car.car.id_company);
  return c.json(res.ok ? { ok: true, driver: res.driver } : { error: res.error }, res.status);
}

export async function removeDriverFromCarHandler(c: any) {
  const carId = parseInt(c.req.param('id') || '0');
  if (!carId || isNaN(carId)) {
    return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = RemoveDriverFromCarSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 400);
  }

  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  // Получаем компанию текущего пользователя
  const car = await getCarByIdService(carId);
  if (!car.ok || !car.car) {
    return c.json({ error: 'Автомобиль не найден' }, 404);
  }

  const userCompany = await isUserInCompany(currentUserId, car.car.id_company);
  if (!userCompany) {
    return c.json({ error: 'У вас нет прав для управления этим автомобилем' }, 403);
  }

  const res = await removeDriverFromCarService(carId, parsed.data, car.car.id_company);
  return c.json(res.ok ? { ok: true } : { error: res.error }, res.status);
}

export async function getCarDriversHandler(c: any) {
  const carId = parseInt(c.req.param('id') || '0');
  if (!carId || isNaN(carId)) {
    return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
  }

  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  // Получаем компанию текущего пользователя
  const car = await getCarByIdService(carId);
  if (!car.ok || !car.car) {
    return c.json({ error: 'Автомобиль не найден' }, 404);
  }

  const userCompany = await isUserInCompany(currentUserId, car.car.id_company);
  if (!userCompany) {
    return c.json({ error: 'У вас нет прав для просмотра этого автомобиля' }, 403);
  }

  const res = await getCarDriversService(carId, car.car.id_company);
  return c.json(res.ok ? { ok: true, drivers: res.drivers } : { error: res.error }, res.status);
}

export async function getCompanyDriversHandler(c: any) {
  const companyId = c.req.query('id_company');
  if (!companyId) {
    return c.json({ error: 'ID компании обязателен' }, 400);
  }

  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const userCompany = await isUserInCompany(currentUserId, companyId);
  if (!userCompany) {
    return c.json({ error: 'У вас нет прав для просмотра водителей этой компании' }, 403);
  }

  const res = await getCompanyDriversService(companyId);
  return c.json(res.ok ? { ok: true, drivers: res.drivers } : { error: res.error }, res.status);
}


