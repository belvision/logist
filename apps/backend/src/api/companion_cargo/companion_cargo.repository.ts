// apps/backend/src/api/companion_cargo/companion_cargo.repository.ts
import db from '../../db/client';
import { cargo, company } from '../../db/schema/schema';
import { and, gte, eq } from 'drizzle-orm';

export async function findCandidateCargos() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db
    .select({
      // Данные груза
      id_cargo: cargo.id_cargo,
      id_company: cargo.id_company,
      departure_point: cargo.departure_point,
      arrival_point: cargo.arrival_point,
      id_car_type: cargo.id_car_type,
      id_tip_zagryzki: cargo.id_tip_zagryzki,
      opisanie: cargo.opisanie,
      tonn: cargo.tonn,
      m3: cargo.m3,
      price: cargo.price,
      payment: cargo.payment,
      date_start: cargo.date_start,
      date_end: cargo.date_end,
      irrelevant: cargo.irrelevant,
      departure_place_id: cargo.departure_place_id,
      arrival_place_id: cargo.arrival_place_id,
      status: cargo.status,
      // Данные компании
      company_name: company.name_company,
      company_unp: company.unp,
      company_entity_type: company.entity_type,
      company_ur_address: company.ur_address,
      company_tel_1: company.tel_1,
      company_tel_2: company.tel_2,
      company_email: company.email,
    })
    .from(cargo)
    .leftJoin(company, eq(cargo.id_company, company.id_company))
    .where(
      and(
        gte(cargo.date_start, today),
        eq(cargo.status, 0),      // активный
        eq(cargo.irrelevant, 0),  // релевантный
      )
    );
  return rows;
}
