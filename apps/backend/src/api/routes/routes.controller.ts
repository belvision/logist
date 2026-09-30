import { CreateRouteSchema, UpdateRouteSchema } from './routes.schema';
import { createRouteService, updateRouteService, deleteRouteService, listCompanyRoutesService, getUserCompanyService } from './routes.service';
import { isUserInCompany } from '../company/company.repository';

// ===== Handlers =====
export async function createRouteHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  
  // Получаем данные пользователя из контекста (должны быть установлены middleware аутентификации)
  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id_user ?? userCtx?.id;
  
  if (!userId) {
    return c.json({ error: 'Необходима аутентификация' }, 401);
  }
  
  // Получаем компанию пользователя через сервис
  const companyRes = await getUserCompanyService(userId);
  if (!companyRes.ok) {
    return c.json({ error: companyRes.error }, companyRes.status);
  }
  
  // Добавляем обязательные поля из контекста пользователя
  const dataWithContext = {
    ...body,
    id_company: companyRes.company.id_company,
    created_by: userId,
  };
  
  const parsed = CreateRouteSchema.safeParse(dataWithContext);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await createRouteService(parsed.data);
  return c.json(res.ok ? { ok: true, route: res.route } : { error: res.error }, res.status);
}

export async function updateRouteHandler(c: any) {
  const idParam = c.req.param('id_routes') ?? c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await updateRouteService(id, parsed.data);
  return c.json(res.ok ? { ok: true, route: res.route } : { error: res.error }, res.status);
}

export async function deleteRouteHandler(c: any) {
  const idParam = c.req.param('id_routes') ?? c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }
  const res = await deleteRouteService(id);
  return c.json(res.ok ? { ok: true } : { error: res.error }, res.status);
}

export async function listCompanyRoutesHandler(c: any) {
  // Получаем данные пользователя из контекста
  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id_user ?? userCtx?.id;
  
  if (!userId) {
    return c.json({ error: 'Необходима аутентификация' }, 401);
  }
  
  const companyId = c.req.query('id_company');
  
  if (!companyId) {
    return c.json({ error: 'Не указан id_company в параметрах запроса' }, 400);
  }
  
  const userCompany = await isUserInCompany(userId, companyId);
  if (!userCompany) {
    return c.json({ error: 'У вас нет доступа к этой компании' }, 403);
  }
  
  const res = await listCompanyRoutesService(companyId);
  return c.json(res.ok ? { items: res.items } : { error: res.error }, res.status);
}

