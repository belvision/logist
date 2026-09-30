import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createCarHandler, updateCarHandler, deleteCarHandler, toggleCarFlagsHandler, getCarTypesHandler, getLoadTypesHandler, listCompanyCarsHandler, getCarByIdHandler, uploadCarImagesHandler, deleteCarImageHandler, addDriverToCarHandler, removeDriverFromCarHandler, getCarDriversHandler, getCompanyDriversHandler } from './cars.controller.ts';

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

// Загрузка изображений для автомобиля
carsRouter.post('/:id/images', authenticate, uploadCarImagesHandler);
// Удаление изображения автомобиля
carsRouter.delete('/:id/images', authenticate, deleteCarImageHandler);

// Справочники
carsRouter.get('/types', authenticate, getCarTypesHandler);
carsRouter.get('/load-types', authenticate, getLoadTypesHandler);

// Получить автомобиль по ID
carsRouter.get('/:id', authenticate, getCarByIdHandler);

// Управление водителями автомобиля
carsRouter.post('/:id/drivers', authenticate, addDriverToCarHandler);
carsRouter.delete('/:id/drivers', authenticate, removeDriverFromCarHandler);
carsRouter.get('/:id/drivers', authenticate, getCarDriversHandler);

// Получить список водителей компании
carsRouter.get('/drivers/by-company', authenticate, getCompanyDriversHandler);

