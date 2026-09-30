import db from '../../db/client';
import { cargo, cars } from '../../db/schema/schema';
import { eq, and, lte, gte } from 'drizzle-orm';

/**
 * Получить параметры груза (массу, объём и пункт отправления) по его ID.
 */
export async function getCargoParams(cargoId: number) {
  const [item] = await db
    .select({
      tonn: cargo.tonn,
      m3: cargo.m3,
      departure_point: cargo.departure_point,
    })
    .from(cargo)
    .where(eq(cargo.id_cargo, cargoId));
  return item;
}

/**
 * Найти автомобили, подходящие по грузоподъёмности и объёму для указанного груза.
 * Условие: cars.tonn_min ≤ cargo.tonn ≤ cars.tonn_max и cars.m3_min ≤ cargo.m3 ≤ cars.m3_max.
 */
export async function findMatchingCars(cargoParams: { tonn: number; m3: number }) {
  const results = await db
    .select()
    .from(cars)
    .where(
      and(
        // Минимальная грузоподъёмность автомобиля должна быть меньше или равна массе груза
        lte(cars.tonn_min, cargoParams.tonn),
        // Максимальная грузоподъёмность — больше или равна
        gte(cars.tonn_max, cargoParams.tonn),
        // Минимальный объём автомобиля должен быть меньше или равен объёму груза
        lte(cars.m3_min, cargoParams.m3),
        // Максимальный объём — больше или равен
        gte(cars.m3_max, cargoParams.m3)
      )
    );
  return results;
}