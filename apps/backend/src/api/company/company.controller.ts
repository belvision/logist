// E:\logistgo\apps\backend\src\api\company\company.controller.ts

import { 
  CreateCompanySchema,  AddUserToCompanySchema,
  InviteUserToCompanySchema,
  GetCompanyUsersQuerySchema,
  sanitizeCompanyDto,
  sanitizeAddUserDto,
  sanitizeInviteUserDto,
  sanitizeGetCompanyUsersQuery
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
  if (!res.ok) {
    // Специальные коды ошибок для фронтенда
    if ((res as any).error === 'COMPANY_EXISTS_ACTIVE') {
      return c.json({ error: 'Компания с таким УНП зарегистрирована в системе, если Вы являетесь владельцем этой компании, напишите запрос в поддержку.', code: 'COMPANY_EXISTS_ACTIVE' }, 409);
    }
    return c.json({ error: (res as any).error }, res.status);
  }
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

  // Получаем и валидируем query параметры
  const queryParams = c.req.query();
  
  const parsedQuery = GetCompanyUsersQuerySchema.safeParse(queryParams);
  
  if (!parsedQuery.success) {
    return c.json({ 
      error: 'Ошибка валидации параметров',
      details: parsedQuery.error.flatten()
    }, 400);
  }

  const filters = sanitizeGetCompanyUsersQuery(parsedQuery.data);

  const res = await getCompanyUsersService(companyId, userId, filters);
  
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ 
    success: true,
    data: res.data 
  }, res.status);
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

  // Функция очистки данных
  const clean = (v: unknown) =>
    (typeof v === 'string' ? v.replace(/\\/g, '').trim() : v === null ? null : String(v ?? '').replace(/\\/g, '').trim());

  // 1. Сначала пробуем запросить данные из налоговой
  const grpUrl = `http://grp.nalog.gov.by/api/grp-public/data?unp=${encodeURIComponent(unp)}&charset=UTF-8&type=json`;
  
  try {
    console.log('🔍 [COMPANY CONTROLLER] Запрос к налоговой по УНП:', unp);
    console.log('🔍 [COMPANY CONTROLLER] URL налоговой:', grpUrl);
    
    const grpResp = await fetch(grpUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 секунд таймаут
    });
    
    console.log('🔍 [COMPANY CONTROLLER] Ответ налоговой:', grpResp.status, grpResp.statusText);
    
    if (grpResp.ok) {
      const grpData = await grpResp.json().catch((parseError) => {
        console.log('❌ [COMPANY CONTROLLER] Ошибка парсинга JSON от налоговой:', parseError);
        return null;
      }) as any;
      
      console.log('🔍 [COMPANY CONTROLLER] Данные от налоговой:', grpData);
      
      const row = grpData && (grpData as any).row;
      if (row) {
        const vnaimp = clean(row.vnaimp) as string;
        const vpadresRaw = clean(row.vpadres) as string | null;
        const vkods = clean(row.vkods) as string;

        const hasAddress = !!(vpadresRaw && vpadresRaw.length > 0);
        const entity_type = hasAddress ? 'Предприятие' : 'ИП';
        const ur_address = hasAddress ? vpadresRaw : null;

        console.log('✅ [COMPANY CONTROLLER] Успешно получены данные от налоговой:', {
          name_company: vnaimp,
          entity_type,
          ur_address,
          vkods
        });

        return c.json({
          name_company: vnaimp,
          entity_type,
          ur_address,
          vkods,
        }, 200);
      }
      // Если ответ успешный, но row нет — это означает, что по УНП нет организации
      return c.json({ code: 'NO_COMPANY_BY_UNP', error: 'NO_COMPANY_BY_UNP', message: 'С таким УНП нет зарегистрированной компании' }, 404);
    }
    
    console.log('⚠️ [COMPANY CONTROLLER] Налоговая недоступна или данные не найдены, пробуем DaData...');
    
  } catch (grpErr: any) {
    console.log('⚠️ [COMPANY CONTROLLER] Ошибка при запросе к налоговой, пробуем DaData:', grpErr.message);
  }

  // 2. Если налоговая недоступна или не вернула данные, пробуем DaData
  try {
    console.log('🔍 [COMPANY CONTROLLER] Запрос к DaData по УНП:', unp);
    
    const dadataUrl = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party_by';
    const dadataToken = process.env['DADATA_TOKEN'];
    
    if (!dadataToken) {
      console.error('❌ [COMPANY CONTROLLER] DADATA_TOKEN не настроен в переменных окружения');
      return c.json({ 
        error: 'Проверьте правильность введённого УНП',
        details: 'Сервисы поиска компаний недоступны'
      }, 502);
    }
    
    const dadataResp = await fetch(dadataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${dadataToken}`
      },
      body: JSON.stringify({ query: unp }),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log('🔍 [COMPANY CONTROLLER] Ответ DaData:', dadataResp.status, dadataResp.statusText);
    
    if (!dadataResp.ok) {
      console.log('❌ [COMPANY CONTROLLER] DaData вернул ошибку:', dadataResp.status, dadataResp.statusText);
      return c.json({ 
        code: 'SERVICES_UNAVAILABLE',
        error: 'Сервисы поиска компаний недоступны',
        message: 'Попробуйте позже'
      }, 502);
    }
    
    const dadataData = await dadataResp.json().catch((parseError) => {
      console.log('❌ [COMPANY CONTROLLER] Ошибка парсинга JSON от DaData:', parseError);
      return null;
    }) as any;
    
    console.log('🔍 [COMPANY CONTROLLER] Данные от DaData:', dadataData);
    
    const suggestions = dadataData && dadataData.suggestions;
    if (!suggestions || suggestions.length === 0) {
      console.log('❌ [COMPANY CONTROLLER] Данные по УНП не найдены в DaData');
      return c.json({ 
        code: 'NO_COMPANY_BY_UNP',
        error: 'NO_COMPANY_BY_UNP',
        message: 'С таким УНП нет зарегистрированной компании'
      }, 404);
    }
    
    const companyData = suggestions[0].data;
    console.log('🔍 [COMPANY CONTROLLER] Данные компании из DaData:', companyData);
    
    // Обрабатываем данные от DaData
    const name_company = clean(companyData.full_name_ru) as string;
    const address = clean(companyData.address) as string | null;
    const status = companyData.status;
    
    const hasAddress = !!(address && address.length > 0);
    const entity_type = hasAddress ? 'Предприятие' : 'ИП';
    const ur_address = hasAddress ? address : null;
    
    // Обрабатываем статус
    const vkods = status === 'ACTIVE' ? 'Действующий' : status;
    
    console.log('✅ [COMPANY CONTROLLER] Успешно получены данные от DaData:', {
      name_company,
      entity_type,
      ur_address,
      vkods
    });

    return c.json({
      name_company,
      entity_type,
      ur_address,
      vkods,
    }, 200);
    
  } catch (dadataErr: any) {
    console.error('❌ [COMPANY CONTROLLER] Ошибка при запросе к DaData:', dadataErr);
    return c.json({ 
      code: 'SERVICES_UNAVAILABLE',
      error: 'Сервисы поиска компаний недоступны',
      message: 'Попробуйте позже'
    }, 502);
  }
}