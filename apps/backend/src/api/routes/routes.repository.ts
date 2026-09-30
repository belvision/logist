import db from '../../db/client';
import { routes, cars, company, users_company } from '../../db/schema/schema';
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

export async function selectRoutesByCompany(companyId: string) {
  const rows = await db
    .select({
      id_routes: routes.id_routes,
      id_cars: routes.id_cars,
      id_company: routes.id_company,
      created_by: routes.created_by,
      departure_point: routes.departure_point,
      arrival_point: routes.arrival_point,
      date_start: routes.date_start,
      opisanie: routes.opisanie,
      places_departure: routes.places_departure,
      places_arrival: routes.places_arrival,
      created_at: routes.created_at,
      updated_at: routes.updated_at,
    })
    .from(routes)
    .leftJoin(cars, eq(routes.id_cars, cars.id_cars))
    .where(eq(routes.id_company as any, companyId));
  return rows;
}

export async function getUserCompany(userId: string) {
  const [userCompany] = await db
    .select({
      id_company: company.id_company,
    })
    .from(users_company)
    .innerJoin(company, eq(users_company.id_company, company.id_company))
    .where(eq(users_company.id_user, userId))
    .limit(1);
  
  return userCompany;
}
