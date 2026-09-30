import db from '../../db/client';
import { cargo, company } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

/**
 * Проверить существование компании по её ID.
 * Возвращает true, если компания найдена.
 */
export async function companyExists(companyId: string) {
  const res = await db
    .select({ id: company.id_company })
    .from(company)
    .where(eq(company.id_company as any, companyId))
    .limit(1);
  return res.length > 0;
}

/**
 * Вставить новую запись о грузе.
 */
export async function insertCargo(values: typeof cargo.$inferInsert) {
  const [row] = await db.insert(cargo).values(values).returning();
  return row;
}

/**
 * Обновить груз по его ID.
 */
export async function updateCargoById(id: number, values: Partial<typeof cargo.$inferInsert>) {
  const [row] = await db.update(cargo).set(values).where(eq(cargo.id_cargo as any, id)).returning();
  return row;
}

/**
 * Удалить груз по его ID.
 */
export async function deleteCargoById(id: number) {
  const [row] = await db.delete(cargo).where(eq(cargo.id_cargo as any, id)).returning();
  return row;
}

/**
 * Получить список всех грузов компании по её ID.
 *
 * @param companyId Идентификатор компании
 */
export async function getCargosByCompany(companyId: string) {
  const items = await db
    .select()
    .from(cargo)
    .where(eq(cargo.id_company as any, companyId));
  return items;
}