import { Hono } from 'hono';
import { buildRouteHandler } from './osrm.controller';

export const osrmRouter = new Hono();

// Построение маршрута через OSRM
osrmRouter.post('/route', buildRouteHandler);
