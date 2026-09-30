import { Context } from 'hono';
import { buildRouteService } from '../companion_cargo/companion_cargo.service';

interface BuildCargoRouteDto {
  points: Array<{ lat: number; lon: number }>;
  avoidMotorwayToll?: boolean;
  preferShortest?: boolean;
}

export async function buildCargoRouteHandler(c: Context) {
  try {
    const body = await c.req.json();
    
    if (!body.points || body.points.length < 2) {
      return c.json({ 
        ok: false, 
        error: 'Необходимо указать минимум 2 точки' 
      }, 400);
    }

    // Используем существующий сервис построения маршрута
    const result = await buildRouteService({
      points: body.points,
      avoidMotorwayToll: body.avoidMotorwayToll || false,
      preferShortest: body.preferShortest || false,
    });

    if (result.ok) {
      return c.json(result.data);
    } else {
      return c.json({ 
        ok: false, 
        error: result.data 
      }, 400);
    }
  } catch (error) {
    console.error('Error building cargo route:', error);
    return c.json({ 
      ok: false, 
      error: 'Ошибка построения маршрута' 
    }, 500);
  }
}
