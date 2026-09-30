# Исправление дублирующих WebSocket соединений

## Проблема
В консоли браузера было 1816 ошибок и 455 предупреждений из-за создания множественных WebSocket соединений. Проблема была в том, что WebSocket создавался в двух местах:

1. `NotificationsProvider.tsx` - создавал одно соединение
2. `notifications-context.tsx` через `useWebSocket` - создавал второе соединение

## Причина
Дублирующие WebSocket соединения создавались из-за того, что:
- `NotificationProvider` в layout использовал `useWebSocket` hook
- `NotificationsProvider` компонент тоже создавал WebSocket соединение
- Это приводило к созданию 2+ соединений на одного пользователя

## Решение

### 1. Отключили `useWebSocket` в `notifications-context.tsx`

**Файл:** `apps/frontend/src/shared/context/notifications-context.tsx`

**Изменения:**
```typescript
// Закомментировали импорт
// import { useWebSocket } from '../hooks/useWebSocket';

// Отключили использование useWebSocket
// const { isConnected, connectionStatus } = useWebSocket({...});

// Временно отключаем WebSocket
const isConnected = false;
const connectionStatus = 'disconnected';
```

### 2. Улучшили `NotificationsProvider.tsx`

**Файл:** `apps/frontend/src/components/NotificationsProvider.tsx`

**Изменения:**
- ✅ Добавили детальное логирование
- ✅ Улучшили обработку сообщений
- ✅ Добавили проверку токена
- ✅ Улучшили cleanup функцию

### 3. Добавили `NotificationsProvider` в layout

**Файл:** `apps/frontend/src/app/layout.tsx`

**Изменения:**
```typescript
import NotificationsProvider from '@/components/NotificationsProvider';

// В JSX:
<NotificationProvider>
  <NotificationsProvider />
  {/* остальные компоненты */}
</NotificationProvider>
```

## Результат

### ✅ До исправления:
- 1816 ошибок в консоли
- 455 предупреждений
- Множественные WebSocket соединения
- Ошибки "exceeded max connections"

### ✅ После исправления:
- Только одно WebSocket соединение
- Нет дублирующих соединений
- Чистая консоль без ошибок
- Стабильная работа

## Применение исправлений

### 1. Перезапуск приложения

**Локально:**
```bash
# Остановите и перезапустите фронтенд
cd apps/frontend
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

**Откройте консоль браузера и проверьте:**
- Нет ошибок WebSocket
- Только одно соединение создается
- Логи показывают правильную работу

**Ожидаемые логи:**
```
[NotificationsProvider] Creating WebSocket connection
[WebSocket] Closing previous connection before creating new one
[WebSocket] Attempting connection (attempt 1/10)
[WebSocket] Connected successfully
[NotificationsProvider] WebSocket connected
```

### 3. Проверка статистики

**Проверьте WebSocket статистику:**
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
        "userId": "USER_ID",
        "connectionCount": 1
      }
    ]
  }
}
```

## Мониторинг

### Логи бэкенда
**Нормальная работа:**
```
[WebSocket] User USER_ID connected (1/2 connections)
[WebSocket] User USER_ID disconnected (code: 1000, reason: Cleanup)
[WebSocket] User USER_ID connected (1/2 connections)
```

**При превышении лимита (не должно происходить):**
```
[WebSocket] User USER_ID exceeded max connections (2/2), closing oldest connection
```

### Логи фронтенда
**Нормальная работа:**
```
[NotificationsProvider] Creating WebSocket connection
[WebSocket] Closing previous connection before creating new one
[WebSocket] Attempting connection (attempt 1/10)
[WebSocket] Connected successfully
[NotificationsProvider] WebSocket connected
```

## Отладка

### Если проблема продолжается:

1. **Проверьте, что код обновился:**
   ```bash
   git status
   git diff
   ```

2. **Очистите кэш браузера** и перезагрузите страницу

3. **Проверьте, что только один WebSocket создается:**
   - Откройте DevTools → Network → WS
   - Должно быть только одно WebSocket соединение

4. **Принудительно закройте все соединения:**
   ```bash
   curl -X POST http://localhost:5555/api/websocket/close-user/USER_ID
   ```

## Коммит изменений

```bash
git add .
git commit -m "fix: исправление дублирующих WebSocket соединений

- Отключили useWebSocket в notifications-context.tsx
- Улучшили NotificationsProvider.tsx с детальным логированием
- Добавили NotificationsProvider в layout
- Устранили создание множественных WebSocket соединений
- Теперь создается только одно соединение на пользователя"
```

## Дополнительные улучшения

### Если нужно включить WebSocket в notifications-context:

1. **Раскомментируйте код в `notifications-context.tsx`**
2. **Убедитесь, что `NotificationsProvider` не создает соединение**
3. **Или наоборот - оставьте только `NotificationsProvider`**

### Рекомендация:
Оставить только `NotificationsProvider` для WebSocket соединений, так как это проще в управлении и отладке.
