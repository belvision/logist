// apps/backend/src/api/crm/vehicles/vehicles.repository.ts
import db from '../../../db/client';
import {
  crm_vehicles,
  crm_vehicle_drivers,
  crm_drivers,
} from '../../../db/schema/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type {
  CreateCrmVehicleDto,
  UpdateCrmVehicleDto,
} from '../crm.schema';

// === Vehicles ===

export async function createCrmVehicle(data: CreateCrmVehicleDto & {
  workspace_company_id: string;
  created_by: string;
}) {
  const [created] = await db
    .insert(crm_vehicles)
    .values({
      workspace_company_id: data.workspace_company_id,
      id_crm_company: data.id_crm_company,
      created_by: data.created_by,
      plate_number: data.plate_number,
      brand: data.brand || null,
      model: data.model || null,
      year: data.year || null,
      vin: data.vin || null,
      note: data.note || null,
    })
    .returning();
  return created;
}

export async function getCrmVehicleById(id: string, workspace_company_id: string) {
  const [row] = await db
    .select()
    .from(crm_vehicles)
    .where(and(
      eq(crm_vehicles.id_vehicle, id),
      eq(crm_vehicles.workspace_company_id, workspace_company_id)
    ))
    .limit(1);
  return row || null;
}

export async function getCrmVehiclesByCompany(id_crm_company: string, workspace_company_id: string) {
  const rows = await db
    .select()
    .from(crm_vehicles)
    .where(and(
      eq(crm_vehicles.id_crm_company, id_crm_company),
      eq(crm_vehicles.workspace_company_id, workspace_company_id)
    ))
    .orderBy(desc(crm_vehicles.created_at));
  return rows;
}

export async function updateCrmVehicle(id: string, workspace_company_id: string, data: UpdateCrmVehicleDto) {
  const updateData: any = {};
  if (data.id_crm_company !== undefined) updateData.id_crm_company = data.id_crm_company;
  if (data.plate_number !== undefined) updateData.plate_number = data.plate_number;
  if (data.brand !== undefined) updateData.brand = data.brand || null;
  if (data.model !== undefined) updateData.model = data.model || null;
  if (data.year !== undefined) updateData.year = data.year || null;
  if (data.vin !== undefined) updateData.vin = data.vin || null;
  if (data.note !== undefined) updateData.note = data.note || null;
  updateData.updated_at = new Date();

  const [updated] = await db
    .update(crm_vehicles)
    .set(updateData)
    .where(and(
      eq(crm_vehicles.id_vehicle, id),
      eq(crm_vehicles.workspace_company_id, workspace_company_id)
    ))
    .returning();
  return updated || null;
}

export async function deleteCrmVehicle(id: string, workspace_company_id: string) {
  const [deleted] = await db
    .delete(crm_vehicles)
    .where(and(
      eq(crm_vehicles.id_vehicle, id),
      eq(crm_vehicles.workspace_company_id, workspace_company_id)
    ))
    .returning();
  return deleted || null;
}

// === Vehicle Drivers ===

export async function getCrmVehicleDrivers(id_vehicle: string, workspace_company_id: string) {
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
    .from(crm_vehicle_drivers)
    .innerJoin(crm_drivers, eq(crm_vehicle_drivers.id_driver, crm_drivers.id_driver))
    .where(and(
      eq(crm_vehicle_drivers.id_vehicle, id_vehicle),
      eq(crm_vehicle_drivers.workspace_company_id, workspace_company_id)
    ))
    .orderBy(asc(crm_drivers.full_name));
  return rows;
}

export async function attachDriverToVehicle(data: {
  workspace_company_id: string;
  id_vehicle: string;
  id_driver: string;
}) {
  try {
    const [linked] = await db
      .insert(crm_vehicle_drivers)
      .values({
        workspace_company_id: data.workspace_company_id,
        id_vehicle: data.id_vehicle,
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

export async function detachDriverFromVehicle(id_vehicle: string, id_driver: string, workspace_company_id: string) {
  const [deleted] = await db
    .delete(crm_vehicle_drivers)
    .where(and(
      eq(crm_vehicle_drivers.id_vehicle, id_vehicle),
      eq(crm_vehicle_drivers.id_driver, id_driver),
      eq(crm_vehicle_drivers.workspace_company_id, workspace_company_id)
    ))
    .returning();
  return deleted || null;
}

