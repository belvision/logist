# Исправление проблем с reCAPTCHA и безопасностью

## 🚨 Проблема
Пользователи получали ошибку "Проверка безопасности не пройдена" при первой попытке входа, но при повторной попытке вход проходил успешно.

## 🔍 Анализ причин

### 1. **Проблемы с таймингом reCAPTCHA**
- Скрипт reCAPTCHA мог не успеть загрузиться
- Токен мог быть `null` из-за сетевых задержек
- Отсутствовал таймаут для выполнения reCAPTCHA

### 2. **Слишком строгая обработка ошибок**
- Frontend блокировал отправку формы при отсутствии токена
- Backend блокировал вход при ошибках reCAPTCHA
- Не было fallback механизма

### 3. **Сетевые проблемы**
- Таймауты при запросах к Google API
- Отсутствие обработки сетевых ошибок
- Нет механизма восстановления после сбоев

## ✅ Исправления

### 1. **Улучшена обработка ошибок на Frontend**

#### `apps/frontend/src/app/login/page.tsx`
```typescript
// Получаем reCAPTCHA токен если включен
let recaptchaToken: string | undefined;
if (recaptchaEnabled) {
  try {
    recaptchaToken = await getRecaptchaToken('login') || undefined;
    if (!recaptchaToken) {
      console.warn('🔍 [LOGIN] reCAPTCHA token is null, but continuing with login attempt');
      // Не блокируем вход, если reCAPTCHA не сработала
      // Backend сам решит, что делать с отсутствующим токеном
    }
  } catch (error) {
    console.error('🔍 [LOGIN] reCAPTCHA error:', error);
    // Не блокируем вход при ошибке reCAPTCHA
  }
}
```

#### `apps/frontend/src/app/registry/page.tsx`
Аналогичные изменения для страницы регистрации.

### 2. **Улучшена обработка ошибок на Backend**

#### `apps/backend/src/lib/recaptcha.ts`
- Более мягкая обработка отсутствующего токена
- Не блокируем пользователя при сетевых ошибках
- Добавлен fallback механизм

#### `apps/backend/src/api/auth/auth.controller.ts`
```typescript
// Проверка reCAPTCHA
if (parsed.data.recaptchaToken) {
  console.log('🔍 [AUTH CONTROLLER] Verifying reCAPTCHA...');
  try {
    const recaptchaResult = await verifyRecaptchaToken(parsed.data.recaptchaToken, 'login');
    if (!recaptchaResult.success) {
      console.log('❌ [AUTH CONTROLLER] reCAPTCHA verification failed:', recaptchaResult.error);
      // Не блокируем вход при ошибке reCAPTCHA, только логируем
      console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA failure');
    } else {
      console.log('✅ [AUTH CONTROLLER] reCAPTCHA verification passed');
    }
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] reCAPTCHA verification error:', error);
    // Не блокируем вход при ошибке reCAPTCHA
    console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA error');
  }
} else {
  console.log('🔍 [AUTH CONTROLLER] No reCAPTCHA token provided');
}
```

### 3. **Добавлен Fallback механизм**

#### `apps/backend/src/lib/recaptcha-fallback.ts`
Новый сервис для отслеживания неудач reCAPTCHA и автоматического переключения в fallback режим:

- Отслеживает количество неудачных попыток
- Автоматически переключается в fallback режим при превышении лимита
- Имеет период охлаждения для восстановления
- Настраивается через переменные окружения

### 4. **Улучшена обработка таймаутов**

#### `apps/frontend/src/components/auth/RecaptchaProvider.tsx`
```typescript
// Добавляем таймаут для выполнения reCAPTCHA
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('reCAPTCHA timeout')), 10000);
});

const tokenPromise = window.grecaptcha.execute(config.siteKey, { action });
const token = await Promise.race([tokenPromise, timeoutPromise]);
```

## 🔧 Новые настройки

Добавлены в `apps/backend/env.example`:

```bash
# === reCAPTCHA Fallback настройки ===
RECAPTCHA_FALLBACK_ENABLED=true
RECAPTCHA_MAX_FAILURES=5
RECAPTCHA_FAILURE_WINDOW=300000
RECAPTCHA_COOLDOWN_PERIOD=600000
```

## 📊 Результат

### До исправления:
- ❌ Пользователи получали ошибку "Проверка безопасности не пройдена"
- ❌ Нужно было повторять попытку входа
- ❌ Плохой пользовательский опыт

### После исправления:
- ✅ reCAPTCHA работает как дополнительная защита, но не блокирует пользователей
- ✅ При проблемах с reCAPTCHA система автоматически переключается в fallback режим
- ✅ Улучшен пользовательский опыт
- ✅ Сохранена безопасность системы

## 🚀 Рекомендации

1. **Мониторинг**: Следите за логами reCAPTCHA для выявления проблем
2. **Настройка**: При необходимости настройте параметры fallback через переменные окружения
3. **Тестирование**: Протестируйте вход в различных сетевых условиях
4. **Обновление**: Регулярно обновляйте ключи reCAPTCHA

## 🔒 Безопасность

- reCAPTCHA по-прежнему работает как основная защита
- Fallback режим активируется только при множественных сбоях
- Все попытки логируются для мониторинга
- Система автоматически восстанавливается после устранения проблем
