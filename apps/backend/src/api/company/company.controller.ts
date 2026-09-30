// E:\logistgo\apps\backend\src\api\company\company.controller.ts

import { 
  CreateCompanySchema,  AddUserToCompanySchema,
  InviteUserToCompanySchema,
  sanitizeCompanyDto,
  sanitizeAddUserDto,
  sanitizeInviteUserDto
} from './company.schema';
import { 
  addCompany, 
  getCompaniesService, 
  getCompaniesTypeService,
  addUserToCompany,
  inviteUserToCompany,
  getCompanyUsersService,
  removeUserFromCompanyService,
  updateUserRoleService
} from './company.service';
import { findInvitationByToken } from './company.repository';
import { verifyInviteToken } from '../../core/auth/jwt.service';

/**
 * POST /company
 * Создаёт компанию и сразу привязывает к ней ТЕКУЩЕГО пользователя как «Владельца».
 * Важно: маршрут защищён authenticate, поэтому здесь доступен c.get('user').
 */
export async function createCompanyHandler(c: any) {
  // 1) Читаем тело и валидируем по схеме (zod)
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  // 2) Достаём id пользователя из контекста (его положил authenticate)
  //    Оставляем «двойную» проверку на случай разницы в названии поля.
  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!userId) {
    // Если по какой-то причине id не нашли — считаем, что нет авторизации
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  // 3) Нормализуем и вызываем сервис: внутри — транзакция
  //    - создаём компанию
  //    - привязываем userId к компании с ролью «Владелец»
  const res = await addCompany(sanitizeCompanyDto(parsed.data), userId);

  // 4) Единообразная отдача результата
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ company: res.company }, res.status);
}

/**
 * GET /company
 * Возвращает список компаний (как определено в сервисе).
 */
export async function getCompaniesHandler(c: any) {
  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  const res = await getCompaniesService(currentUserId);
  if (!res.ok) return c.json({ error: (res as any).error }, res.status);
  return c.json({ companies: res.companies }, res.status);
}

/**
 * GET /company/type
 * Возвращает список типов компаний (справочник tip_company).
 */
export async function getCompaniesTypeHandler(c: any) {
  const res = await getCompaniesTypeService();
  if (!res.ok) return c.json({ error: (res as any).error }, res.status);
  return c.json({ companies: res.companies }, res.status);
}

/**
 * POST /company/:companyId/users
 * Добавить существующего пользователя в компанию по email
 */
export async function addUserToCompanyHandler(c: any) {
  const companyId = c.req.param('companyId');
  const body = await c.req.json().catch(() => ({}));
  
  const parsed = AddUserToCompanySchema.safeParse({ ...body, company_id: companyId });
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await addUserToCompany(sanitizeAddUserDto(parsed.data), userId);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ message: res.message, user: res.user }, res.status);
}

/**
 * POST /company/:companyId/invite
 * Пригласить пользователя в компанию по email
 */
export async function inviteUserToCompanyHandler(c: any) {
  const companyId = c.req.param('companyId');
  const body = await c.req.json().catch(() => ({}));
  
  const parsed = InviteUserToCompanySchema.safeParse({ ...body, company_id: companyId });
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await inviteUserToCompany(sanitizeInviteUserDto(parsed.data), userId);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ message: res.message, invitationToken: res.invitationToken }, res.status);
}

/**
 * GET /company/:companyId/users
 * Получить список пользователей компании
 */
export async function getCompanyUsersHandler(c: any) {
  const companyId = c.req.param('companyId');
  
  const userCtx = c.get('user');
  const userId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCompanyUsersService(companyId, userId);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ users: res.users }, res.status);
}

/**
 * DELETE /company/:companyId/users/:userId
 * Удалить пользователя из компании
 */
export async function removeUserFromCompanyHandler(c: any) {
  const companyId = c.req.param('companyId');
  const userId = c.req.param('userId');
  
  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await removeUserFromCompanyService(userId, companyId, currentUserId);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ message: res.message }, res.status);
}

/**
 * PUT /company/:companyId/users/:userId/role
 * Изменить роль пользователя в компании
 */
export async function updateUserRoleHandler(c: any) {
  const companyId = c.req.param('companyId');
  const userId = c.req.param('userId');
  const body = await c.req.json().catch(() => ({}));
  
  const { role } = body;
  if (!role || !['Администратор', 'Пользователь'].includes(role)) {
    return c.json({ error: 'Некорректная роль. Доступные роли: Администратор, Пользователь' }, 400);
  }
  
  const userCtx = c.get('user');
  const currentUserId: string | undefined = userCtx?.id ?? userCtx?.id_user;
  if (!currentUserId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await updateUserRoleService(userId, companyId, role, currentUserId);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ message: res.message, user: res.user }, res.status);
}

/**
 * GET /company/invite/verify?token=...
 * Проверка валидности токена приглашения до регистрации
 */
export async function verifyInviteHandler(c: any) {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ ok: false, error: 'Токен приглашения обязателен' }, 400);
  }

  try {
    // Сначала проверяем JWT токен
    const payload = verifyInviteToken(token);
    
    // Затем проверяем в БД
    const invitation = await findInvitationByToken(token);
    if (!invitation) {
      return c.json({ 
        ok: false, 
        error: 'Приглашение не найдено' 
      }, 400);
    }

    // Проверяем, не использован ли уже токен
    if (invitation.is_used) {
      return c.json({ 
        ok: false, 
        error: 'Приглашение уже было использовано' 
      }, 400);
    }

    // Проверяем срок действия
    if (new Date() > invitation.expires_at) {
      return c.json({ 
        ok: false, 
        error: 'Срок действия приглашения истёк' 
      }, 400);
    }

    return c.json({ 
      ok: true, 
      payload: {
        email: payload.email,
        companyId: payload.companyId,
        role: payload.role
      }
    }, 200);
  } catch (error) {
    return c.json({ 
      ok: false, 
      error: 'Неверный или истёкший токен приглашения' 
    }, 400);
  }
}

/**
 * GET /company/grp?unp=XXXXXXXXX
 * По УНП запрашивает данные из налоговой (grp.nalog.gov.by) и возвращает
 * нормализованный ответ для фронтенда без записи в БД.
 */
export async function getCompanyInfoByUnpHandler(c: any) {
  const unp = (c.req.query('unp') || '').toString().trim();
  if (!unp) {
    return c.json({ error: "Параметр 'unp' обязателен" }, 400);
  }

  const url = `http://grp.nalog.gov.by/api/grp-public/data?unp=${encodeURIComponent(unp)}&charset=UTF-8&type=json`;
  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      return c.json({ error: 'Сервис налоговой недоступен', status: resp.status }, 502);
    }
    const data = await resp.json().catch(() => null) as any;
    const row = data && (data as any).row;
    if (!row) {
      return c.json({ error: 'Данные по УНП не найдены' }, 404);
    }

    const clean = (v: unknown) =>
      (typeof v === 'string' ? v.replace(/\\/g, '').trim() : v === null ? null : String(v ?? '').replace(/\\/g, '').trim());

    const vnaimp = clean(row.vnaimp) as string;
    const vpadresRaw = clean(row.vpadres) as string | null;
    const vkods = clean(row.vkods) as string;

    const hasAddress = !!(vpadresRaw && vpadresRaw.length > 0);
    const entity_type = hasAddress ? 'Предприятие' : 'ИП';
    const ur_address = hasAddress ? vpadresRaw : null;

    return c.json({
      name_company: vnaimp,
      entity_type,
      ur_address,
      vkods,
    }, 200);
  } catch (err: any) {
    return c.json({ error: 'Ошибка при запросе к налоговой', details: err?.message || String(err) }, 502);
  }
}