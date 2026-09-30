import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createCargoHandler,
  updateCargoHandler,
  deleteCargoHandler,
  getCargosByCompanyHandler,
} from './cargo.controller';

/**
 * Роутер для операций с грузами.
 *
 * Пути:
 *  - POST    /api/cargo              — создать новый груз
 *  - PATCH   /api/cargo/:id         — обновить груз
 *  - DELETE  /api/cargo/:id         — удалить груз
 *  - GET     /api/cargo/by-company/:companyId — получить все грузы компании
 */
export const cargoRouter = new Hono();

// Создание груза
cargoRouter.post('/', authenticate, createCargoHandler);

// Обновление груза
cargoRouter.patch('/:id', authenticate, updateCargoHandler);

// Удаление груза
cargoRouter.delete('/:id', authenticate, deleteCargoHandler);

// Получение списка грузов компании
cargoRouter.get('/by-company/:companyId', authenticate, getCargosByCompanyHandler);
