import db from '../../db/client';
import { cars, company } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function companyExists(companyId: string) {
  const res = await db
    .select({ id: company.id_company })
    .from(company)
    .where(eq(company.id_company as any, companyId))
    .limit(1);
  return res.length > 0;
}

export async function insertCar(values: typeof cars.$inferInsert) {
  const [row] = await db.insert(cars).values(values).returning();
  return row;
}

export async function updateCarById(id: number, values: Partial<typeof cars.$inferInsert>) {
  const [row] = await db.update(cars).set(values).where(eq(cars.id_cars as any, id)).returning();
  return row;
}

export async function deleteCarById(id: number) {
  const [row] = await db.delete(cars).where(eq(cars.id_cars as any, id)).returning();
  return row;
}

export async function selectCarsByCompany(companyId: string) {
  const rows = await db
    .select()
    .from(cars)
    .where(eq(cars.id_company as any, companyId));
  return rows;
}

export async function selectCarById(id: number) {
  const [row] = await db
    .select()
    .from(cars)
    .where(eq(cars.id_cars as any, id));
  return row;
}


