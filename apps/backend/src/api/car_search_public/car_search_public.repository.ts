import db from '../../db/client';
import { cars } from '../../db/schema/schema';
import { company } from '../../db/schema/schema';
import { tip_car } from '../../db/schema/schema';
import { tip_zagryzki } from '../../db/schema/schema';
import { and, gte, lte, eq } from 'drizzle-orm';

/**
 * Найти автомобили в радиусе от указанной точки с фильтрами по грузоподъемности и объему.
 * Включает информацию о компании-владельце.
 */
export async function findCarsInRadius(params: {
  lat: number;
  lon: number;
  radiusKm: number;
  tonnMin?: number;
  tonnMax?: number;
  m3Min?: number;
  m3Max?: number;
}) {
  const conditions = [
    eq(cars.search, true), // Только автомобили, доступные для поиска
  ];

  // Фильтры по грузоподъемности
  if (params.tonnMin !== undefined) {
    conditions.push(gte(cars.tonn_max, params.tonnMin));
  }
  if (params.tonnMax !== undefined) {
    conditions.push(lte(cars.tonn_min, params.tonnMax));
  }

  // Фильтры по объему
  if (params.m3Min !== undefined) {
    conditions.push(gte(cars.m3_max, params.m3Min));
  }
  if (params.m3Max !== undefined) {
    conditions.push(lte(cars.m3_min, params.m3Max));
  }

  const results = await db
    .select({
      // Данные автомобиля
      id_cars: cars.id_cars,
      title: cars.title,
      tonn_min: cars.tonn_min,
      tonn_max: cars.tonn_max,
      m3_min: cars.m3_min,
      m3_max: cars.m3_max,
      price: cars.price,
      places: cars.places,
      id_car_type: cars.id_car_type,
      id_tip_zagryzki: cars.id_tip_zagryzki,
      // Данные компании
      company_id: company.id_company,
      company_name: company.name_company,
      company_unp: company.unp,
      company_entity_type: company.entity_type,
      company_address: company.ur_address,
      company_tel_1: company.tel_1,
      company_tel_2: company.tel_2,
      company_email: company.email,
      // Типы автомобиля и загрузки
      car_type: tip_car.car_type,
      tip_zagryzki: tip_zagryzki.tip_zagryzki,
    })
    .from(cars)
    .leftJoin(company, eq(cars.id_company, company.id_company))
    .leftJoin(tip_car, eq(cars.id_car_type, tip_car.id_car_type))
    .leftJoin(tip_zagryzki, eq(cars.id_tip_zagryzki, tip_zagryzki.id_tip_zagryzki))
    .where(and(...conditions));

  return results;
}
