import { CargoSearchSchema, sanitizeCargoSearchDto } from './cargo_search.schema';
import { searchCargoForCarService } from './cargo_search.service';

// ===== Поиск грузов для автомобиля =====
export async function searchCargoForCarHandler(c: any) {
  const id_cars = parseInt(c.req.param('id_cars') || '0');
  if (!id_cars || isNaN(id_cars)) {
    return c.json({ error: 'ID автомобиля обязателен и должен быть числом' }, 400);
  }

  const parsed = CargoSearchSchema.safeParse({ id_cars });
  if (!parsed.success) {
    return c.json({ error: 'Некорректные параметры запроса' }, 400);
  }

  const dto = sanitizeCargoSearchDto(parsed.data);
  const res = await searchCargoForCarService(dto);
  
  return c.json(res.ok ? { items: res.items } : { error: res.error }, res.status);
}
