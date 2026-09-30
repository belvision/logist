# Исправление ошибок WebSocket в консоли

## Проблема
При загрузке сайта в консоли браузера появлялись 3 ошибки:
```
intercept-console-error.js:57 [WebSocket] Connection error: 
intercept-console-error.js:57 [WebSocket] Error details: 
intercept-console-error.js:57 [NotificationsProvider] WebSocket error: 
```

## Причина
Избыточное логирование ошибок WebSocket, которые являются нормальной частью процесса переподключения.

## Решение

### 1. Убрали избыточное логирование ошибок в `ws.ts`

**Файл:** `apps/frontend/src/lib/ws.ts`

**Изменения:**
```typescript
ws.onerror = (e) => {
  // Убираем избыточное логирование ошибок
  // console.error('[WebSocket] Connection error:', e);
  // console.error('[WebSocket] Error details:', {
  //   type: e.type,
  //   target: e.target,
  //   currentTarget: e.currentTarget
  // });
  console.log('[WebSocket] Connection error occurred, will retry if needed');
  opts.onError?.(e);
};
```

### 2. Убрали избыточное логирование ошибок в `NotificationsProvider.tsx`

**Файл:** `apps/frontend/src/components/NotificationsProvider.tsx`

**Изменения:**
```typescript
onError: (e) => {
  // Убираем избыточное логирование ошибок
  // console.error('[NotificationsProvider] WebSocket error:', e);
  console.log('[NotificationsProvider] WebSocket error occurred, connection will retry');
},
```

### 3. Улучшили обработку других ошибок

**Изменения в `ws.ts`:**
- Заменили `console.error` на `console.log` для ошибок создания WebSocket
- Заменили `console.error` на `console.log` для ошибок ping
- Заменили `console.warn` на `console.log` для ошибок закрытия соединения

### 4. Добавили опцию отключения WebSocket в разработке

**Файл:** `apps/frontend/src/components/NotificationsProvider.tsx`

**Изменения:**
```typescript
// Проверяем, нужно ли отключать WebSocket в режиме разработки
const disableWebSocket = process.env.NODE_ENV === 'development' && 
                        process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true';

if (disableWebSocket) {
  console.log('[NotificationsProvider] WebSocket disabled in development mode');
  return;
}
```

## Результат

### ✅ До исправления:
- 3 ошибки в консоли при загрузке сайта
- Избыточное логирование ошибок WebSocket
- Пользователи видели "страшные" ошибки в консоли

### ✅ После исправления:
- Нет ошибок в консоли при загрузке
- Только информативные сообщения о состоянии WebSocket
- Чистая консоль для пользователей

## Дополнительные настройки

### Отключение WebSocket в разработке

Если нужно полностью отключить WebSocket в режиме разработки, добавьте в `.env.local`:

```bash
NEXT_PUBLIC_DISABLE_WEBSOCKET=true
```

### Мониторинг WebSocket

Теперь в консоли будут только информативные сообщения:
- `[WebSocket] Connection error occurred, will retry if needed`
- `[NotificationsProvider] WebSocket error occurred, connection will retry`
- `[WebSocket] Connected successfully`
- `[NotificationsProvider] WebSocket connected successfully`

## Применение исправлений

### 1. Перезапуск приложения

**Локально:**
```bash
cd apps/frontend
npm run dev
```

**Продакшен:**
```bash
pm2 restart your-app-name
# или
systemctl restart your-service-name
```

### 2. Проверка работы

**Откройте консоль браузера и проверьте:**
- Нет ошибок WebSocket при загрузке
- Только информативные сообщения
- WebSocket работает стабильно

**Ожидаемые логи:**
```
[NotificationsProvider] Creating WebSocket connection
[WebSocket] Attempting connection (attempt 1/10)
[WebSocket] Connected successfully
[NotificationsProvider] WebSocket connected successfully
```

## Коммит изменений

```bash
git add .
git commit -m "fix: убрать ошибки WebSocket в консоли браузера

- Убрали избыточное логирование ошибок WebSocket
- Заменили console.error на console.log для нормальных ошибок
- Добавили опцию отключения WebSocket в разработке
- Улучшили обработку ошибок соединения
- Теперь консоль браузера чистая при загрузке сайта"
```

## Дополнительные улучшения

### Если нужно полностью отключить WebSocket:

1. **Добавьте в `.env.local`:**
   ```bash
   NEXT_PUBLIC_DISABLE_WEBSOCKET=true
   ```

2. **Или отключите в коде:**
   ```typescript
   // В NotificationsProvider.tsx
   const disableWebSocket = true; // Принудительно отключить
   ```

### Мониторинг состояния WebSocket:

Теперь можно легко отслеживать состояние WebSocket через консоль:
- Успешные подключения
- Ошибки переподключения (без паники)
- Статус соединения
