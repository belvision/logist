import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { 
  createRouteHandler, 
  updateRouteHandler, 
  deleteRouteHandler,
  listCompanyRoutesHandler
} from './routes.controller.ts';

export const routesRouter = new Hono();

// Добавление маршрута
routesRouter.post('/', authenticate, createRouteHandler);
// Редактирование маршрута
routesRouter.patch('/:id_routes', authenticate, updateRouteHandler);
// Удаление маршрута
routesRouter.delete('/:id_routes', authenticate, deleteRouteHandler);
// Список маршрутов компании
routesRouter.get('/by-company', authenticate, listCompanyRoutesHandler);
