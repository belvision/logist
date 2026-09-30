import { SupportRequestSchema, sanitizeSupportRequestDto } from './bitrix24.schema';
import { createSupportRequestService } from './bitrix24.service';

export async function createSupportRequestHandler(c: any) {
  const auth = c.get('user') as any;
  const userId: string | undefined = auth?.id || auth?.userId || auth?.sub;
  if (!userId) return c.json({ error: 'Требуется авторизация' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const parsed = SupportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ 
      error: 'Ошибка валидации', 
      details: parsed.error.flatten() 
    }, 400);
  }

  const dto = sanitizeSupportRequestDto(parsed.data);
  const res = await createSupportRequestService(dto);
  
  return c.json(res.ok ? { success: true, message: res.message } : { error: res.error }, res.status);
}
