// apps/backend/src/api/crm/companies/companies.controller.ts
import {
  CreateCrmCompanySchema,
  UpdateCrmCompanySchema,
  GetCrmCompaniesQuerySchema,
  CreateCrmContactSchema,
  CrmFieldPrefsSchema,
  GetCrmFieldPrefsQuerySchema,
  CreateCrmCustomFieldSchema,
  UpdateCrmCustomFieldSchema,
  GetCrmCustomFieldsQuerySchema,
  UpsertCrmCustomValuesSchema,
  sanitizeCreateCrmCompanyDto,
  sanitizeUpdateCrmCompanyDto,
} from '../crm.schema';
import {
  createCrmCompanyService,
  getCrmCompaniesService,
  getCrmCompanyService,
  updateCrmCompanyService,
  deleteCrmCompanyService,
  getCrmCompanyAutofillService,
  createCrmContactService,
  getCrmContactsService,
  deleteCrmContactService,
  getCrmFieldPrefsService,
  upsertCrmFieldPrefsService,
  getCrmCustomFieldsService,
  createCrmCustomFieldService,
  updateCrmCustomFieldService,
  deleteCrmCustomFieldService,
  getCrmCustomValuesService,
  upsertCrmCustomValuesService,
} from './companies.service';

/**
 * Получить id пользователя из контекста
 */
function getUserId(c: any): string | null {
  const userCtx = c.get('user');
  return userCtx?.id ?? userCtx?.id_user ?? null;
}

// === Контрагенты ===

export async function createCrmCompanyHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCrmCompanySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await createCrmCompanyService(sanitizeCreateCrmCompanyDto(parsed.data), userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ company: res.company }, res.status);
}

export async function getCrmCompaniesHandler(c: any) {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const queryParams = c.req.query();
  const parsedQuery = GetCrmCompaniesQuerySchema.safeParse(queryParams);
  if (!parsedQuery.success) {
    return c.json({ error: 'Некорректные параметры запроса', details: parsedQuery.error.flatten() }, 400);
  }

  const res = await getCrmCompaniesService(userId, parsedQuery.data);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ data: res.data }, res.status);
}

export async function getCrmCompanyHandler(c: any) {
  const id = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmCompanyService(id, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ company: res.company }, res.status);
}

export async function updateCrmCompanyHandler(c: any) {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateCrmCompanySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await updateCrmCompanyService(id, sanitizeUpdateCrmCompanyDto(parsed.data), userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ company: res.company }, res.status);
}

export async function deleteCrmCompanyHandler(c: any) {
  const id = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await deleteCrmCompanyService(id, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

// === Автозаполнение по УНП ===

export async function getCrmCompanyAutofillHandler(c: any) {
  const unp = c.req.query('unp');
  if (!unp) {
    return c.json({ error: "Параметр 'unp' обязателен" }, 400);
  }

  const res = await getCrmCompanyAutofillService(unp);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ data: res.data }, res.status);
}

// === Контакты ===

export async function createCrmContactHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCrmContactSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await createCrmContactService(id_crm_company, parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ contact: res.contact }, res.status);
}

export async function getCrmContactsHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmContactsService(id_crm_company, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ contacts: res.contacts }, res.status);
}

export async function deleteCrmContactHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const id_contact = c.req.param('contactId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await deleteCrmContactService(id_crm_company, id_contact, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

// === Field Prefs ===

export async function getCrmFieldPrefsHandler(c: any) {
  const queryParams = c.req.query();
  const parsedQuery = GetCrmFieldPrefsQuerySchema.safeParse(queryParams);
  if (!parsedQuery.success) {
    return c.json({ error: 'Некорректные параметры запроса', details: parsedQuery.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmFieldPrefsService(userId, parsedQuery.data.kind);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ prefs: res.prefs }, res.status);
}

export async function upsertCrmFieldPrefsHandler(c: any) {
  const queryParams = c.req.query();
  const parsedQuery = GetCrmFieldPrefsQuerySchema.safeParse(queryParams);
  if (!parsedQuery.success) {
    return c.json({ error: 'Некорректные параметры запроса', details: parsedQuery.error.flatten() }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsedBody = CrmFieldPrefsSchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json({ error: 'Некорректные данные', details: parsedBody.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await upsertCrmFieldPrefsService(userId, parsedQuery.data.kind, parsedBody.data);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ prefs: res.prefs }, res.status);
}

// === Custom Fields ===

export async function getCrmCustomFieldsHandler(c: any) {
  const queryParams = c.req.query();
  const parsedQuery = GetCrmCustomFieldsQuerySchema.safeParse(queryParams);
  if (!parsedQuery.success) {
    return c.json({ error: 'Некорректные параметры запроса', details: parsedQuery.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmCustomFieldsService(userId, parsedQuery.data.kind);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ fields: res.fields }, res.status);
}

export async function createCrmCustomFieldHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateCrmCustomFieldSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await createCrmCustomFieldService(parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ field: res.field }, res.status);
}

export async function updateCrmCustomFieldHandler(c: any) {
  const id = c.req.param('fieldId');
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateCrmCustomFieldSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await updateCrmCustomFieldService(id, parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ field: res.field }, res.status);
}

export async function deleteCrmCustomFieldHandler(c: any) {
  const id = c.req.param('fieldId');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await deleteCrmCustomFieldService(id, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ message: res.message }, res.status);
}

// === Custom Values ===

export async function getCrmCustomValuesHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await getCrmCustomValuesService(id_crm_company, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ values: res.values }, res.status);
}

export async function upsertCrmCustomValuesHandler(c: any) {
  const id_crm_company = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const parsed = UpsertCrmCustomValuesSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Требуется авторизация' }, 401);
  }

  const res = await upsertCrmCustomValuesService(id_crm_company, parsed.data, userId);
  if (!res.ok) {
    return c.json({ error: res.error }, res.status);
  }
  return c.json({ values: res.values }, res.status);
}

