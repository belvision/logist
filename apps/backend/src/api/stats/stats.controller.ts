import db from '../../db/client';
import { users, company, cars, cargo, routes } from '../../db/schema/schema';
import { count, sql } from 'drizzle-orm';

export async function getStatsHandler(c: any) {
  try {
    // Получаем общую статистику
    const [
      totalUsers,
      totalCompanies,
      totalCars,
      totalCargo,
      totalRoutes,
      activeCars,
      activeCargo,
      recentCars,
      recentCargo
    ] = await Promise.all([
      // Общее количество пользователей
      db.select({ count: count() }).from(users),
      
      // Общее количество компаний
      db.select({ count: count() }).from(company),
      
      // Общее количество автомобилей
      db.select({ count: count() }).from(cars),
      
      // Общее количество грузов
      db.select({ count: count() }).from(cargo),
      
      // Общее количество маршрутов
      db.select({ count: count() }).from(routes),
      
      // Активные автомобили (с флагом search = true)
      db.select({ count: count() }).from(cars).where(sql`search = true`),
      
      // Активные грузы (не истекшие)
      db.select({ count: count() }).from(cargo).where(sql`date_end > NOW()`),
      
      // Новые автомобили за последние 24 часа
      db.select({ count: count() }).from(cars).where(sql`created_at > NOW() - INTERVAL '24 hours'`),
      
      // Новые грузы за последние 24 часа
      db.select({ count: count() }).from(cargo).where(sql`created_at > NOW() - INTERVAL '24 hours'`)
    ]);

    // Получаем популярные маршруты (топ-5 по количеству грузов)
    const popularRoutes = await db
      .select({
        route: sql<string>`CONCAT(departure_point, ' → ', arrival_point)`,
        count: count()
      })
      .from(cargo)
      .groupBy(sql`departure_point, arrival_point`)
      .orderBy(sql`count(*)`)
      .limit(5);

    // Получаем статистику по регионам (топ-5 городов отправления)
    const topDepartureCities = await db
      .select({
        city: sql<string>`departure_point`,
        count: count()
      })
      .from(cargo)
      .groupBy(sql`departure_point`)
      .orderBy(sql`count(*)`)
      .limit(5);

    const stats = {
      overview: {
        totalUsers: Number(totalUsers[0]?.count || 0),
        totalCompanies: Number(totalCompanies[0]?.count || 0),
        totalCars: Number(totalCars[0]?.count || 0),
        totalCargo: Number(totalCargo[0]?.count || 0),
        totalRoutes: Number(totalRoutes[0]?.count || 0),
        activeCars: Number(activeCars[0]?.count || 0),
        activeCargo: Number(activeCargo[0]?.count || 0),
        recentCars: Number(recentCars[0]?.count || 0),
        recentCargo: Number(recentCargo[0]?.count || 0)
      },
      popularRoutes: popularRoutes.map(route => ({
        route: route.route,
        count: route.count
      })),
      topCities: topDepartureCities.map(city => ({
        city: city.city,
        count: city.count
      })),
      lastUpdated: new Date().toISOString()
    };

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
}
