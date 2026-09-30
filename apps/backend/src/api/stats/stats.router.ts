import { Hono } from 'hono';
import { getStatsHandler } from './stats.controller';

const statsRouter = new Hono();

// GET /stats - Получить общую статистику платформы
statsRouter.get('/', getStatsHandler);

export { statsRouter };
