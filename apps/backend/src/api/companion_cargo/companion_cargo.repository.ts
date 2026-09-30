// apps/backend/src/api/companion_cargo/companion_cargo.repository.ts
import db from '../../db/client';
import { cargo, company, routes_save } from '../../db/schema/schema';
import { and, gte, eq, asc, desc } from 'drizzle-orm';

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
      route_nodes: cargo.route_nodes,
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
        gte(cargo.date_end, today),
        eq(cargo.status, 0),      // активный
        eq(cargo.irrelevant, 0),  // релевантный
      )
    );
  return rows;
}

// Функции для работы с сохранёнными маршрутами
export async function getSavedRoutesByUserId(id_user: string) {
  const routes = await db
    .select()
    .from(routes_save)
    .where(eq(routes_save.id_user, id_user))
    .orderBy(desc(routes_save.id)); // Сначала новые
  
  return routes;
}

export async function saveRoute(
  id_user: string, 
  departure_point: Record<string, { lat: number; lon: number; name: string }>, 
  arrival_point: Record<string, { lat: number; lon: number; name: string }>,
  places_departure?: Array<Record<string, { lat: number; lon: number; name: string }>>
) {
  // Получаем все маршруты пользователя
  const existingRoutes = await db
    .select()
    .from(routes_save)
    .where(eq(routes_save.id_user, id_user))
    .orderBy(asc(routes_save.id)); // Сначала старые (с минимальным id)
  
  // Проверяем, нет ли уже такого же маршрута (сравниваем по ключам и координатам)
  const duplicateRoute = existingRoutes.find(route => {
    const depKeys = Object.keys(route.departure_point);
    const arrKeys = Object.keys(route.arrival_point);
    const newDepKeys = Object.keys(departure_point);
    const newArrKeys = Object.keys(arrival_point);
    
    // Сравниваем ключи и координаты
    if (depKeys.length !== newDepKeys.length || arrKeys.length !== newArrKeys.length) {
      return false;
    }
    
    const depMatch = depKeys.every(key => {
      const old = route.departure_point[key];
      const new_ = departure_point[key];
      return old && new_ && old.lat === new_.lat && old.lon === new_.lon;
    });
    
    const arrMatch = arrKeys.every(key => {
      const old = route.arrival_point[key];
      const new_ = arrival_point[key];
      return old && new_ && old.lat === new_.lat && old.lon === new_.lon;
    });
    
    return depMatch && arrMatch;
  });
  
  // Если маршрут уже существует, удаляем его (будет добавлен заново с новой датой)
  if (duplicateRoute) {
    await db
      .delete(routes_save)
      .where(eq(routes_save.id, duplicateRoute.id));
  }
  
  // Вычисляем количество маршрутов после удаления дубликата
  const currentRoutesCount = duplicateRoute ? existingRoutes.length - 1 : existingRoutes.length;
  
  // Если уже есть 5 маршрутов, удаляем самый старый (не дубликат, если он был)
  if (currentRoutesCount >= 5) {
    const oldestRoute = duplicateRoute 
      ? existingRoutes.find(route => route.id !== duplicateRoute.id) || existingRoutes[0]
      : existingRoutes[0];
    
    if (oldestRoute) {
      await db
        .delete(routes_save)
        .where(eq(routes_save.id, oldestRoute.id));
    }
  }
  
  // Сохраняем новый маршрут
  const [newRoute] = await db
    .insert(routes_save)
    .values({
      id_user,
      departure_point,
      arrival_point,
      places_departure: places_departure || [],
    })
    .returning();
  
  return newRoute;
}

export async function deleteSavedRoute(id: number, id_user: string) {
  const [deleted] = await db
    .delete(routes_save)
    .where(and(eq(routes_save.id, id), eq(routes_save.id_user, id_user)))
    .returning();
  
  return deleted;
}
