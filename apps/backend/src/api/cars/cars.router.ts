import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createCarHandler, updateCarHandler, deleteCarHandler, toggleCarFlagsHandler, getCarTypesHandler, getLoadTypesHandler, listCompanyCarsHandler, getCarByIdHandler } from './cars.controller.ts';

export const carsRouter = new Hono();

// Добавление автомобиля
carsRouter.post('/', authenticate, createCarHandler);
// Редактирование автомобиля
carsRouter.patch('/:id', authenticate, updateCarHandler);
// Удаление автомобиля
carsRouter.delete('/:id', authenticate, deleteCarHandler);
// Переключатели subscription/search
carsRouter.patch('/:id/toggles', authenticate, toggleCarFlagsHandler);
// Список автомобилей по компании
carsRouter.get('/by-company', authenticate, listCompanyCarsHandler);

// Справочники
carsRouter.get('/types', authenticate, getCarTypesHandler);
carsRouter.get('/load-types', authenticate, getLoadTypesHandler);

// Получить автомобиль по ID
carsRouter.get('/:id', authenticate, getCarByIdHandler);

