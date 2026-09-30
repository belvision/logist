import { Hono } from 'hono';
import { webhookHandler } from './webhook.controller';

export const webhookRouter = new Hono();

// Эндпоинт для приема входящих вебхуков от Bitrix24
webhookRouter.post('/', async (c) => {
  const providedToken = c.req.header('x-webhook-token') || c.req.query('token');
  const expectedToken = process.env.BITRIX24_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return c.json({ error: 'Сервер не настроен: отсутствует BITRIX24_WEBHOOK_TOKEN' }, 500);
  }

  if (!providedToken || providedToken !== expectedToken) {
    return c.json({ error: 'Недействительный токен' }, 401);
  }

  return webhookHandler(c);
});
