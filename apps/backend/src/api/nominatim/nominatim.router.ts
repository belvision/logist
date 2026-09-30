import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { searchPlacesHandler } from './nominatim.controller';

export const nominatimRouter = new Hono();

// Поиск населённых пунктов (подсказки) - публичный эндпоинт
nominatimRouter.get('/places/search', searchPlacesHandler);

// Поиск населённых пунктов (подсказки) - с авторизацией
nominatimRouter.get('/places/search-auth', authenticate, searchPlacesHandler);