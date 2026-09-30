# Email Verification System

## 📧 Описание

Система подтверждения email адреса при регистрации. После регистрации пользователь получает письмо со ссылкой для подтверждения email. До подтверждения в личном кабинете отображается предупреждение.

## 🎯 Функционал

### Backend

1. **Новые поля в таблице `users`:**
   - `email_verification_token` (text, nullable) - JWT токен для подтверждения
   - `email_verified_at` (timestamp, nullable) - дата подтверждения email

2. **API Endpoints:**
   - `GET /api/auth/verify-email?token=XXX` - подтверждение email по токену
   - `POST /api/auth/resend-verification` - повторная отправка письма (требует авторизации)
   - `GET /api/auth/check-verification` - проверка статуса подтверждения (требует авторизации)

3. **JWT Tokens:**
   - `signEmailVerificationToken()` - создание токена (срок действия: 7 дней)
   - `verifyEmailVerificationToken()` - проверка токена

4. **Email Отправка:**
   - При регистрации автоматически генерируется токен
   - Отправляется письмо с ссылкой вида: `{FRONTEND_URL}/verify-email?token=XXX`
   - Если SMTP не настроен, ссылка выводится в консоль

### Frontend

1. **Страница подтверждения:** `/verify-email`
   - Принимает токен из query параметра
   - Автоматически вызывает API для подтверждения
   - Показывает статус (loading/success/error)
   - При успехе перенаправляет на `/login` через 3 секунды

2. **Баннер в личном кабинете:** `EmailVerificationBanner`
   - Отображается только для неподтвержденных пользователей
   - Показывает предупреждение с кнопкой повторной отправки
   - Можно закрыть (скрывается до следующей сессии)
   - Автоматически скрывается после подтверждения

## 📦 Установка

### 1. Применить миграцию базы данных

```bash
cd apps/backend
# Применить миграцию SQL
psql -d your_database -f drizzle/0003_add_email_verification.sql
```

Или вручную выполнить в PostgreSQL:

```sql
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;
```

### 2. Настроить SMTP (опционально)

В `.env` файле бэкенда:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="LogistGo.pro <noreply@logistgo.pro>"
```

Если SMTP не настроен, ссылки для подтверждения будут выводиться в консоль.

### 3. Перезапустить серверы

```bash
# Backend
cd apps/backend
npm run dev

# Frontend
cd apps/frontend
npm run dev
```

## 🔄 Процесс работы

### Регистрация нового пользователя

1. Пользователь заполняет форму регистрации
2. Backend создает учетную запись
3. Генерируется JWT токен для подтверждения email
4. Токен сохраняется в `users.email_verification_token`
5. Отправляется письмо на указанный email
6. Пользователь получает доступ к личному кабинету

### Подтверждение email

1. Пользователь переходит по ссылке из письма
2. Открывается страница `/verify-email?token=XXX`
3. Frontend вызывает `GET /api/auth/verify-email?token=XXX`
4. Backend проверяет токен (JWT + БД)
5. При успехе:
   - `email_verification_token` = NULL
   - `email_verified_at` = текущая дата
6. Пользователь перенаправляется на страницу входа

### Работа в личном кабинете

1. При входе в личный кабинет вызывается `GET /api/auth/check-verification`
2. Если email не подтвержден, показывается баннер с предупреждением
3. Пользователь может:
   - Закрыть баннер (скроется до следующей сессии)
   - Нажать "Отправить письмо повторно" → `POST /api/auth/resend-verification`

## 🔒 Безопасность

- JWT токены имеют срок действия 7 дней
- Токены подписываются тем же секретом, что и основные JWT
- После использования токен удаляется из БД
- Повторное использование токена невозможно

## 📝 Примеры использования

### Проверка статуса подтверждения

```typescript
// Frontend
const response = await fetch(`${API_BASE}/api/auth/check-verification`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const data = await response.json();
console.log(data.verified); // true/false
```

### Повторная отправка письма

```typescript
// Frontend
const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const data = await response.json();
console.log(data.message); // "Письмо отправлено повторно"
```

## 🎨 UI Компоненты

### EmailVerificationBanner

Расположение: `apps/frontend/src/components/email-verification/EmailVerificationBanner.tsx`

Функции:
- Автоматическая проверка статуса при загрузке
- Кнопка повторной отправки с индикацией загрузки
- Отображение сообщений об успехе/ошибке
- Возможность закрытия баннера

## 🔍 Мониторинг

### Backend логи

```
✅ Email verification sent to: user@example.com
📧 SMTP not configured. Verification link: http://localhost:3000/verify-email?token=XXX
```

### Проверка в БД

```sql
-- Пользователи без подтверждения
SELECT id_user, email, created_at 
FROM users 
WHERE email_verified_at IS NULL;

-- Пользователи с подтверждением
SELECT id_user, email, email_verified_at 
FROM users 
WHERE email_verified_at IS NOT NULL;
```

## 🚀 Будущие улучшения

- [ ] Ограничение доступа к функциям для неподтвержденных пользователей
- [ ] Напоминания о подтверждении email через X дней
- [ ] Автоматическое удаление неподтвержденных аккаунтов через 30 дней
- [ ] Метрики и аналитика подтверждений

