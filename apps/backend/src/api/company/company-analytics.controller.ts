import db from '../../db/client';
import { company, cars, cargo, routes, reviews } from '../../db/schema/schema';
import { count, sql, eq, and, gte, desc } from 'drizzle-orm';
import { ReviewsRepository } from '../reviews/reviews.repository';

export async function getCompanyAnalyticsHandler(c: any) {
  try {
    const companyId = c.req.param('companyId');
    if (!companyId) {
      return c.json({ error: 'ID компании обязателен' }, 400);
    }

    const reviewsRepository = new ReviewsRepository();

    // Проверяем существование компании
    const companyExists = await db
      .select({ count: count() })
      .from(company)
      .where(eq(company.id_company, companyId));

    if (companyExists[0]?.count === 0) {
      return c.json({ error: 'Компания не найдена' }, 404);
    }

    // Получаем аналитические данные
    const [
      totalCars,
      activeCars,
      totalCargo,
      activeCargo,
      // Статистика по грузоподъемности
      tonnageStats,
      // Популярные маршруты для расчета экономии
      popularRoutes,
      // Статистика по датам грузов (для расчета активности)
      cargoByMonth,
      // Статистика отзывов
      reviewStats
    ] = await Promise.all([
      // Общее количество автомобилей
      db.select({ count: count() }).from(cars).where(eq(cars.id_company, companyId)),
      
      // Активные автомобили
      db.select({ count: count() }).from(cars).where(
        and(eq(cars.id_company, companyId), sql`search = true`)
      ),
      
      // Общее количество грузов
      db.select({ count: count() }).from(cargo).where(eq(cargo.id_company, companyId)),
      
      // Активные грузы
      db.select({ count: count() }).from(cargo).where(
        and(eq(cargo.id_company, companyId), sql`date_end > NOW()`)
      ),
      
      // Статистика грузоподъемности
      db.select({
        avgMin: sql<number>`AVG(tonn_min)`,
        avgMax: sql<number>`AVG(tonn_max)`,
        totalCapacity: sql<number>`SUM(tonn_max)`
      }).from(cars).where(eq(cars.id_company, companyId)),
      
      // Популярные маршруты (для расчета потенциальной экономии)
      db.select({
        route: sql<string>`CONCAT(departure_point, ' → ', arrival_point)`,
        count: count(),
        avgDistance: sql<number>`AVG(
          CASE 
            WHEN departure_place_id IS NOT NULL AND arrival_place_id IS NOT NULL 
            THEN 1 
            ELSE 0 
          END
        )`
      })
      .from(cargo)
      .where(eq(cargo.id_company, companyId))
      .groupBy(sql`departure_point, arrival_point`)
      .orderBy(sql`count(*) DESC`)
      .limit(10),
      
      // Грузы по месяцам (для расчета активности)
      db.select({
        month: sql<string>`TO_CHAR(date_start, 'YYYY-MM')`,
        count: count(),
        totalTonnage: sql<number>`SUM(tonn)`
      })
      .from(cargo)
      .where(eq(cargo.id_company, companyId))
      .groupBy(sql`TO_CHAR(date_start, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(date_start, 'YYYY-MM') DESC`)
      .limit(6),
      
      // Статистика отзывов
      reviewsRepository.getCompanyRatingStats(companyId)
    ]);

    // Рассчитываем аналитические показатели
    const analytics = calculateAnalytics({
      totalCars: totalCars[0]?.count || 0,
      activeCars: activeCars[0]?.count || 0,
      totalCargo: totalCargo[0]?.count || 0,
      activeCargo: activeCargo[0]?.count || 0,
      tonnageStats: tonnageStats[0],
      popularRoutes,
      cargoByMonth,
      reviewStats
    });

    return c.json(analytics);
  } catch (error) {
    console.error('Error fetching company analytics:', error);
    return c.json({ error: 'Failed to fetch company analytics' }, 500);
  }
}

function calculateAnalytics(data: any) {
  const {
    totalCars,
    activeCars,
    totalCargo,
    activeCargo,
    tonnageStats,
    popularRoutes,
    cargoByMonth,
    reviewStats
  } = data;

  // 1. Средняя загрузка парка (активные автомобили / общее количество)
  const fleetUtilization = totalCars > 0 ? Math.round((activeCars / totalCars) * 100) : 0;

  // 2. Экономия топлива благодаря попутным грузам
  const fuelSavings = calculateFuelSavings(popularRoutes, totalCargo);

  // 3. Среднее время в пути (на основе популярных маршрутов)
  const avgTravelTime = calculateAvgTravelTime(popularRoutes);

  // 4. Рейтинг компании (используем реальные отзывы, если есть)
  const companyRating = reviewStats && reviewStats.total_reviews > 0
    ? `${reviewStats.average_rating}★`
    : calculateCompanyRating({
        fleetUtilization,
        fuelSavings,
        totalCargo,
        activeCargo
      });

  // 5. Тренды активности
  const activityTrends = calculateActivityTrends(cargoByMonth);

  return {
    overview: {
      totalCars,
      activeCars,
      totalCargo,
      activeCargo,
      fleetUtilization,
      fuelSavings,
      avgTravelTime,
      companyRating
    },
    analytics: {
      fleetUtilization: {
        value: fleetUtilization,
        description: 'Использование парка',
        trend: activityTrends.fleetTrend
      },
      fuelSavings: {
        value: fuelSavings,
        description: 'Благодаря попутным грузам',
        trend: activityTrends.fuelTrend
      },
      avgTravelTime: {
        value: avgTravelTime,
        description: 'Среднее время',
        trend: activityTrends.timeTrend
      },
      companyRating: {
        value: companyRating,
        description: reviewStats && reviewStats.total_reviews > 0 
          ? `На основе ${reviewStats.total_reviews} отзыв${reviewStats.total_reviews > 1 ? 'ов' : 'а'}`
          : 'Расчетная оценка',
        trend: activityTrends.ratingTrend,
        reviewsCount: reviewStats?.total_reviews || 0,
        realRating: reviewStats && reviewStats.total_reviews > 0
      }
    },
    reviewStats: reviewStats || null,
    tonnage: {
      avgMin: tonnageStats?.avgMin || 0,
      avgMax: tonnageStats?.avgMax || 0,
      totalCapacity: tonnageStats?.totalCapacity || 0
    },
    popularRoutes: popularRoutes.slice(0, 5).map((route: any) => ({
      route: route.route,
      count: route.count,
      potentialSavings: Math.round(route.count * 0.15) // 15% экономии на каждый повторный маршрут
    })),
    trends: activityTrends,
    lastUpdated: new Date().toISOString()
  };
}

function calculateFuelSavings(popularRoutes: any[], totalCargo: number): number {
  if (popularRoutes.length === 0 || totalCargo === 0) return 0;

  // Базовый расчет экономии:
  // 1. Попутные грузы снижают холостые пробеги на 15-25%
  // 2. Повторные маршруты дают дополнительную экономию
  // 3. Чем больше грузов на похожих маршрутах, тем больше экономия

  const routeEfficiency = popularRoutes.reduce((total, route) => {
    const routeCount = route.count;
    const efficiency = Math.min(routeCount * 0.05, 0.25); // Максимум 25% экономии на маршрут
    return total + efficiency;
  }, 0);

  const baseSavings = Math.min(routeEfficiency * 100, 30); // Максимум 30% экономии
  return Math.round(baseSavings);
}

function calculateAvgTravelTime(popularRoutes: any[]): string {
  if (popularRoutes.length === 0) return '0ч';

  // Примерный расчет времени на основе популярности маршрутов
  // Более популярные маршруты обычно короче по времени
  const avgHours = popularRoutes.length > 0 ? 
    Math.max(1.5, 4 - (popularRoutes.length * 0.3)) : 2.4;
  
  return `${avgHours.toFixed(1)}ч`;
}

function calculateCompanyRating(data: any): string {
  const { fleetUtilization, fuelSavings, totalCargo, activeCargo } = data;
  
  // Рейтинг на основе:
  // - Использование парка (40%)
  // - Экономия топлива (30%)
  // - Активность грузов (30%)
  
  const fleetScore = (fleetUtilization / 100) * 0.4;
  const fuelScore = (fuelSavings / 30) * 0.3; // 30% - максимальная экономия
  const activityScore = totalCargo > 0 ? (activeCargo / totalCargo) * 0.3 : 0;
  
  const totalScore = (fleetScore + fuelScore + activityScore) * 5; // Шкала 0-5
  const rating = Math.min(Math.max(totalScore, 3.0), 5.0); // Минимум 3.0, максимум 5.0
  
  return `${rating.toFixed(1)}★`;
}

function calculateActivityTrends(cargoByMonth: any[]) {
  if (cargoByMonth.length < 2) {
    return {
      fleetTrend: 'stable',
      fuelTrend: 'stable', 
      timeTrend: 'stable',
      ratingTrend: 'stable'
    };
  }

  const current = cargoByMonth[0]?.count || 0;
  const previous = cargoByMonth[1]?.count || 0;
  
  const trend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
  
  return {
    fleetTrend: trend,
    fuelTrend: trend,
    timeTrend: trend,
    ratingTrend: trend
  };
}
