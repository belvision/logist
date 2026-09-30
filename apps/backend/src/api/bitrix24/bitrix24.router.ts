import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createSupportRequestHandler, getOpenTicketsHandler, getAllTicketsHandler, addCommentHandler, getTicketByIdHandler, closeTicketHandler, markTicketAsViewedHandler } from './bitrix24.controller';
import { webhookRouter } from './webhook.router';

export const bitrix24Router = new Hono();

// Отправка запроса в поддержку
bitrix24Router.post('/support', authenticate, createSupportRequestHandler);

// Получение открытых тикетов пользователя
bitrix24Router.get('/support/open', authenticate, getOpenTicketsHandler);

// Получение всех тикетов пользователя (архив)
bitrix24Router.get('/support/all', authenticate, getAllTicketsHandler);

// Добавление комментария к существующему тикету
bitrix24Router.post('/support/comment', authenticate, addCommentHandler);

// Получение конкретного тикета по ID
bitrix24Router.get('/support/:id', authenticate, getTicketByIdHandler);

// Закрытие тикета
bitrix24Router.post('/support/close', authenticate, closeTicketHandler);

// Отметить тикет как просмотренный
bitrix24Router.post('/support/mark-viewed', authenticate, markTicketAsViewedHandler);

// Подключение вебхук роутера
bitrix24Router.route('/webhook', webhookRouter);

