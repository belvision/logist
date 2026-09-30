import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { buildRouteHandler } from './osrm.controller';

export const osrmRouter = new Hono();

// Построение маршрута через OSRM - публичный эндпоинт
osrmRouter.post('/route', buildRouteHandler);

// Построение маршрута через OSRM - с авторизацией
osrmRouter.post('/route-auth', authenticate, buildRouteHandler);
