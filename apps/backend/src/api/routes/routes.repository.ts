import db from '../../db/client';
import { routes, cars } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function carExists(carId: number) {
  const res = await db
    .select({ id: cars.id_cars })
    .from(cars)
    .where(eq(cars.id_cars as any, carId))
    .limit(1);
  return res.length > 0;
}

export async function insertRoute(values: typeof routes.$inferInsert) {
  const [row] = await db.insert(routes).values(values).returning();
  return row;
}

export async function updateRouteById(id: number, values: Partial<typeof routes.$inferInsert>) {
  const [row] = await db.update(routes).set(values).where(eq(routes.id_routes as any, id)).returning();
  return row;
}

export async function deleteRouteById(id: number) {
  const [row] = await db.delete(routes).where(eq(routes.id_routes as any, id)).returning();
  return row;
}
