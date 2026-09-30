import db from '../../db/client';
import { cars, company, cars_drivers, users, users_company } from '../../db/schema/schema';
import { eq, and } from 'drizzle-orm';

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
  try {
    const [row] = await db.delete(cars).where(eq(cars.id_cars as any, id)).returning();
    return row;
  } catch (error: any) {
    // Логируем ошибку для отладки
    console.error('Error deleting car:', error);
    // Если ошибка связана с внешним ключом, пробрасываем её дальше
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('constraint')) {
      throw new Error('Нельзя удалить автомобиль: к нему привязаны маршруты. Сначала удалите все маршруты.');
    }
    throw error;
  }
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

// Функции для управления водителями
export async function addDriverToCar(carId: number, userId: string) {
  const [row] = await db.insert(cars_drivers).values({
    id_cars: carId,
    id_user: userId as any,
  }).returning();
  return row;
}

export async function removeDriverFromCar(carId: number, userId: string) {
  const [row] = await db.delete(cars_drivers)
    .where(and(
      eq(cars_drivers.id_cars, carId),
      eq(cars_drivers.id_user, userId as any)
    ))
    .returning();
  return row;
}

export async function getCarDrivers(carId: number) {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      id_cars_drivers: cars_drivers.id_cars_drivers,
      created_at: cars_drivers.created_at,
    })
    .from(cars_drivers)
    .innerJoin(users, eq(cars_drivers.id_user, users.id_user))
    .where(eq(cars_drivers.id_cars, carId));
  return rows;
}

export async function isDriverAssignedToCar(carId: number, userId: string) {
  const [row] = await db
    .select()
    .from(cars_drivers)
    .where(and(
      eq(cars_drivers.id_cars, carId),
      eq(cars_drivers.id_user, userId as any)
    ))
    .limit(1);
  return !!row;
}

export async function isUserDriverInCompany(userId: string, companyId: string) {
  const [row] = await db
    .select()
    .from(users_company)
    .where(and(
      eq(users_company.id_user, userId as any),
      eq(users_company.id_company, companyId as any),
      eq(users_company.role, 'Водитель' as any)
    ))
    .limit(1);
  return !!row;
}

export async function getCompanyDrivers(companyId: string) {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
    })
    .from(users_company)
    .innerJoin(users, eq(users_company.id_user, users.id_user))
    .where(and(
      eq(users_company.id_company, companyId as any),
      eq(users_company.role, 'Водитель' as any)
    ));
  return rows;
}

