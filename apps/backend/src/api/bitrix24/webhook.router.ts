import { Hono } from 'hono';
import { webhookHandler } from './webhook.controller';

export const webhookRouter = new Hono();

// Эндпоинт для приема входящих вебхуков от Bitrix24
webhookRouter.post('/', async (c) => {
  try {
    
    // Сначала парсим данные от Bitrix24
    let body: any = {};
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await c.req.parseBody();
    } else {
      return c.json({ error: 'Неподдерживаемый Content-Type' }, 400);
    }

    // Извлекаем токен из URL (?token=...) - это основной способ для Bitrix24
    // Также проверяем заголовок x-webhook-token и тело запроса для совместимости
    const providedToken = c.req.query('token') || c.req.header('x-webhook-token') || body.token;
    const expectedToken = process.env.BITRIX24_WEBHOOK_TOKEN;
    
    if (!expectedToken) {
      return c.json({ error: 'Сервер не настроен: отсутствует BITRIX24_WEBHOOK_TOKEN' }, 500);
    }

    if (!providedToken || providedToken !== expectedToken) {
      return c.json({ error: 'Недействительный токен' }, 401);
    }

    // Токен валиден, передаем данные в обработчик

    
    return await webhookHandler(c, body);
  } catch (error) {
    console.error('❌ [WEBHOOK ROUTER] Error parsing webhook data:', error);
    console.error('❌ [WEBHOOK ROUTER] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ error: 'Ошибка парсинга данных' }, 400);
  }
});
