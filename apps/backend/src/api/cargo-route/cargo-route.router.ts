import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { buildCargoRouteHandler } from './cargo-route.controller';

const cargoRouteRouter = new Hono();

// Все роуты требуют авторизации
cargoRouteRouter.use('*', authenticate);

// Построение маршрута для груза
cargoRouteRouter.post('/build', buildCargoRouteHandler);

export { cargoRouteRouter };
