# Исправление проблемы с API конфигурацией на продакшене

## 🚨 Проблема
Страница `/notifications` возвращает 404 ошибку на продакшене из-за неправильной конфигурации API endpoints.

## 🔍 Причина
На продакшене фронтенд пытается обратиться к API по адресу `http://localhost:5555` вместо `https://logistgo.pro`, потому что:

1. **Неправильный fallback URL**: В `config.ts` был fallback на `localhost:5555`
2. **Отсутствие переменных окружения**: На продакшене не установлены `AUTH_API_BASE_URL` или `NEXT_PUBLIC_API_BASE_URL`

## ✅ Решение

### 1. Исправлена конфигурация API
**Файл:** `apps/frontend/src/lib/config.ts`

**Было:**
```typescript
return process.env["AUTH_API_BASE_URL"] ||
       process.env["NEXT_PUBLIC_API_BASE_URL"] ||
       (typeof window !== 'undefined' ? 'http://localhost:5555' : 'http://0.0.0.0:5555');
```

**Стало:**
```typescript
return process.env["AUTH_API_BASE_URL"] ||
       process.env["NEXT_PUBLIC_API_BASE_URL"] ||
       'https://logistgo.pro';
```

### 2. Настройка переменных окружения на продакшене

#### Вариант A: Установить переменные окружения (рекомендуется)

Создайте файл `.env.local` в папке фронтенда на продакшене:

```bash
# Frontend Environment Variables для продакшена
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
NEXT_PUBLIC_JWT_COOKIE_NAME=lg_jwt
NEXT_PUBLIC_DISABLE_RECAPTCHA=false
NEXT_PUBLIC_DISABLE_WEBSOCKET=false
```

#### Вариант B: Использовать дефолтный URL (уже исправлено)

Теперь если переменные окружения не установлены, будет использоваться `https://logistgo.pro` по умолчанию.

## 🚀 Инструкции по развертыванию

### 1. Обновите код на продакшене

```bash
# На продакшене
cd /path/to/frontend
git pull origin socket  # или main, в зависимости от ветки
```

### 2. Установите переменные окружения (опционально)

```bash
# Создайте .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
NEXT_PUBLIC_JWT_COOKIE_NAME=lg_jwt
NEXT_PUBLIC_DISABLE_RECAPTCHA=false
NEXT_PUBLIC_DISABLE_WEBSOCKET=false
EOF
```

### 3. Пересоберите и перезапустите фронтенд

```bash
# Если используете Next.js в production режиме
npm run build
npm start

# Или если используете PM2
pm2 restart frontend

# Или если используете systemd
sudo systemctl restart your-frontend-service
```

### 4. Проверьте работу

1. **Откройте страницу уведомлений:**
   ```
   https://logistgo.pro/notifications
   ```

2. **Проверьте API endpoints в браузере:**
   ```javascript
   // В консоли браузера
   fetch('/api/notifications/unread-count', {
     headers: { 'Authorization': 'Bearer REDACTED_SECRET' }
   }).then(r => r.json()).then(console.log);
   ```

3. **Проверьте WebSocket соединение:**
   - Откройте DevTools → Network → WS
   - Должно быть соединение к `wss://logistgo.pro/notifications`

## 🔧 Альтернативные способы настройки

### Через переменные окружения системы

```bash
# Установить глобально
export NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
export NEXT_PUBLIC_JWT_COOKIE_NAME=lg_jwt
```

### Через Docker (если используете)

```dockerfile
ENV NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
ENV NEXT_PUBLIC_JWT_COOKIE_NAME=lg_jwt
```

### Через PM2 ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'frontend',
    script: 'npm',
    args: 'start',
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'https://logistgo.pro',
      NEXT_PUBLIC_JWT_COOKIE_NAME: 'lg_jwt'
    }
  }]
};
```

## 📋 Проверка

После применения исправлений:

1. ✅ **Страница `/notifications` загружается без 404**
2. ✅ **API endpoints работают корректно**
3. ✅ **WebSocket соединения устанавливаются**
4. ✅ **Уведомления отображаются и обновляются**

## 🎯 Результат

- **Локально**: API обращается к `http://localhost:5555`
- **На продакшене**: API обращается к `https://logistgo.pro`
- **Fallback**: Если переменные не установлены, используется правильный продакшн URL

## 📝 Примечания

- Переменные окружения `NEXT_PUBLIC_*` доступны в браузере
- Изменения в `.env.local` требуют перезапуска приложения
- WebSocket URL автоматически определяется по окружению
- Все API вызовы теперь используют централизованную конфигурацию
