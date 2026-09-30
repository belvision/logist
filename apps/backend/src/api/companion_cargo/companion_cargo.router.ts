import { Hono } from 'hono';
import { buildRouteHandler, findCompanionCargosHandler } from './companion_cargo.controller';

export const companionCargoRouter = new Hono();

// Построение маршрута пользователя
companionCargoRouter.post('/build-route', buildRouteHandler);

// Поиск попутных грузов
companionCargoRouter.post('/companion-cargos', findCompanionCargosHandler);
