// apps/backend/src/api/crm/drivers/drivers.controller.ts
import {
  CreateCrmDriverSchema,
} from '../crm.schema';
import {
  createCrmDriverService,
  getCrmDriversService,
  attachDriverToCompanyService,
  detachDriverFromCompanyService,
  getCrmCompanyDriversService,
} from './drivers.service';

/**
 * Получить id пользователя из контекста
 */
function getUserId(c: any): string | null {
  const userCtx = c.get('user');
  return userCtx?.id ?? userCtx?.id_user ?? null;
}

// === Водители ===

export async function createCrmDriverHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCrmDriverSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await createCrmDriverService(parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ driver: res.driver }, res.status);
}

export async function getCrmDriversHandler(c: any) {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmDriversService(userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ drivers: res.drivers }, res.status);
}

// === Company Drivers ===

export async function attachDriverToCompanyHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const id_driver = c.req.param('driverId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await attachDriverToCompanyService(id_crm_company, id_driver, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

export async function detachDriverFromCompanyHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const id_driver = c.req.param('driverId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await detachDriverFromCompanyService(id_crm_company, id_driver, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

export async function getCrmCompanyDriversHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmCompanyDriversService(id_crm_company, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ drivers: res.drivers }, res.status);
}

