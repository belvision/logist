import { Hono } from 'hono';
import { buildRouteHandler, findCompanionCargosHandler, getSavedRoutesHandler, saveRouteHandler, deleteSavedRouteHandler } from './companion_cargo.controller';
import { authenticate } from '../middleware/auth';

/**
 * Роутер для поиска попутных грузов
 * 
 * Документация по логике обработки: docs/COMPANION_CARGO_LOGIC.md

 */
export const companionCargoRouter = new Hono();

// Построение маршрута пользователя
companionCargoRouter.post('/build-route', buildRouteHandler);

// Поиск попутных грузов
companionCargoRouter.post('/companion-cargos', findCompanionCargosHandler);

// Сохранённые маршруты (требуют авторизации)
companionCargoRouter.get('/saved-routes', authenticate, getSavedRoutesHandler);
companionCargoRouter.post('/saved-routes', authenticate, saveRouteHandler);
companionCargoRouter.delete('/saved-routes/:id', authenticate, deleteSavedRouteHandler);
