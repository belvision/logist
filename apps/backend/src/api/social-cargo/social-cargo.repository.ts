import db from '../../db/client';
import { cargo_messendger, tip_car, report } from '../../db/schema/schema';
import { desc, sql, or, and, ilike, not, eq, gte, lt, notInArray } from 'drizzle-orm';
import type { SocialCargoFilter } from './social-cargo.types';

export class SocialCargoRepository {
  async getSocialCargos(filter: SocialCargoFilter, userId?: string) {
    const { limit = 20, offset = 0, contains, notContains } = filter;

    // Проверяем лимит (максимум 250)
    const safeLimit = Math.min(limit, 250);

    // Текущая дата (начало дня в UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Собираем все условия фильтрации
    const whereConditions: any[] = [
      // Грузы с irrelevant < 3 (скрываем грузы с 3 и более отметками)
      lt(cargo_messendger.irrelevant, 3),
      // Дата окончания груза должна быть не раньше сегодняшнего дня
      gte(cargo_messendger.date_end, today),
    ];

    // Если пользователь авторизован, исключаем грузы, которые он уже отметил
    if (userId) {
      const reportedCargoIds = await db
        .select({ id_cargo: report.id_cargo })
        .from(report)
        .where(eq(report.id_user, userId));
      
      const reportedIds = reportedCargoIds.map(r => r.id_cargo);
      if (reportedIds.length > 0) {
        whereConditions.push(
          notInArray(cargo_messendger.id_cargo, reportedIds)
        );
      }
    }

    // Обработка фильтра "содержит" (поддержка запятых)
    if (contains) {
      const keywords = contains.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keywords.length > 0) {
        // Для каждого ключевого слова создаем OR условие по всем полям
        const keywordConditions = keywords.map(keyword => {
          const searchPattern = `%${keyword}%`;
          return or(
            ilike(cargo_messendger.departure_point, searchPattern),
            ilike(cargo_messendger.arrival_point, searchPattern),
            sql`${cargo_messendger.opisanie} ILIKE ${searchPattern}`,
            sql`${cargo_messendger.price} ILIKE ${searchPattern}`
          );
        });
        
        // Все ключевые слова должны найтись (AND между ними)
        whereConditions.push(and(...keywordConditions));
      }
    }

    // Обработка фильтра "не содержит" (поддержка запятых)
    if (notContains) {
      const keywords = notContains.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keywords.length > 0) {
        // Для каждого ключевого слова создаем условие исключения
        keywords.forEach(keyword => {
          const searchPattern = `%${keyword}%`;
          whereConditions.push(
            and(
              not(ilike(cargo_messendger.departure_point, searchPattern)),
              not(ilike(cargo_messendger.arrival_point, searchPattern)),
              sql`(${cargo_messendger.opisanie} IS NULL OR ${cargo_messendger.opisanie} NOT ILIKE ${searchPattern})`,
              sql`(${cargo_messendger.price} IS NULL OR ${cargo_messendger.price} NOT ILIKE ${searchPattern})`
            )
          );
        });
      }
    }

    // Объединяем все условия
    const finalWhere = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Базовый запрос с джойном
    const data = await db
      .select({
        id_cargo: cargo_messendger.id_cargo,
        departure_point: cargo_messendger.departure_point,
        arrival_point: cargo_messendger.arrival_point,
        id_car_type: cargo_messendger.id_car_type,
        car_type_name: tip_car.car_type,
        opisanie: cargo_messendger.opisanie,
        tonn: cargo_messendger.tonn,
        price: cargo_messendger.price,
        date_start: cargo_messendger.date_start,
        date_end: cargo_messendger.date_end,
        departure_place_id: cargo_messendger.departure_place_id,
        arrival_place_id: cargo_messendger.arrival_place_id,
        status: cargo_messendger.status,
        tel_1: cargo_messendger.tel_1,
        tel_2: cargo_messendger.tel_2,
      })
      .from(cargo_messendger)
      .leftJoin(tip_car, eq(cargo_messendger.id_car_type, tip_car.id_car_type))
      .where(finalWhere)
      .orderBy(desc(cargo_messendger.id_cargo))
      .limit(safeLimit)
      .offset(offset);

    // Получаем общее количество для пагинации
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cargo_messendger)
      .where(finalWhere);

    return {
      data,
      total: Number(count),
      limit: safeLimit,
      offset,
    };
  }
}

