import { BuildRouteSchema, FindCompanionCargosSchema } from './companion_cargo.schema';
import { buildRouteService, findCompanionCargosService } from './companion_cargo.service';

// Построение маршрута
export async function buildRouteHandler(c: any) {
  try {
    const body = await c.req.json();
    const parsed = BuildRouteSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Неверные параметры запроса' }, 400);
    }

    const result = await buildRouteService(parsed.data);
    
    if (!result.ok) {
      return c.json({ error: result.data }, 500);
    }

    return c.json(result.data);
  } catch (error) {
    console.error('Build route error:', error);
    return c.json({ error: 'Внутренняя ошибка сервера' }, 500);
  }
}

// Поиск попутных грузов
export async function findCompanionCargosHandler(c: any) {
  try {
    const body = await c.req.json();
    const parsed = FindCompanionCargosSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Неверные параметры запроса' }, 400);
    }

    const result = await findCompanionCargosService(parsed.data);
    
    if (!result.ok) {
      return c.json({ error: result.data }, 500);
    }

    return c.json(result.data);
  } catch (error) {
    console.error('Find companion cargos error:', error);
    return c.json({ error: 'Внутренняя ошибка сервера' }, 500);
  }
}
