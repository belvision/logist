import { Hono } from 'hono';
import { searchCarsPublicHandler } from './car_search_public.controller';

const carSearchPublicRouter = new Hono();

// Публичный поиск автомобилей (без авторизации)
carSearchPublicRouter.get('/search', searchCarsPublicHandler);

export { carSearchPublicRouter };
