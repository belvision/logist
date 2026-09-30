import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createCargoService,
  updateCargoService,
  deleteCargoService,
  getCargosByCompanyService,
  getCargoByIdService,
} from './cargo.service';
import { CreateCargoDto, UpdateCargoDto } from './cargo.schema';

/**
 * Создать груз.
 * Ожидает объект, соответствующий CreateCargoDto, в теле запроса.
 */
export async function createCargoHandler(c: any) {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    if (!user || !user.id_user) {
      return c.json({ error: 'Пользователь не авторизован' }, 401);
    }
    const dto: CreateCargoDto = { ...body, created_by: user.id_user };
    const result = await createCargoService(dto);
    if (result.ok) {
      return c.json(result.cargo, result.status);
    } else {
      return c.json({ error: result.error }, result.status);
    }
  } catch (error) {
    console.error('Create cargo handler error:', error);
    return c.json({ error: 'Ошибка создания груза' }, 500);
  }
}

/**
 * Обновить груз по его ID.
 * ID берётся из параметров пути, данные для обновления — из тела запроса.
 */
export async function updateCargoHandler(c: any) {
  const id = parseInt(c.req.param('id') || '0');
  if (!id || isNaN(id)) {
    return c.json({ error: 'ID груза обязателен и должен быть числом' }, 400);
  }
  try {
    const body = await c.req.json();
    const dto: UpdateCargoDto = body;
    const result = await updateCargoService(id, dto);
    if (result.ok) {
      return c.json(result.cargo, result.status);
    } else {
      return c.json({ error: result.error }, result.status);
    }
  } catch (error) {
    console.error('Update cargo handler error:', error);
    return c.json({ error: 'Ошибка обновления груза' }, 500);
  }
}

/**
 * Удалить груз по его ID.
 */
export async function deleteCargoHandler(c: any) {
  const id = parseInt(c.req.param('id') || '0');
  if (!id || isNaN(id)) {
    return c.json({ error: 'ID груза обязателен и должен быть числом' }, 400);
  }
  try {
    const result = await deleteCargoService(id);
    if (result.ok) {
      return c.json({}, result.status);
    } else {
      return c.json({ error: result.error }, result.status);
    }
  } catch (error) {
    console.error('Delete cargo handler error:', error);
    return c.json({ error: 'Ошибка удаления груза' }, 500);
  }
}

/**
 * Получить список всех грузов компании по ID компании.
 * ID компании передаётся как параметр пути.
 */
export async function getCargosByCompanyHandler(c: any) {
  const companyId = c.req.param('companyId');
  if (!companyId) {
    return c.json({ error: 'ID компании обязателен' }, 400);
  }
  try {
    const result = await getCargosByCompanyService(companyId);
    if (result.ok) {
      return c.json({ items: result.items }, result.status);
    } else {
      return c.json({ error: result.error }, result.status);
    }
  } catch (error) {
    console.error('Get cargos by company handler error:', error);
    return c.json({ error: 'Ошибка получения списка грузов' }, 500);
  }
}

export async function getCargoByIdHandler(c: any) {
  const id = parseInt(c.req.param('id') || '0');
  if (!id || isNaN(id)) {
    return c.json({ error: 'ID груза обязателен и должен быть числом' }, 400);
  }
  try {
    const result = await getCargoByIdService(id);
    if (result.ok) {
      return c.json(result.cargo, result.status);
    } else {
      return c.json({ error: result.error }, result.status);
    }
  } catch (error) {
    console.error('Get cargo by id handler error:', error);
    return c.json({ error: 'Ошибка получения груза' }, 500);
  }
}
