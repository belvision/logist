import { Hono } from 'hono';
import { webhookHandler } from './webhook.controller';

export const webhookRouter = new Hono();

// Эндпоинт для приема входящих вебхуков от Bitrix24
webhookRouter.post('/', async (c) => {
  try {
    console.log('🔍 [WEBHOOK ROUTER] ===== INCOMING WEBHOOK REQUEST =====');
    console.log('🔍 [WEBHOOK ROUTER] Method:', c.req.method);
    console.log('🔍 [WEBHOOK ROUTER] URL:', c.req.url);
    console.log('🔍 [WEBHOOK ROUTER] Headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers), null, 2));
    
    // Сначала парсим данные от Bitrix24
    let body: any = {};
    const contentType = c.req.header('content-type') || '';
    console.log('🔍 [WEBHOOK ROUTER] Content-Type:', contentType);

    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}));
      console.log('🔍 [WEBHOOK ROUTER] Parsed JSON body:', JSON.stringify(body, null, 2));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await c.req.parseBody();
      console.log('🔍 [WEBHOOK ROUTER] Parsed form body:', JSON.stringify(body, null, 2));
    } else {
      console.log('❌ [WEBHOOK ROUTER] Unsupported content-type:', contentType);
      return c.json({ error: 'Неподдерживаемый Content-Type' }, 400);
    }

    // Извлекаем токен из URL (?token=...) - это основной способ для Bitrix24
    // Также проверяем заголовок x-webhook-token и тело запроса для совместимости
    const providedToken = c.req.query('token') || c.req.header('x-webhook-token') || body.token;
    const expectedToken = process.env.BITRIX24_WEBHOOK_TOKEN;
    
    console.log('🔍 [WEBHOOK ROUTER] Provided token (from query/header/body):', providedToken);
    console.log('🔍 [WEBHOOK ROUTER] Expected token:', expectedToken);
    console.log('🔍 [WEBHOOK ROUTER] Token from URL query:', c.req.query('token'));
    console.log('🔍 [WEBHOOK ROUTER] Token from header:', c.req.header('x-webhook-token'));
    console.log('🔍 [WEBHOOK ROUTER] Token from body:', body.token);
    console.log('🔍 [WEBHOOK ROUTER] Full URL:', c.req.url);
    console.log('🔍 [WEBHOOK ROUTER] URL search params:', new URL(c.req.url).searchParams.toString());

    if (!expectedToken) {
      console.log('❌ [WEBHOOK ROUTER] Missing BITRIX24_WEBHOOK_TOKEN in environment');
      return c.json({ error: 'Сервер не настроен: отсутствует BITRIX24_WEBHOOK_TOKEN' }, 500);
    }

    if (!providedToken || providedToken !== expectedToken) {
      console.log('❌ [WEBHOOK ROUTER] Invalid token. Provided:', providedToken, 'Expected:', expectedToken);
      console.log('❌ [WEBHOOK ROUTER] Token comparison failed. Check if token is correctly passed in URL');
      return c.json({ error: 'Недействительный токен' }, 401);
    }

    console.log('✅ [WEBHOOK ROUTER] Token validation passed, calling webhook handler');
    
    // Токен валиден, передаем данные в обработчик
    const result = await webhookHandler(c, body);
    
    console.log('🔍 [WEBHOOK ROUTER] Webhook handler response status:', result.status);
    console.log('🔍 [WEBHOOK ROUTER] ===== WEBHOOK PROCESSING COMPLETE =====');
    
    return result;
  } catch (error) {
    console.error('❌ [WEBHOOK ROUTER] Error parsing webhook data:', error);
    console.error('❌ [WEBHOOK ROUTER] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ error: 'Ошибка парсинга данных' }, 400);
  }
});
