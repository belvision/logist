# Быстрое исправление ошибки reCAPTCHA

## 🚨 Проблема
Ошибка "Проверка безопасности не пройдена" при входе в систему.

## ⚡ Быстрое решение (временно)

### Вариант 1: Отключить reCAPTCHA на frontend

Добавьте в файл `.env.local` в папке `apps/frontend/`:
```bash
NEXT_PUBLIC_DISABLE_RECAPTCHA=true
```

### Вариант 2: Отключить reCAPTCHA на backend

Добавьте в файл `.env` в папке `apps/backend/`:
```bash
NODE_ENV=development
```

Или создайте файл `.env` с содержимым:
```bash
NODE_ENV=development
PORT=5555
```

## 🔧 Постоянное решение

### 1. Получите SECRET KEY для reCAPTCHA:

1. Перейдите в [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Найдите ваш сайт `logistgo.pro`
3. Скопируйте **SECRET KEY** (не SITE KEY!)

### 2. Создайте файл `.env` в `apps/backend/`:

```bash
NODE_ENV=production
PORT=5555
RECAPTCHA_SITE_KEY=REDACTED_SECRET
RECAPTCHA_SECRET_KEY=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_ЗДЕСЬ
RECAPTCHA_MIN_SCORE=0.3
```

### 3. Перезапустите backend:

```bash
cd apps/backend
npm run start
```

## 🎯 Рекомендации

1. **Для тестирования**: Используйте Вариант 1 (отключить на frontend)
2. **Для продакшена**: Настройте SECRET KEY (Вариант 2)
3. **Безопасность**: reCAPTCHA защищает от ботов, не отключайте навсегда

## 📝 Проверка

После исправления:
1. Попробуйте войти в систему
2. Проверьте логи backend на ошибки
3. Убедитесь, что reCAPTCHA работает корректно
