// apps/backend/src/api/crm/drivers/drivers.repository.ts
import db from '../../../db/client';
import {
  crm_drivers,
  crm_company_drivers,
} from '../../../db/schema/schema';
import { eq, and, asc } from 'drizzle-orm';
import type {
  CreateCrmDriverDto,
} from '../crm.schema';

// === Водители ===

export async function createCrmDriver(data: CreateCrmDriverDto & {
  workspace_company_id: string;
  created_by: string;
}) {
  const [created] = await db
    .insert(crm_drivers)
    .values({
      workspace_company_id: data.workspace_company_id,
      created_by: data.created_by,
      full_name: data.full_name,
      phone: data.phone || null,
      email: data.email || null,
      note: data.note || null,
    })
    .returning();
  return created;
}

export async function getCrmDrivers(workspace_company_id: string) {
  const rows = await db
    .select()
    .from(crm_drivers)
    .where(eq(crm_drivers.workspace_company_id, workspace_company_id))
    .orderBy(asc(crm_drivers.full_name));
  return rows;
}

export async function getCrmDriverById(id: string, workspace_company_id: string) {
  const [row] = await db
    .select()
    .from(crm_drivers)
    .where(and(
      eq(crm_drivers.id_driver, id),
      eq(crm_drivers.workspace_company_id, workspace_company_id)
    ))
    .limit(1);
  return row || null;
}

// === Company Drivers ===

export async function attachDriverToCompany(data: {
  workspace_company_id: string;
  id_crm_company: string;
  id_driver: string;
}) {
  try {
    const [linked] = await db
      .insert(crm_company_drivers)
      .values({
        workspace_company_id: data.workspace_company_id,
        id_crm_company: data.id_crm_company,
        id_driver: data.id_driver,
      })
      .returning();
    return linked;
  } catch (e: any) {
    // Если уже существует (23505), возвращаем null
    if (e?.code === '23505') {
      return null;
    }
    throw e;
  }
}

export async function existsCompanyDriverLink(id_crm_company: string, id_driver: string, workspace_company_id: string) {
  const [row] = await db
    .select()
    .from(crm_company_drivers)
    .where(and(
      eq(crm_company_drivers.id_crm_company, id_crm_company),
      eq(crm_company_drivers.id_driver, id_driver),
      eq(crm_company_drivers.workspace_company_id, workspace_company_id)
    ))
    .limit(1);
  return !!row;
}

export async function detachDriverFromCompany(id_crm_company: string, id_driver: string) {
  const [deleted] = await db
    .delete(crm_company_drivers)
    .where(and(
      eq(crm_company_drivers.id_crm_company, id_crm_company),
      eq(crm_company_drivers.id_driver, id_driver)
    ))
    .returning();
  return deleted || null;
}

export async function getCrmCompanyDrivers(id_crm_company: string) {
  const rows = await db
    .select({
      id_driver: crm_drivers.id_driver,
      full_name: crm_drivers.full_name,
      phone: crm_drivers.phone,
      email: crm_drivers.email,
      note: crm_drivers.note,
      created_at: crm_drivers.created_at,
      updated_at: crm_drivers.updated_at,
    })
    .from(crm_company_drivers)
    .innerJoin(crm_drivers, eq(crm_company_drivers.id_driver, crm_drivers.id_driver))
    .where(eq(crm_company_drivers.id_crm_company, id_crm_company))
    .orderBy(asc(crm_drivers.full_name));
  return rows;
}

