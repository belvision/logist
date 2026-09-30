import { CarSearchSchema, sanitizeCarSearchDto } from './car_search.schema';
import { searchCarsForCargoService } from './car_search.service';

// ===== Поиск автомобилей для груза =====
export async function searchCarsForCargoHandler(c: any) {
  // Получаем id груза из пути.
  const id_cargo = parseInt(c.req.param('id_cargo') || '0');
  // Радиус передаётся через query-параметр. Если не указан, будет установлен по умолчанию.
  const radiusParam = c.req.query('radius');
  const radius = radiusParam ? parseInt(radiusParam.toString()) : undefined;

  if (!id_cargo || isNaN(id_cargo)) {
    return c.json({ error: 'ID груза обязателен и должен быть числом' }, 400);
  }

  // Валидируем и нормализуем входные данные.
  const parsed = CarSearchSchema.safeParse({ id_cargo, radius });
  if (!parsed.success) {
    return c.json({ error: 'Некорректные параметры запроса' }, 400);
  }

  const dto = sanitizeCarSearchDto(parsed.data);
  const res = await searchCarsForCargoService(dto);

  return c.json(res.ok ? { items: res.items } : { error: res.error }, res.status);
}