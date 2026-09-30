# Исправление проблемы множественных WebSocket соединений

## Проблема
Пользователь создавал слишком много WebSocket соединений (превышал лимит 2/2), что приводило к ошибкам:
- `[WebSocket] User exceeded max connections (2/2), rejecting new connection`
- `[WebSocket] Connection closed (code: 1008, reason: too_many_connections)`
- `[WebSocket] Connection closed (code: 1006, reason: )`

## Причина
Клиент создавал новые WebSocket соединения, но не закрывал старые, что приводило к накоплению соединений и превышению лимита.

## Решение

### 1. Frontend (`apps/frontend/src/lib/ws.ts`)

**Добавлено:**
- ✅ Глобальное отслеживание активного соединения
- ✅ Принудительное закрытие предыдущих соединений
- ✅ Улучшенная функция cleanup
- ✅ Регистрация активного соединения

**Ключевые изменения:**
```typescript
// Глобальный объект для отслеживания активного соединения
let activeConnection: { ws: WebSocket | null; close: () => void } | null = null;

// Закрываем предыдущее соединение, если оно существует
if (activeConnection) {
  console.log('[WebSocket] Closing previous connection before creating new one');
  activeConnection.close();
  activeConnection = null;
}
```

### 2. Backend (`apps/backend/src/ws/notifications.ts`)

**Добавлено:**
- ✅ Принудительное закрытие старых соединений при превышении лимита
- ✅ Функция `closeUserConnections()` для принудительного закрытия
- ✅ Улучшенная обработка превышения лимитов

**Ключевые изменения:**
```typescript
// При превышении лимита закрываем самое старое соединение
if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
  console.log(`[WebSocket] User ${userId} exceeded max connections, closing oldest connection`);
  
  const oldestConnection = userConnections[0];
  if (oldestConnection) {
    oldestConnection.close(1008, 'too_many_connections');
    userConnections.splice(0, 1);
  }
}
```

### 3. API (`apps/backend/src/api/index.ts`)

**Новые эндпоинты:**
- ✅ `POST /api/websocket/close-user/:userId` - принудительное закрытие всех соединений пользователя

**Пример использования:**
```bash
curl -X POST http://localhost:5555/api/websocket/close-user/722ee9bb-8ba4-4a18-b02d-6ce46a0900d0
```

## Применение исправлений

### 1. Перезапуск приложения

**Локально:**
```bash
# Остановите и перезапустите фронтенд и бэкенд
# Frontend
cd apps/frontend
npm run dev

# Backend  
cd apps/backend
npm run dev
```

**Продакшен:**
```bash
# Перезапустите ваше приложение
pm2 restart your-app-name
# или
systemctl restart your-service-name
```

### 2. Проверка работы

**Проверка статистики:**
```bash
curl http://localhost:5555/api/websocket/stats
```

**Ожидаемый результат:**
```json
{
  "status": "ok",
  "websocket": {
    "totalConnections": 1,
    "uniqueUsers": 1,
    "maxConnectionsPerUser": 2,
    "maxTotalConnections": 100,
    "connectionsByUser": [
      {
        "userId": "722ee9bb-8ba4-4a18-b02d-6ce46a0900d0",
        "connectionCount": 1
      }
    ]
  }
}
```

### 3. Принудительное закрытие соединений (если нужно)

**Закрыть все соединения пользователя:**
```bash
curl -X POST http://localhost:5555/api/websocket/close-user/722ee9bb-8ba4-4a18-b02d-6ce46a0900d0
```

## Ожидаемый результат

### ✅ Локальная разработка
- Только одно активное WebSocket соединение на пользователя
- Нет ошибок "exceeded max connections"
- Стабильное переподключение без накопления соединений

### ✅ Продакшен
- Автоматическое закрытие старых соединений
- Соблюдение лимитов (2 соединения на пользователя)
- Возможность принудительного закрытия через API

## Мониторинг

### Логи бэкенда
**Нормальная работа:**
```
[WebSocket] User 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0 connected (1/2 connections)
[WebSocket] User 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0 disconnected (code: 1000, reason: Reconnecting)
[WebSocket] User 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0 connected (1/2 connections)
```

**При превышении лимита:**
```
[WebSocket] User 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0 exceeded max connections (2/2), closing oldest connection
[WebSocket] User 722ee9bb-8ba4-4a18-b02d-6ce46a0900d0 connected (2/2 connections)
```

### Логи фронтенда
**Нормальная работа:**
```
[WebSocket] Closing previous connection before creating new one
[WebSocket] Attempting connection (attempt 1/10)
[WebSocket] Connected successfully
```

## Отладка

### Если проблема продолжается:

1. **Проверьте, что код обновился:**
   ```bash
   # Проверьте, что изменения применились
   git status
   git diff
   ```

2. **Принудительно закройте все соединения:**
   ```bash
   curl -X POST http://localhost:5555/api/websocket/close-user/USER_ID
   ```

3. **Проверьте статистику:**
   ```bash
   curl http://localhost:5555/api/websocket/stats
   ```

4. **Очистите кэш браузера** и перезагрузите страницу

## Коммит изменений

```bash
git add .
git commit -m "fix: исправление проблемы множественных WebSocket соединений

- Добавлено глобальное отслеживание активного соединения
- Принудительное закрытие предыдущих соединений перед созданием новых
- Автоматическое закрытие старых соединений при превышении лимита
- Эндпоинт для принудительного закрытия соединений пользователя
- Улучшенная функция cleanup с принудительным закрытием"
```
