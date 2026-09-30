import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createSupportRequestHandler } from './bitrix24.controller';

export const bitrix24Router = new Hono();

// Отправка запроса в поддержку
bitrix24Router.post('/support', authenticate, createSupportRequestHandler);
