import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { searchCarsForCargoHandler } from './car_search.controller';

// Роутер для поиска автомобилей по грузу.
export const carSearchRouter = new Hono();

/*
 * Поиск автомобилей для указанного груза.
 * Передаётся идентификатор груза как часть пути (/api/car-search/:id_cargo) и опциональный
 * параметр radius (в километрах) как query-параметр. Роутер защищён аутентификацией.
 */
carSearchRouter.get('/:id_cargo', authenticate, searchCarsForCargoHandler);