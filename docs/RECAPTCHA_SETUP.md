# Настройка reCAPTCHA

## Автоматическая настройка по окружению

Система автоматически определяет окружение и настраивает reCAPTCHA:

- **Локальная разработка**: reCAPTCHA **отключена** автоматически
- **Продакшен**: reCAPTCHA **включена** (при наличии ключей)

## Локальная разработка

### Автоматическое отключение
В локальной разработке (`NODE_ENV !== 'production'`) reCAPTCHA автоматически отключается. Никаких дополнительных настроек не требуется.

### Переменные окружения (опционально)
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:5555
```

## Продакшен

### Обязательные переменные окружения

#### Backend (.env)
```bash
NODE_ENV=production
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_TIMEOUT=5000
```

#### Frontend (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
```

### Получение ключей reCAPTCHA

1. Перейдите на [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Создайте новый сайт:
   - **Тип**: reCAPTCHA v3
   - **Домены**: `logistgo.pro`
3. Скопируйте:
   - **Site Key** → `RECAPTCHA_SITE_KEY`
   - **Secret Key** → `RECAPTCHA_SECRET_KEY`

### Опциональные переменные

#### Принудительное отключение reCAPTCHA в продакшене
```bash
NEXT_PUBLIC_DISABLE_RECAPTCHA=true
```

## Проверка работы

### Локальная разработка
```bash
# Запуск проекта
npm run dev

# В консоли браузера должно появиться:
# [RECAPTCHA] Disabled in development mode

# В консоли сервера должно появиться:
# [RECAPTCHA] Skipping verification in development mode
```

### Продакшен
```bash
# Проверка конфигурации
curl https://logistgo.pro/api/auth/recaptcha-config

# Ожидаемый ответ:
{
  "enabled": true,
  "siteKey": "your_site_key",
  "version": "v3",
  "minScore": 0.5
}
```

## Текущий статус
- ✅ reCAPTCHA автоматически отключена в локальной разработке
- ✅ reCAPTCHA автоматически включена в продакшене (при наличии ключей)
- ✅ Приложение работает без ошибок в консоли
- ✅ Удобная разработка без необходимости настройки reCAPTCHA локально
