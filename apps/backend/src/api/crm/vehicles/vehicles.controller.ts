// apps/backend/src/api/crm/vehicles/vehicles.controller.ts
import {
  CreateCrmVehicleSchema,
  UpdateCrmVehicleSchema,
} from '../crm.schema';
import {
  createCrmVehicleService,
  getCrmVehicleService,
  getCrmVehiclesByCompanyService,
  updateCrmVehicleService,
  deleteCrmVehicleService,
  getCrmVehicleDriversService,
  attachDriverToVehicleService,
  detachDriverFromVehicleService,
} from './vehicles.service';

/**
 * Получить id пользователя из контекста
 */
function getUserId(c: any): string | null {
  const userCtx = c.get('user');
  return userCtx?.id ?? userCtx?.id_user ?? null;
}

// === Vehicles ===

export async function createCrmVehicleHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCrmVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await createCrmVehicleService(parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ vehicle: res.vehicle }, res.status);
}

export async function getCrmVehicleHandler(c: any) {
  const id = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmVehicleService(id, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ vehicle: res.vehicle }, res.status);
}

export async function getCrmVehiclesByCompanyHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmVehiclesByCompanyService(id_crm_company, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ vehicles: res.vehicles }, res.status);
}

export async function updateCrmVehicleHandler(c: any) {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateCrmVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await updateCrmVehicleService(id, parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ vehicle: res.vehicle }, res.status);
}

export async function deleteCrmVehicleHandler(c: any) {
  const id = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await deleteCrmVehicleService(id, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

// === Vehicle Drivers ===

export async function getCrmVehicleDriversHandler(c: any) {
  const id_vehicle = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmVehicleDriversService(id_vehicle, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ drivers: res.drivers }, res.status);
}

export async function attachDriverToVehicleHandler(c: any) {
  const id_vehicle = c.req.param('id');
  const id_driver = c.req.param('driverId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await attachDriverToVehicleService(id_vehicle, id_driver, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

export async function detachDriverFromVehicleHandler(c: any) {
  const id_vehicle = c.req.param('id');
  const id_driver = c.req.param('driverId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await detachDriverFromVehicleService(id_vehicle, id_driver, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

