import { CarSearchPublicSchema, sanitizeCarSearchPublicDto } from './car_search_public.schema';
import { searchCarsPublicService } from './car_search_public.service';

// ===== Публичный поиск автомобилей (без авторизации) =====
export async function searchCarsPublicHandler(c: any) {
  try {
    // Получаем параметры из query string
    const location = c.req.query('location');
    const radius = c.req.query('radius');
    const tonnMin = c.req.query('tonn_min');
    const tonnMax = c.req.query('tonn_max');
    const m3Min = c.req.query('m3_min');
    const m3Max = c.req.query('m3_max');

    // Валидируем и нормализуем входные данные
    const parsed = CarSearchPublicSchema.safeParse({
      location,
      radius: radius ? parseInt(radius) : undefined,
      tonn_min: tonnMin ? parseFloat(tonnMin) : undefined,
      tonn_max: tonnMax ? parseFloat(tonnMax) : undefined,
      m3_min: m3Min ? parseFloat(m3Min) : undefined,
      m3_max: m3Max ? parseFloat(m3Max) : undefined,
    });

    if (!parsed.success) {
      return c.json({ 
        error: 'Некорректные параметры запроса',
        details: parsed.error.errors 
      }, 400);
    }

    const dto = sanitizeCarSearchPublicDto(parsed.data);
    const res = await searchCarsPublicService(dto);

    return c.json(
      res.ok 
        ? { 
            items: res.items,
            search_location: res.search_location,
            total: res.items.length 
          } 
        : { error: res.error }, 
      res.status
    );
  } catch (error) {
    console.error('Public car search handler error:', error);
    return c.json({ error: 'Внутренняя ошибка сервера' }, 500);
  }
}
