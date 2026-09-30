import { BuildRouteSchema, FindCompanionCargosSchema, SaveRouteSchema } from './companion_cargo.schema';
import { buildRouteService, findCompanionCargosService, getSavedRoutesService, saveRouteService, deleteSavedRouteService } from './companion_cargo.service';

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return c.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

// Получение сохранённых маршрутов
export async function getSavedRoutesHandler(c: any) {
  try {
    const id_user = c.get('user')?.id_user;
    if (!id_user) {
      return c.json({ ok: false, error: 'Не авторизован' }, 401);
    }
    
    const routes = await getSavedRoutesService(id_user);
    return c.json({ ok: true, routes });
  } catch (error) {
    console.error('Error getting saved routes:', error);
    return c.json({ ok: false, error: 'Ошибка получения сохранённых маршрутов' }, 500);
  }
}

// Сохранение маршрута
export async function saveRouteHandler(c: any) {
  try {
    const id_user = c.get('user')?.id_user;
    if (!id_user) {
      return c.json({ ok: false, error: 'Не авторизован' }, 401);
    }
    
    const body = await c.req.json();
    const validatedData = SaveRouteSchema.parse(body);
    
    const route = await saveRouteService(id_user, validatedData);
    return c.json({ ok: true, route });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({ ok: false, error: 'Неверные данные' }, 400);
    }
    console.error('Error saving route:', error);
    return c.json({ ok: false, error: 'Ошибка сохранения маршрута' }, 500);
  }
}

// Удаление сохранённого маршрута
export async function deleteSavedRouteHandler(c: any) {
  try {
    const id_user = c.get('user')?.id_user;
    if (!id_user) {
      return c.json({ ok: false, error: 'Не авторизован' }, 401);
    }
    
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ ok: false, error: 'Неверный ID маршрута' }, 400);
    }
    
    await deleteSavedRouteService(id, id_user);
    return c.json({ ok: true });
  } catch (error) {
    console.error('Error deleting saved route:', error);
    return c.json({ ok: false, error: error instanceof Error ? error.message : 'Ошибка удаления маршрута' }, 500);
  }
}
