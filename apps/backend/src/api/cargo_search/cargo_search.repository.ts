import db from '../../db/client';
import { cars, cargo } from '../../db/schema/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Получить параметры автомобиля по ID
 */
export async function getCarParams(carId: number) {
  const [car] = await db
    .select({
      tonn_min: cars.tonn_min,
      m3_min: cars.m3_min,
      tonn_max: cars.tonn_max,
      m3_max: cars.m3_max,
      places: cars.places,
    })
    .from(cars)
    .where(eq(cars.id_cars, carId));
  return car;
}

/**
 * Найти подходящие грузы по параметрам автомобиля
 */
export async function findMatchingCargo(carParams: {
  tonn_min: number;
  m3_min: number;
  tonn_max: number;
  m3_max: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Начало дня
  
  const results = await db
    .select()
    .from(cargo)
    .where(
      and(
        gte(cargo.m3, carParams.m3_min), // cargo.m3 >= cars.m3_min
        lte(cargo.m3, carParams.m3_max), // cargo.m3 <= cars.m3_max
        gte(cargo.tonn, carParams.tonn_min), // cargo.tonn >= cars.tonn_min
        lte(cargo.tonn, carParams.tonn_max), // cargo.tonn <= cars.tonn_max
        gte(cargo.date_start, today) // cargo.date_start >= сегодня
      )
    );
  return results;
}
