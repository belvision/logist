import { UpdateUserProfileSchema } from './user.schema';
import { updateCurrentUserService } from './user.service';

export async function updateMeHandler(c: any) {
  console.log('🔵 [USER API] updateMeHandler вызван');
  
  const auth = c.get('user') as any;
  console.log('🔵 [USER API] auth объект:', JSON.stringify(auth, null, 2));
  
  const userId: string | undefined = auth?.id || auth?.userId || auth?.sub;
  console.log('🔵 [USER API] userId:', userId);
  
  if (!userId) {
    console.log('❌ [USER API] Требуется авторизация - userId не найден');
    return c.json({ message: 'Требуется авторизация' }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  console.log('🔵 [USER API] Полученные данные:', JSON.stringify(body, null, 2));
  
  const parsed = UpdateUserProfileSchema.safeParse(body);
  if (!parsed.success) {
    console.log('❌ [USER API] Ошибка валидации:', parsed.error.flatten());
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }

  console.log('🔵 [USER API] Валидация прошла успешно, данные:', JSON.stringify(parsed.data, null, 2));

  const res = await updateCurrentUserService(userId, parsed.data);
  console.log('🔵 [USER API] Результат сервиса:', JSON.stringify(res, null, 2));
  
  return c.json(res.ok ? { ok: true, user: res.user } : { error: res.error }, res.status);
}


