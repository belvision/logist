import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createCargoHandler,
  updateCargoHandler,
  deleteCargoHandler,
  getCargosByCompanyHandler,
  getCargoByIdHandler,
} from './cargo.controller';

/**
 * Роутер для операций с грузами.
 *
 * Пути:
 *  - POST    /api/cargo              — создать новый груз
 *  - GET     /api/cargo/:id          — получить груз по ID
 *  - PATCH   /api/cargo/:id         — обновить груз
 *  - DELETE  /api/cargo/:id         — удалить груз
 *  - GET     /api/cargo/by-company/:companyId — получить все грузы компании
 */
export const cargoRouter = new Hono();

// Создание груза
cargoRouter.post('/', authenticate, createCargoHandler);

// Получение списка грузов компании (должен быть перед /:id, чтобы не конфликтовал)
cargoRouter.get('/by-company/:companyId', authenticate, getCargosByCompanyHandler);

// Получение груза по ID
cargoRouter.get('/:id', authenticate, getCargoByIdHandler);

// Обновление груза
cargoRouter.patch('/:id', authenticate, updateCargoHandler);

// Удаление груза
cargoRouter.delete('/:id', authenticate, deleteCargoHandler);

// Получение списка грузов компании
cargoRouter.get('/by-company/:companyId', authenticate, getCargosByCompanyHandler);
