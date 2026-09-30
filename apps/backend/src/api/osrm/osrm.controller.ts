// apps/backend/src/api/osrm/osrm.controller.ts

import type { Context } from 'hono';
import { BuildRouteSchema } from './osrm.schema';
import { buildRouteService } from './osrm.service';

/**
 * POST /api/osrm/route
 * Тело запроса валидируется по BuildRouteSchema:
 * {
 *   start: { lat: number, lon: number },
 *   end: { lat: number, lon: number },
 *   avoidMotorwayToll?: boolean,
 *   preferShortest?: boolean
 * }
 *
 * Ответ (успех):
 * {
 *   ok: true,
 *   data: {
 *     distance: number,        // метры
 *     duration: number,        // секунды
 *     geometry: { type: 'LineString', coordinates: [lon,lat][] },
 *     nodes?: number[]         // для совместимости с фронтом (может быть undefined)
 *   }
 * }
 *
 * Ответ (ошибка):
 * { error: string }
 */
export async function buildRouteHandler(c: Context) {
  try {
    const raw = await c.req.json().catch(() => ({}));
    const parsed = BuildRouteSchema.safeParse(raw);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Неверные параметры запроса',
          issues: parsed.error.issues,
        },
        400,
      );
    }

    const result = await buildRouteService(parsed.data);

    if (!result?.ok) {
      // сервис вернул контролируемую ошибку
      return c.json(
        {
          error: result?.error || 'Ошибка построения маршрута',
        },
        502,
      );
    }

    return c.json(
      {
        ok: true,
        data: result.data,
      },
      200,
    );
  } catch (err: any) {
    // непредвиденная ошибка
    console.error('OSRM buildRouteHandler error:', err);
    return c.json(
      {
        error: err?.message || 'Внутренняя ошибка сервера',
      },
      500,
    );
  }
}
