// apps/backend/src/api/crm/crm.utils.ts
import { isUserInCompany } from '../company/company.repository';
import { getUserCompany } from '../routes/routes.repository';
import { getCompanyInfoByUnp } from '../../lib/unp-autofill.service';
import type { LegalAddress, PostalAddress, CrmFieldPrefs } from './crm.types';
import type { CreateCrmCompanyDto } from './crm.schema';

/**
 * Получить workspace_company_id для текущего пользователя
 */
export async function getWorkspaceCompanyId(userId: string): Promise<{ ok: true; workspace_company_id: string } | { ok: false; status: number; error: string }> {
  const userCompany = await getUserCompany(userId);
  if (!userCompany) {
    return { ok: false, status: 400, error: 'Пользователь не состоит ни в одной компании' };
  }
  return { ok: true, workspace_company_id: userCompany.id_company };
}

/**
 * Проверить членство пользователя в workspace
 */
export async function checkWorkspaceMembership(userId: string, workspace_company_id: string): Promise<boolean> {
  const membership = await isUserInCompany(userId, workspace_company_id);
  return !!membership;
}

/**
 * Нормализовать order в prefs: сортировать по order, пересчитать шагом 10
 */
export function normalizeFieldPrefsOrder(prefs: CrmFieldPrefs): CrmFieldPrefs {
  const sortedFields = [...prefs.fields].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return 0;
  });

  const normalizedFields = sortedFields.map((field, index) => ({
    ...field,
    order: (index + 1) * 10,
  }));

  return {
    version: prefs.version,
    fields: normalizedFields,
  };
}

/**
 * Преобразовать данные автозаполнения в формат CRM
 */
export function mapAutofillToCrmCompany(autofillData: NonNullable<Awaited<ReturnType<typeof getCompanyInfoByUnp>>>, existingData?: Partial<CreateCrmCompanyDto>): Partial<CreateCrmCompanyDto> {
  const legalAddress: LegalAddress = {
    address: autofillData.ur_address || undefined,
    phone: autofillData.phone,
    email: autofillData.email,
    site: autofillData.site,
  };

  const postalAddress: PostalAddress = {
    address: autofillData.ur_address || undefined,
    phone: autofillData.phone,
    email: autofillData.email,
    site: autofillData.site,
  };

  return {
    name: existingData?.name || autofillData.name_company,
    legal_address: existingData?.legal_address || legalAddress,
    postal_address: existingData?.postal_address || postalAddress,
  };
}

