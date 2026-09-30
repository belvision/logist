# Настройка переменных окружения для Backend

## 🚨 Проблема
Ошибка "Проверка безопасности не пройдена" возникает из-за отсутствия переменных окружения для reCAPTCHA на backend.

## 🔧 Решение

### 1. Создайте файл `.env` в папке `apps/backend/`:

```bash
# Backend Environment Variables для продакшена

# Основные настройки
NODE_ENV=production
PORT=5555
DEBUG=false

# API URLs
API_URL=https://logistgo.pro
FRONTEND_BASE_URL=https://logistgo.pro

# CORS
CORS_ORIGIN=https://logistgo.pro,https://www.logistgo.pro

# Database (замените на ваши реальные данные)
DATABASE_URL=postgresql://username:password@localhost:5432/logistic_pro

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-different-from-jwt-secret
JWT_REFRESH_EXPIRES_IN=30d

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=REDACTED_SECRET
RECAPTCHA_SECRET_KEY=REDACTED_SECRET
RECAPTCHA_MIN_SCORE=0.3
RECAPTCHA_TIMEOUT=5000

# WebSocket (опционально)
DISABLE_WEBSOCKET=false
```

### 2. Получите SECRET KEY для reCAPTCHA:

1. Перейдите в [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Найдите ваш сайт `logistgo.pro`
3. Скопируйте **SECRET KEY** (не SITE KEY!)
4. Замените `6Ld8qd4rAAAAA_YOUR_SECRET_KEY_HERE` на реальный SECRET KEY

### 3. Настройте базу данных:

Замените строку подключения к базе данных на реальную:
```bash
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/logistic_pro
```

### 4. Сгенерируйте JWT секреты:

```bash
# Генерируйте случайные строки для JWT секретов
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Перезапустите backend:

```bash
cd apps/backend
npm run start
```

## 🔍 Проверка

После настройки проверьте:

1. **API доступен**: `curl https://logistgo.pro/api/auth/recaptcha-config`
2. **reCAPTCHA работает**: Попробуйте войти в систему
3. **Логи backend**: Проверьте, что нет ошибок reCAPTCHA

## ⚠️ Важные моменты:

1. **SECRET KEY** должен быть скрыт и не попадать в git
2. **JWT_SECRET** должен быть очень длинным и случайным
3. **RECAPTCHA_MIN_SCORE=0.3** - более мягкая проверка (по умолчанию 0.5)
4. **NODE_ENV=production** - обязательно для продакшена

## 🚀 Альтернативное решение (временно):

Если нужно быстро отключить reCAPTCHA, добавьте в `.env`:
```bash
NEXT_PUBLIC_DISABLE_RECAPTCHA=true
```

Но это снижает безопасность!
