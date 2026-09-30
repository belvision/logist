// apps/backend/src/api/crm/companies/companies.service.ts
import type {
  CreateCrmCompanyDto,
  UpdateCrmCompanyDto,
  GetCrmCompaniesQueryDto,
  CreateCrmContactDto,
  CreateCrmCustomFieldDto,
  UpdateCrmCustomFieldDto,
  UpsertCrmCustomValuesDto,
} from '../crm.schema';
import type { CrmFieldPrefs } from '../crm.types';
import {
  createCrmCompany,
  linkUserToCrmCompany,
  getCrmCompanies,
  getCrmCompanyById,
  updateCrmCompany,
  deleteCrmCompany,
  createCrmContact,
  getCrmContacts,
  deleteCrmContact,
  getCrmFieldPrefs,
  upsertCrmFieldPrefs,
  getCrmCustomFields,
  createCrmCustomField,
  getCrmCustomFieldById,
  updateCrmCustomField,
  deleteCrmCustomField,
  getCrmCustomValues,
  upsertCrmCustomValues,
} from './companies.repository';
import { getCompanyInfoByUnp } from '../../../lib/unp-autofill.service';
import { getWorkspaceCompanyId, checkWorkspaceMembership, normalizeFieldPrefsOrder, mapAutofillToCrmCompany } from '../crm.utils';

// === Контрагенты ===

export async function createCrmCompanyService(payload: CreateCrmCompanyDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  // Если передан УНП, выполняем автозаполнение
  let finalData = { ...payload };
  if (payload.unp) {
    const autofillData = await getCompanyInfoByUnp(payload.unp);
    if (autofillData) {
      const mappedData = mapAutofillToCrmCompany(autofillData, payload);
      finalData = {
        ...mappedData,
        ...payload,
        name: payload.name || mappedData.name,
        legal_address: payload.legal_address || mappedData.legal_address,
        postal_address: payload.postal_address || mappedData.postal_address,
      };
    }
  }

  // name обязателен
  if (!finalData.name) {
    return { ok: false as const, status: 400, error: 'Поле name обязательно для заполнения' };
  }

  try {
    const created = await createCrmCompany({
      ...finalData,
      workspace_company_id,
      created_by: userId,
    });

    try {
      await linkUserToCrmCompany({
        id_crm_company: created.id_crm_company,
        id_user: userId,
        workspace_company_id,
      });
    } catch (e: any) {
      if (e?.code !== '23505') {
        throw e;
      }
    }

    return { ok: true as const, status: 201, company: created };
  } catch (e: any) {
    console.error('Error creating CRM company:', e);
    return { ok: false as const, status: 500, error: 'Не удалось создать контрагента' };
  }
}

export async function getCrmCompaniesService(userId: string, filters: GetCrmCompaniesQueryDto) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  try {
    const result = await getCrmCompanies(workspace_company_id, filters);
    return { ok: true as const, status: 200, data: result };
  } catch (e) {
    console.error('Error getting CRM companies:', e);
    return { ok: false as const, status: 500, error: 'Не удалось получить список контрагентов' };
  }
}

export async function getCrmCompanyService(id: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  return { ok: true as const, status: 200, company };
}

export async function updateCrmCompanyService(id: string, payload: UpdateCrmCompanyDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  let finalData = { ...payload };
  if (payload.unp) {
    const autofillData = await getCompanyInfoByUnp(payload.unp);
    if (autofillData) {
      const mappedData = mapAutofillToCrmCompany(autofillData, payload);
      finalData = {
        ...mappedData,
        ...payload,
        name: payload.name || mappedData.name,
        legal_address: payload.legal_address || mappedData.legal_address,
        postal_address: payload.postal_address || mappedData.postal_address,
      };
    }
  }

  const updated = await updateCrmCompany(id, workspace_company_id, finalData);
  if (!updated) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  return { ok: true as const, status: 200, company: updated };
}

export async function deleteCrmCompanyService(id: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const deleted = await deleteCrmCompany(id, workspace_company_id);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  return { ok: true as const, status: 200, message: 'Контрагент успешно удалён' };
}

// === Автозаполнение по УНП ===

export async function getCrmCompanyAutofillService(unp: string) {
  const autofillData = await getCompanyInfoByUnp(unp);
  if (!autofillData) {
    return { ok: false as const, status: 404, error: 'Компания с таким УНП не найдена' };
  }

  const mappedData = mapAutofillToCrmCompany(autofillData);
  return { ok: true as const, status: 200, data: mappedData };
}

// === Контакты ===

export async function createCrmContactService(id_crm_company: string, payload: CreateCrmContactDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  try {
    const created = await createCrmContact(id_crm_company, payload);
    return { ok: true as const, status: 201, contact: created };
  } catch (e) {
    console.error('Error creating CRM contact:', e);
    return { ok: false as const, status: 500, error: 'Не удалось создать контакт' };
  }
}

export async function getCrmContactsService(id_crm_company: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const contacts = await getCrmContacts(id_crm_company);
  return { ok: true as const, status: 200, contacts };
}

export async function deleteCrmContactService(id_crm_company: string, id_contact: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const deleted = await deleteCrmContact(id_contact, id_crm_company);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Контакт не найден' };
  }

  return { ok: true as const, status: 200, message: 'Контакт успешно удалён' };
}

// === Field Prefs ===

export async function getCrmFieldPrefsService(userId: string, kind: 'carrier' | 'customer') {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const prefs = await getCrmFieldPrefs(workspace_company_id, userId, kind);
  const defaultPrefs: CrmFieldPrefs = { version: 1, fields: [] };
  
  return { ok: true as const, status: 200, prefs: prefs?.prefs || defaultPrefs };
}

export async function upsertCrmFieldPrefsService(userId: string, kind: 'carrier' | 'customer', prefs: CrmFieldPrefs) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const normalizedPrefs = normalizeFieldPrefsOrder(prefs);

  const upserted = await upsertCrmFieldPrefs({
    workspace_company_id,
    id_user: userId,
    kind,
    prefs: normalizedPrefs,
  });

  return { ok: true as const, status: 200, prefs: upserted.prefs };
}

// === Custom Fields ===

export async function getCrmCustomFieldsService(userId: string, kind: 'carrier' | 'customer') {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const fields = await getCrmCustomFields(workspace_company_id, userId, kind);
  return { ok: true as const, status: 200, fields };
}

export async function createCrmCustomFieldService(payload: CreateCrmCustomFieldDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  try {
    const created = await createCrmCustomField({
      workspace_company_id,
      id_user: userId,
      kind: payload.kind,
      key: payload.key,
      label: payload.label,
      type: payload.type,
      options: payload.options,
    });
    return { ok: true as const, status: 201, field: created };
  } catch (e: any) {
    if (e?.code === '23505') {
      return { ok: false as const, status: 409, error: 'Поле с таким key уже существует' };
    }
    console.error('Error creating CRM custom field:', e);
    return { ok: false as const, status: 500, error: 'Не удалось создать поле' };
  }
}

export async function updateCrmCustomFieldService(id: string, payload: UpdateCrmCustomFieldDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const updated = await updateCrmCustomField(id, workspace_company_id, userId, payload);
  if (!updated) {
    return { ok: false as const, status: 404, error: 'Поле не найдено' };
  }

  return { ok: true as const, status: 200, field: updated };
}

export async function deleteCrmCustomFieldService(id: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const deleted = await deleteCrmCustomField(id, workspace_company_id, userId);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Поле не найдено' };
  }

  return { ok: true as const, status: 200, message: 'Поле успешно удалено' };
}

// === Custom Values ===

export async function getCrmCustomValuesService(id_crm_company: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const values = await getCrmCustomValues(id_crm_company);
  return { ok: true as const, status: 200, values };
}

export async function upsertCrmCustomValuesService(id_crm_company: string, payload: UpsertCrmCustomValuesDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  try {
    // Убеждаемся, что все значения имеют обязательное поле value
    const valuesToUpsert = payload.values.map(v => ({
      id_field: v.id_field,
      value: v.value ?? null, // Если value отсутствует, используем null
    }));
    const values = await upsertCrmCustomValues(id_crm_company, valuesToUpsert);
    return { ok: true as const, status: 200, values };
  } catch (e) {
    console.error('Error upserting CRM custom values:', e);
    return { ok: false as const, status: 500, error: 'Не удалось сохранить значения' };
  }
}

