# Отладка баннера подтверждения email

## Дата: 28 октября 2025

## Проблема

Пользователи не видят баннер с предложением подтвердить email, хотя в базе данных у всех пользователей `email_verified_at` = `null`.

## ✅ РЕШЕНИЕ НАЙДЕНО

**Причина:** В endpoint `/api/auth/check-verification` происходила ошибка получения `userId` из контекста Hono.

- Middleware `authenticate` сохранял данные пользователя в `c.set('user', payload)`
- Handler пытался получить `c.get('userId')` - который был `undefined`
- Из-за этого API возвращал ошибку 401, и баннер не показывался

**Исправление:** Изменен способ получения userId в handlers:
```typescript
// Было:
const userId = c.get('userId');  // undefined

// Стало:
const user = c.get('user');
const userId = user?.id_user;    // правильное значение
```

## Анализ системы

### Структура проверки верификации email:

**Frontend (EmailVerificationBanner.tsx):**
1. При монтировании компонента вызывается `checkVerification()`
2. Делается запрос к `/api/auth/check-verification`
3. Ответ сохраняется в state `isVerified`
4. Баннер показывается только если `isVerified === false`

**Backend:**
1. Endpoint: `GET /api/auth/check-verification`
2. Вызывает `checkEmailVerification(userId)` в сервисе
3. Проверяет `email_verified_at !== null` в базе данных
4. Возвращает `{ verified: boolean }`

## Внесенные изменения для отладки

### 1. Добавлено логирование в `auth.controller.ts`

```typescript
export async function checkEmailVerificationHandler(c: any) {
  try {
    console.log('📧 [CHECK VERIFICATION] Handler called');
    const userId = c.get('userId');
    console.log('📧 [CHECK VERIFICATION] User ID:', userId);
    
    if (!userId) {
      console.log('📧 [CHECK VERIFICATION] No user ID, returning 401');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const result = await checkEmailVerification(userId);
    console.log('📧 [CHECK VERIFICATION] Result from service:', result);
    console.log('📧 [CHECK VERIFICATION] Returning:', { verified: result.verified }, 'Status:', result.status);
    
    return c.json({ verified: result.verified }, result.status);
  } catch (error) {
    console.error('📧 [CHECK VERIFICATION] Error:', error);
    return c.json({ error: 'Ошибка проверки статуса' }, 500);
  }
}
```

### 2. Добавлено логирование в `auth.service.ts`

```typescript
export async function checkEmailVerification(userId: string) {
  console.log('📧 [CHECK EMAIL SERVICE] Checking verification for user:', userId);
  const verified = await isEmailVerified(userId);
  console.log('📧 [CHECK EMAIL SERVICE] Is verified:', verified);
  return { ok: true as const, status: 200, verified };
}
```

### 3. Добавлено логирование в `auth.repository.ts`

```typescript
export const isEmailVerified = async (userId: string): Promise<boolean> => {
  console.log('📧 [REPOSITORY] Checking email_verified_at for user:', userId);
  const rows = await db
    .select({ email_verified_at: users.email_verified_at })
    .from(users)
    .where(eq(users.id_user, userId))
    .limit(1);
  
  console.log('📧 [REPOSITORY] Query result:', rows[0]);
  console.log('📧 [REPOSITORY] email_verified_at value:', rows[0]?.email_verified_at);
  const isVerified = rows[0]?.email_verified_at !== null;
  console.log('📧 [REPOSITORY] Is verified (email_verified_at !== null):', isVerified);
  
  return isVerified;
};
```

## Как проверить

### 1. Перезапустите backend:
```bash
cd apps/backend
npm run dev
```

### 2. Откройте консоль браузера (F12)

Во вкладке Console должны быть видны логи от `EmailVerificationBanner`:
- `📧 [EMAIL CHECK] Starting verification check...`
- `📧 [EMAIL CHECK] Token: ✅ Found` или `❌ Not found`
- `📧 [EMAIL CHECK] Response status: 200`
- `📧 [EMAIL CHECK] Response data: { verified: false }`
- `📧 [BANNER RENDER] Current state: { isVerified: false, isDismissed: false }`
- `📧 [BANNER RENDER] Showing banner (not verified)`

### 3. В терминале backend должны быть логи:
```
📧 [CHECK VERIFICATION] Handler called
📧 [CHECK VERIFICATION] User ID: 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0
📧 [CHECK EMAIL SERVICE] Checking verification for user: 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0
📧 [REPOSITORY] Checking email_verified_at for user: 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0
📧 [REPOSITORY] Query result: { email_verified_at: null }
📧 [REPOSITORY] email_verified_at value: null
📧 [REPOSITORY] Is verified (email_verified_at !== null): false
📧 [CHECK EMAIL SERVICE] Is verified: false
📧 [CHECK VERIFICATION] Result from service: { ok: true, status: 200, verified: false }
📧 [CHECK VERIFICATION] Returning: { verified: false } Status: 200
```

## Возможные проблемы

### Проблема 1: Баннер не показывается из-за ошибки запроса

**Симптомы:**
- В консоли браузера есть ошибка при запросе к `/api/auth/check-verification`
- Status code не 200

**Решение:**
- Проверить логи backend
- Убедиться, что токен авторизации передается корректно

### Проблема 2: Ответ от backend не парсится

**Симптомы:**
- В логах backend видно `verified: false`
- В консоли браузера ошибка парсинга JSON

**Решение:**
- Проверить формат ответа от backend
- Убедиться, что Content-Type: application/json

### Проблема 3: State не обновляется на frontend

**Симптомы:**
- В консоли браузера `isVerified` остается `null`
- Баннер не отрисовывается

**Решение:**
- Проверить, что `setIsVerified(data.verified)` вызывается
- Проверить, что `data.verified === false` (boolean, а не строка)

### Проблема 4: Баннер был закрыт пользователем

**Симптомы:**
- В консоли: `📧 [BANNER RENDER] Hiding banner (verified or dismissed)`
- `isDismissed === true`

**Решение:**
- Обновить страницу (Ctrl+Shift+R)
- State `isDismissed` сбрасывается при перезагрузке

## Следующие шаги

1. **Соберите логи:**
   - Откройте консоль браузера (F12)
   - Перезагрузите страницу профиля
   - Скопируйте все логи с префиксом `📧`

2. **Проверьте backend логи:**
   - Найдите логи с `[CHECK VERIFICATION]`
   - Убедитесь, что `verified: false` возвращается корректно

3. **Проверьте Network:**
   - Откройте вкладку Network в DevTools
   - Найдите запрос к `/api/auth/check-verification`
   - Посмотрите на Response

## Временное решение (для тестирования)

Если нужно принудительно показать баннер для отладки, можно временно изменить код в `EmailVerificationBanner.tsx`:

```typescript
// Временно закомментировать проверку
// if (isVerified === true || isDismissed) {
//   return null;
// }

// И всегда показывать баннер
if (true) {
  return (
    <div className="mb-4">
      <Alert>
        ...
      </Alert>
    </div>
  );
}
```

## Связанные файлы

- `apps/frontend/src/components/email-verification/EmailVerificationBanner.tsx`
- `apps/frontend/src/components/layout/AppLayout.tsx`
- `apps/backend/src/api/auth/auth.controller.ts`
- `apps/backend/src/api/auth/auth.service.ts`
- `apps/backend/src/api/auth/auth.repository.ts`

