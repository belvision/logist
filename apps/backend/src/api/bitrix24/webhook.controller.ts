import { processWebhookFromBitrix24 } from './webhook.service';
import { WebhookSchema, sanitizeWebhookDto } from './webhook.schema';
import { WebhookResponse } from './webhook.types';

export async function webhookHandler(c: any): Promise<Response> {
  try {
    console.log('🔍 [WEBHOOK CONTROLLER] ===== WEBHOOK HANDLER CALLED =====');
    
    let body: any = {};

    // Проверка Content-Type
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await c.req.parseBody(); // 👈 Hono парсит форму
    } else {
      console.warn('⚠️ [WEBHOOK CONTROLLER] Unsupported content-type:', contentType);
    }

    console.log('🔍 [WEBHOOK CONTROLLER] Webhook body:', body);
    
    // Валидация данных вебхука
    const validationResult = WebhookSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [WEBHOOK CONTROLLER] Validation failed:', validationResult.error);
      return c.json({ 
        error: 'Ошибка валидации',
        details: validationResult.error.flatten()
      }, 400);
    }
    
    const dto = sanitizeWebhookDto(validationResult.data);
    console.log('🔍 [WEBHOOK CONTROLLER] Sanitized DTO:', dto);
    
    // Обрабатываем вебхук
    const result = await processWebhookFromBitrix24(dto);
    
    if (result.success) {
      console.log('✅ [WEBHOOK CONTROLLER] Webhook processed successfully');
      return c.json({
        success: true,
        message: 'Вебхук обработан успешно',
        ticketId: result.ticketId,
        messageAdded: result.messageAdded
      });
    } else {
      console.error('❌ [WEBHOOK CONTROLLER] Failed to process webhook:', result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK CONTROLLER] Error processing webhook:', error);
    return c.json({ error: 'Ошибка обработки вебхука' }, 500);
  }
}
