import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { searchCarsPublicHandler } from './car_search_public.controller';

const carSearchPublicRouter = new Hono();

// Публичный поиск автомобилей (без авторизации)
carSearchPublicRouter.get('/search', searchCarsPublicHandler);

// Поиск автомобилей с авторизацией
carSearchPublicRouter.get('/search-auth', authenticate, searchCarsPublicHandler);

export { carSearchPublicRouter };
