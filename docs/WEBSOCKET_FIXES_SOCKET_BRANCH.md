# Исправления WebSocket на ветке socket

## Проблемы, которые исправлены

1. **Ошибки в консоли браузера**: `1006`, `1008`, "Insufficient resources"
2. **Неправильный URL для локальной разработки**: использовался `wss://logistgo.pro` вместо `ws://localhost:5555`
3. **Отсутствие ограничений соединений**: не было лимитов на количество WebSocket соединений
4. **Плохая обработка ошибок**: недостаточно информации для отладки

## Изменения в коде

### 1. Frontend (`apps/frontend/src/lib/ws.ts`)

**Исправления:**
- ✅ Автоматическое определение URL в зависимости от окружения
- ✅ Локальная разработка: `ws://localhost:5555/notifications`
- ✅ Продакшен: `wss://logistgo.pro/notifications`
- ✅ Улучшенная обработка ошибок с детальной информацией

**Код:**
```typescript
// Определяем URL в зависимости от окружения
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
const defaultUrl = isDevelopment 
  ? 'ws://localhost:5555/notifications' 
  : 'wss://logistgo.pro/notifications';
```

### 2. Backend (`apps/backend/src/ws/notifications.ts`)

**Исправления:**
- ✅ Ограничение соединений: 2 на пользователя (было 3)
- ✅ Общий лимит: 100 соединений всего
- ✅ Проверка общего количества соединений
- ✅ Функция мониторинга статистики

**Код:**
```typescript
const MAX_CONNECTIONS_PER_USER = 2; // Уменьшаем до 2 соединений на пользователя
const MAX_TOTAL_CONNECTIONS = 100; // Максимум 100 соединений всего

// Проверка общего количества соединений
const totalConnections = Array.from(connections.values()).reduce((sum, conns) => sum + conns.length, 0);
if (totalConnections >= MAX_TOTAL_CONNECTIONS) {
  ws.close(1008, 'server_overloaded');
  return;
}
```

### 3. API (`apps/backend/src/api/index.ts`)

**Новые эндпоинты:**
- ✅ `/api/websocket/stats` - мониторинг WebSocket соединений

**Пример ответа:**
```json
{
  "status": "ok",
  "websocket": {
    "totalConnections": 5,
    "uniqueUsers": 3,
    "maxConnectionsPerUser": 2,
    "maxTotalConnections": 100,
    "connectionsByUser": [
      {"userId": "123", "connectionCount": 1},
      {"userId": "456", "connectionCount": 2}
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Nginx (`nginx-websocket.conf`)

**Новая конфигурация:**
- ✅ Ограничения соединений: 5 WebSocket соединений с одного IP
- ✅ Ограничение частоты: 10 запросов в минуту
- ✅ Правильные WebSocket заголовки
- ✅ Длительные таймауты для WebSocket (24 часа)
- ✅ Отключение буферизации для WebSocket

## Применение исправлений

### 1. Локальная разработка

**Запуск бэкенда:**
```bash
cd apps/backend
npm run dev
```

**Запуск фронтенда:**
```bash
cd apps/frontend
npm run dev
```

**Проверка WebSocket:**
- Откройте `http://localhost:3000/profile`
- Проверьте консоль браузера - ошибок быть не должно
- WebSocket должен подключаться к `ws://localhost:5555/notifications`

### 2. Продакшен

**Обновление Nginx:**
```bash
# Скопируйте конфигурацию
sudo cp nginx-websocket.conf /etc/nginx/sites-available/logistgo.pro

# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

**Перезапуск бэкенда:**
```bash
# Перезапустите ваше приложение
pm2 restart your-app-name
# или
systemctl restart your-service-name
```

### 3. Мониторинг

**Проверка WebSocket статистики:**
```bash
curl https://logistgo.pro/api/websocket/stats
```

**Проверка логов:**
```bash
# Логи бэкенда
tail -f /var/log/your-app.log

# Логи Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Ожидаемый результат

### ✅ Локальная разработка
- WebSocket подключается к `ws://localhost:5555/notifications`
- Нет ошибок в консоли браузера
- Стабильное соединение без переподключений

### ✅ Продакшен
- WebSocket подключается к `wss://logistgo.pro/notifications`
- Ограничения предотвращают перегрузку сервера
- Мониторинг показывает статистику соединений
- Стабильная работа без ошибок `1006` и `1008`

## Отладка

### Если WebSocket не подключается локально:

1. **Проверьте, что бэкенд запущен на порту 5555:**
   ```bash
   netstat -tlnp | grep :5555
   ```

2. **Проверьте логи бэкенда:**
   ```bash
   # В логах должно быть:
   [WebSocket] User 123 connected (1/2 connections)
   ```

3. **Проверьте консоль браузера:**
   ```javascript
   // Должно быть:
   [WebSocket] Attempting connection (attempt 1/10)
   [WebSocket] Connected successfully
   ```

### Если WebSocket не подключается на продакшене:

1. **Проверьте Nginx конфигурацию:**
   ```bash
   sudo nginx -t
   ```

2. **Проверьте доступность эндпоинта:**
   ```bash
   curl -I https://logistgo.pro/notifications
   ```

3. **Проверьте статистику:**
   ```bash
   curl https://logistgo.pro/api/websocket/stats
   ```

## Коммит изменений

```bash
git add .
git commit -m "fix: исправления WebSocket для локальной разработки и продакшена

- Автоматическое определение URL WebSocket в зависимости от окружения
- Ограничения соединений: 2 на пользователя, 100 всего
- Улучшенная обработка ошибок с детальной информацией
- Эндпоинт мониторинга /api/websocket/stats
- Конфигурация Nginx с ограничениями и правильными заголовками"
```
