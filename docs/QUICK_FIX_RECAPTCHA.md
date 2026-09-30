# 🚨 БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ 502

## Проблема
На продакшене все еще появляется ошибка:
```
GET https://logistgo.pro/api/auth/recaptcha-config 502 (Bad Gateway)
```

## НЕМЕДЛЕННОЕ РЕШЕНИЕ

### Вариант 1: Отключить reCAPTCHA через переменную окружения

Добавьте в `.env.production`:
```bash
NEXT_PUBLIC_DISABLE_RECAPTCHA=true
```

### Вариант 2: Изменить код напрямую (если нет доступа к переменным окружения)

В файле `apps/frontend/src/app/layout.tsx` замените:

```typescript
// БЫЛО:
{process.env.NODE_ENV === 'production' ? (
  <RecaptchaProviderFallback>
    {children}
    <SessionManager />
  </RecaptchaProviderFallback>
) : (
  <RecaptchaProvider>
    {children}
    <SessionManager />
  </RecaptchaProvider>
)}

// СТАЛО:
<RecaptchaProviderFallback>
  {children}
  <SessionManager />
</RecaptchaProviderFallback>
```

### Вариант 3: Временно закомментировать RecaptchaProvider

В файле `apps/frontend/src/app/layout.tsx`:

```typescript
// Закомментировать импорты:
// import { RecaptchaProvider } from '@/components/auth/RecaptchaProvider';
// import { RecaptchaProviderFallback } from '@/components/auth/RecaptchaProviderFallback';

// И заменить провайдеры на:
<ThemeProvider>
  <AuthProvider>
    <NotificationProvider>
      {children}
      <SessionManager />
    </NotificationProvider>
  </AuthProvider>
</ThemeProvider>
```

## После исправления

1. Пересоберите проект: `npm run build`
2. Разверните на продакшене
3. Ошибка 502 исчезнет

## Восстановление reCAPTCHA

После настройки API:
1. Уберите `NEXT_PUBLIC_DISABLE_RECAPTCHA=true`
2. Восстановите оригинальный код в layout.tsx
3. Пересоберите и разверните
