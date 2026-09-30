// apps/backend/src/api/crm/companies/companies.repository.ts
import db from '../../../db/client';
import {
  crm_companies,
  crm_companies_users,
  crm_contacts,
  crm_field_prefs,
  crm_custom_fields,
  crm_custom_values,
} from '../../../db/schema/schema';
import { eq, and, or, like, desc, asc, count, sql, inArray } from 'drizzle-orm';
import type {
  CreateCrmCompanyDto,
  UpdateCrmCompanyDto,
  GetCrmCompaniesQueryDto,
  CreateCrmContactDto,
} from '../crm.schema';
import type { CrmFieldPrefs } from '../crm.types';

// === Контрагенты ===

export async function createCrmCompany(data: CreateCrmCompanyDto & {
  workspace_company_id: string;
  created_by: string;
}) {
  const [created] = await db
    .insert(crm_companies)
    .values({
      workspace_company_id: data.workspace_company_id,
      created_by: data.created_by,
      kind: data.kind,
      trust_type: data.trust_type,
      name: data.name || '',
      unp: data.unp || null,
      legal_address: data.legal_address || {},
      postal_address: data.postal_address || {},
      payment_terms: data.payment_terms || {},
      bank_details: data.bank_details || {},
      note: data.note || null,
    })
    .returning();
  return created;
}

export async function linkUserToCrmCompany(data: {
  id_crm_company: string;
  id_user: string;
  workspace_company_id: string;
}) {
  const [linked] = await db
    .insert(crm_companies_users)
    .values(data)
    .returning();
  return linked;
}

export async function getCrmCompanies(workspace_company_id: string, filters: GetCrmCompaniesQueryDto) {
  const conditions = [eq(crm_companies.workspace_company_id, workspace_company_id)];

  if (filters.kind) {
    conditions.push(eq(crm_companies.kind, filters.kind));
  }

  if (filters.trust_type) {
    conditions.push(eq(crm_companies.trust_type, filters.trust_type));
  }

  if (filters.unp) {
    conditions.push(eq(crm_companies.unp, filters.unp));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(crm_companies.name, searchTerm),
        like(crm_companies.unp || sql`''`, searchTerm)
      )!
    );
  }

  // Получаем общее количество
  const totalResult = await db
    .select({ count: count() })
    .from(crm_companies)
    .where(and(...conditions));

  const total = totalResult[0]?.count || 0;

  // Получаем данные с пагинацией
  const rows = await db
    .select()
    .from(crm_companies)
    .where(and(...conditions))
    .orderBy(desc(crm_companies.created_at))
    .limit(filters.limit)
    .offset(filters.offset);

  return {
    items: rows,
    total,
    limit: filters.limit,
    offset: filters.offset,
  };
}

export async function getCrmCompanyById(id: string, workspace_company_id: string) {
  const [row] = await db
    .select()
    .from(crm_companies)
    .where(and(
      eq(crm_companies.id_crm_company, id),
      eq(crm_companies.workspace_company_id, workspace_company_id)
    ))
    .limit(1);
  return row || null;
}

export async function updateCrmCompany(id: string, workspace_company_id: string, data: UpdateCrmCompanyDto) {
  const [updated] = await db
    .update(crm_companies)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(and(
      eq(crm_companies.id_crm_company, id),
      eq(crm_companies.workspace_company_id, workspace_company_id)
    ))
    .returning();
  return updated || null;
}

export async function deleteCrmCompany(id: string, workspace_company_id: string) {
  const [deleted] = await db
    .delete(crm_companies)
    .where(and(
      eq(crm_companies.id_crm_company, id),
      eq(crm_companies.workspace_company_id, workspace_company_id)
    ))
    .returning();
  return deleted || null;
}

// === Контакты ===

export async function createCrmContact(id_crm_company: string, data: CreateCrmContactDto) {
  const [created] = await db
    .insert(crm_contacts)
    .values({
      id_crm_company,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      position: data.position || null,
      note: data.note || null,
    })
    .returning();
  return created;
}

export async function getCrmContacts(id_crm_company: string) {
  const rows = await db
    .select()
    .from(crm_contacts)
    .where(eq(crm_contacts.id_crm_company, id_crm_company))
    .orderBy(asc(crm_contacts.name));
  return rows;
}

export async function deleteCrmContact(id_contact: string, id_crm_company: string) {
  const [deleted] = await db
    .delete(crm_contacts)
    .where(and(
      eq(crm_contacts.id_contact, id_contact),
      eq(crm_contacts.id_crm_company, id_crm_company)
    ))
    .returning();
  return deleted || null;
}

// === Field Prefs ===

export async function getCrmFieldPrefs(workspace_company_id: string, id_user: string, kind: 'carrier' | 'customer') {
  const [row] = await db
    .select()
    .from(crm_field_prefs)
    .where(and(
      eq(crm_field_prefs.workspace_company_id, workspace_company_id),
      eq(crm_field_prefs.id_user, id_user),
      eq(crm_field_prefs.kind, kind)
    ))
    .limit(1);
  return row || null;
}

export async function upsertCrmFieldPrefs(data: {
  workspace_company_id: string;
  id_user: string;
  kind: 'carrier' | 'customer';
  prefs: CrmFieldPrefs;
}) {
  // Сначала пробуем обновить существующую запись
  const existing = await getCrmFieldPrefs(data.workspace_company_id, data.id_user, data.kind);
  if (existing) {
    const [updated] = await db
      .update(crm_field_prefs)
      .set({
        prefs: data.prefs,
        updated_at: new Date(),
      })
      .where(and(
        eq(crm_field_prefs.workspace_company_id, data.workspace_company_id),
        eq(crm_field_prefs.id_user, data.id_user),
        eq(crm_field_prefs.kind, data.kind)
      ))
      .returning();
    return updated;
  }

  // Если не существует, создаём новую
  const [created] = await db
    .insert(crm_field_prefs)
    .values({
      workspace_company_id: data.workspace_company_id,
      id_user: data.id_user,
      kind: data.kind,
      prefs: data.prefs,
      updated_at: new Date(),
    })
    .returning();
  return created;
}

// === Custom Fields ===

export async function getCrmCustomFields(workspace_company_id: string, id_user: string, kind: 'carrier' | 'customer') {
  const rows = await db
    .select()
    .from(crm_custom_fields)
    .where(and(
      eq(crm_custom_fields.workspace_company_id, workspace_company_id),
      eq(crm_custom_fields.id_user, id_user),
      eq(crm_custom_fields.kind, kind)
    ))
    .orderBy(asc(crm_custom_fields.key));
  return rows;
}

export async function createCrmCustomField(data: {
  workspace_company_id: string;
  id_user: string;
  kind: 'carrier' | 'customer';
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}) {
  const [created] = await db
    .insert(crm_custom_fields)
    .values({
      workspace_company_id: data.workspace_company_id,
      id_user: data.id_user,
      kind: data.kind,
      key: data.key,
      label: data.label,
      type: data.type,
      options: data.options || [],
    })
    .returning();
  return created;
}

export async function getCrmCustomFieldById(id: string, workspace_company_id: string, id_user: string) {
  const [row] = await db
    .select()
    .from(crm_custom_fields)
    .where(and(
      eq(crm_custom_fields.id_field, id),
      eq(crm_custom_fields.workspace_company_id, workspace_company_id),
      eq(crm_custom_fields.id_user, id_user)
    ))
    .limit(1);
  return row || null;
}

export async function updateCrmCustomField(id: string, workspace_company_id: string, id_user: string, data: {
  label?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}) {
  const [updated] = await db
    .update(crm_custom_fields)
    .set(data)
    .where(and(
      eq(crm_custom_fields.id_field, id),
      eq(crm_custom_fields.workspace_company_id, workspace_company_id),
      eq(crm_custom_fields.id_user, id_user)
    ))
    .returning();
  return updated || null;
}

export async function deleteCrmCustomField(id: string, workspace_company_id: string, id_user: string) {
  const [deleted] = await db
    .delete(crm_custom_fields)
    .where(and(
      eq(crm_custom_fields.id_field, id),
      eq(crm_custom_fields.workspace_company_id, workspace_company_id),
      eq(crm_custom_fields.id_user, id_user)
    ))
    .returning();
  return deleted || null;
}

// === Custom Values ===

export async function getCrmCustomValues(id_crm_company: string) {
  const rows = await db
    .select({
      id_value: crm_custom_values.id_value,
      id_field: crm_custom_values.id_field,
      value: crm_custom_values.value,
      field: {
        key: crm_custom_fields.key,
        label: crm_custom_fields.label,
        type: crm_custom_fields.type,
        options: crm_custom_fields.options,
      },
    })
    .from(crm_custom_values)
    .innerJoin(crm_custom_fields, eq(crm_custom_values.id_field, crm_custom_fields.id_field))
    .where(eq(crm_custom_values.id_crm_company, id_crm_company));
  return rows;
}

export async function upsertCrmCustomValues(id_crm_company: string, values: Array<{ id_field: string; value: any }>) {
  // Удаляем старые значения для этих полей
  if (values.length > 0) {
    const fieldIds = values.map(v => v.id_field);
    await db
      .delete(crm_custom_values)
      .where(and(
        eq(crm_custom_values.id_crm_company, id_crm_company),
        inArray(crm_custom_values.id_field, fieldIds)
      ));
  }

  // Вставляем новые значения
  if (values.length > 0) {
    const inserted = await db
      .insert(crm_custom_values)
      .values(values.map(v => ({
        id_crm_company,
        id_field: v.id_field,
        value: v.value,
      })))
      .returning();
    return inserted;
  }

  return [];
}

