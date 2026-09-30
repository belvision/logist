import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createTicketHandler,
  getTicketHandler,
  getTicketsHandler,
  addMessageHandler,
  updateTicketStatusHandler,
} from './support.controller';

export const supportRouter = new Hono();

// Создать новый тикет
supportRouter.post('/', authenticate, createTicketHandler);

// Получить тикеты пользователя с фильтрацией
supportRouter.get('/', authenticate, getTicketsHandler);

// Получить тикет по ID
supportRouter.get('/:id', authenticate, getTicketHandler);

// Добавить сообщение в тикет
supportRouter.post('/:id/messages', authenticate, addMessageHandler);

// Обновить статус тикета
supportRouter.patch('/:id/status', authenticate, updateTicketStatusHandler);
