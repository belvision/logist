import db from '../../db/client';
import { company, cars, cargo, routes, users_company } from '../../db/schema/schema';
import { count, sql, eq, and, gte } from 'drizzle-orm';

export async function getCompanyStatsHandler(c: any) {
  try {
    const companyId = c.req.param('companyId');
    if (!companyId) {
      return c.json({ error: 'ID компании обязателен' }, 400);
    }

    // Проверяем существование компании
    const companyExists = await db
      .select({ count: count() })
      .from(company)
      .where(eq(company.id_company, companyId));

    if (companyExists[0]?.count === 0) {
      return c.json({ error: 'Компания не найдена' }, 404);
    }

    // Получаем статистику компании
    const [
      totalCars,
      activeCars,
      recentCars,
      totalCargo,
      activeCargo,
      recentCargo,
      totalRoutes,
      recentRoutes,
    ] = await Promise.all([
      // Общее количество автомобилей компании
      db.select({ count: count() }).from(cars).where(eq(cars.id_company, companyId)),
      
      // Активные автомобили (с флагом search = true)
      db.select({ count: count() }).from(cars).where(
        and(eq(cars.id_company, companyId), sql`search = true`)
      ),
      
      // Недавно добавленные автомобили (за последние 7 дней)
      db.select({ count: count() }).from(cars).where(
        and(eq(cars.id_company, companyId), gte(cars.created_at, sql`NOW() - INTERVAL '7 days'`))
      ),
      
      // Общее количество грузов компании
      db.select({ count: count() }).from(cargo).where(eq(cargo.id_company, companyId)),
      
      // Активные грузы (не истекшие)
      db.select({ count: count() }).from(cargo).where(
        and(eq(cargo.id_company, companyId), sql`date_end > NOW()`)
      ),
      
      // Недавно добавленные грузы (за последние 7 дней)
      db.select({ count: count() }).from(cargo).where(
        and(eq(cargo.id_company, companyId), gte(cargo.created_at, sql`NOW() - INTERVAL '7 days'`))
      ),
      
      // Общее количество маршрутов компании
      db.select({ count: count() }).from(routes).where(eq(routes.id_company, companyId)),
      
      // Недавно добавленные маршруты (за последние 7 дней)
      db.select({ count: count() }).from(routes).where(
        and(eq(routes.id_company, companyId), gte(routes.created_at, sql`NOW() - INTERVAL '7 days'`))
      ),
    ]);

    // Получаем популярные маршруты компании (топ-5)
    const popularRoutes = await db
      .select({
        route: sql<string>`CONCAT(departure_point, ' → ', arrival_point)`,
        count: count()
      })
      .from(routes)
      .where(eq(routes.id_company, companyId))
      .groupBy(sql`departure_point, arrival_point`)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    // Получаем статистику по типам автомобилей (упрощенная версия)
    const carTypesStats = await db
      .select({
        car_type: sql<string>`'Тип автомобиля'`,
        count: count()
      })
      .from(cars)
      .where(eq(cars.id_company, companyId))
      .groupBy(sql`id_car_type`)
      .orderBy(sql`count(*) DESC`);

    // Получаем статистику по грузоподъемности
    const tonnageStats = await db
      .select({
        avg_tonn_min: sql<number>`AVG(tonn_min)`,
        avg_tonn_max: sql<number>`AVG(tonn_max)`,
        total_capacity: sql<number>`SUM(tonn_max)`
      })
      .from(cars)
      .where(eq(cars.id_company, companyId));

    // Получаем статистику маршрутов по месяцам (за последние 6 месяцев)
    const routesByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(created_at, 'YYYY-MM')`,
        count: count()
      })
      .from(routes)
      .where(
        and(
          eq(routes.id_company, companyId),
          gte(routes.created_at, sql`NOW() - INTERVAL '6 months'`)
        )
      )
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM')`);

    const stats = {
      overview: {
        totalCars: totalCars[0]?.count || 0,
        activeCars: activeCars[0]?.count || 0,
        totalCargo: totalCargo[0]?.count || 0,
        activeCargo: activeCargo[0]?.count || 0,
        totalRoutes: totalRoutes[0]?.count || 0,
        recentCars: recentCars[0]?.count || 0,
        recentCargo: recentCargo[0]?.count || 0,
        recentRoutes: recentRoutes[0]?.count || 0
      },
      popularRoutes: popularRoutes.map((route: any) => ({
        route: route.route,
        count: route.count
      })),
      carTypes: carTypesStats.map((type: any) => ({
        type: type.car_type,
        count: type.count
      })),
      tonnage: {
        avgMin: tonnageStats[0]?.avg_tonn_min || 0,
        avgMax: tonnageStats[0]?.avg_tonn_max || 0,
        totalCapacity: tonnageStats[0]?.total_capacity || 0
      },
      routesByMonth: routesByMonth.map((month: any) => ({
        month: month.month,
        count: month.count
      })),
      lastUpdated: new Date().toISOString()
    };

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching company stats:', error);
    return c.json({ error: 'Failed to fetch company statistics' }, 500);
  }
}
