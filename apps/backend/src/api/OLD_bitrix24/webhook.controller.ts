import { processWebhookFromBitrix24 } from './webhook.service';
import { WebhookSchema, sanitizeWebhookDto } from './webhook.schema';
import { WebhookResponse } from './webhook.types';

export async function webhookHandler(c: any, body?: any): Promise<Response> {
  try {
    
    // Если body не передан, парсим данные (для обратной совместимости)
    if (!body) {
      const contentType = c.req.header('content-type') || '';

      if (contentType.includes('application/json')) {
        body = await c.req.json().catch(() => ({}));
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        body = await c.req.parseBody();
      } else {
        console.warn('⚠️ [WEBHOOK CONTROLLER] Unsupported content-type:', contentType);
        body = {};
      }
    }

    // Валидация данных вебхука
    const validationResult = WebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ 
        error: 'Ошибка валидации',
        details: validationResult.error.flatten()
      }, 400);
    }
    
    const dto = sanitizeWebhookDto(validationResult.data);
    
    // Обрабатываем вебхук
    const result = await processWebhookFromBitrix24(dto);
    
    if (result.success) {
      const responsePayload = {
        success: true,
        message: 'Вебхук обработан успешно',
        ticketId: result.ticketId,
        messageAdded: result.messageAdded
      };
      return c.json(responsePayload);
    } else {
      console.error('❌ [WEBHOOK CONTROLLER] Failed to process webhook:', result.error);
      const responsePayload = { error: result.error };
      return c.json(responsePayload, 500);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK CONTROLLER] Error processing webhook:', error);
    return c.json({ error: 'Ошибка обработки вебхука' }, 500);
  }
}
