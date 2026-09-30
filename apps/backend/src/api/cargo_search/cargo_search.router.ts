import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { searchCargoForCarHandler } from './cargo_search.controller';

export const cargoSearchRouter = new Hono();

/* Поиск грузов для автомобиля без фильтра по типу загрузки, типу автомобиля, города,
 с датой сегодня и позже */
cargoSearchRouter.get('/:id_cars', authenticate, searchCargoForCarHandler);
