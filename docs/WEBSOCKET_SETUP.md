# Настройка WebSocket для уведомлений в реальном времени

## Обзор

Система уведомлений в реальном времени использует WebSocket соединение для получения мгновенных уведомлений о новых сообщениях от поддержки.

## Логика работы

- **В продакшене**: WebSocket включен по умолчанию, если не отключен явно
- **В разработке**: WebSocket работает только если настроен `NEXT_PUBLIC_WS_URL`
- **Fallback**: Если WebSocket недоступен, используется polling каждые 15 секунд

## Компоненты

### 1. Backend WebSocket Server (`apps/backend/src/ws/notifications.ts`)
- WebSocket сервер, интегрированный с HTTP сервером
- Аутентификация через JWT токен в query параметре
- Обработка ping/pong сообщений
- Поддержка множественных соединений

### 2. Frontend WebSocket Client (`apps/frontend/src/lib/ws.ts`)
- Универсальный WebSocket клиент с автоматическим переподключением
- Экспоненциальная задержка при переподключении
- Обработка ошибок и событий

### 3. Token Utility (`apps/frontend/src/lib/auth/token.ts`)
- Получение access token из localStorage или cookies
- Поддержка различных источников токенов

### 4. NotificationProvider (`src/shared/context/notifications-context.tsx`)
- Управляет состоянием уведомлений
- Подключается к WebSocket серверу (если доступен)
- Автоматически проверяет новые сообщения каждые 15 секунд как fallback
- Обновляет счетчик новых сообщений

### 5. useWebSocket Hook (`src/shared/hooks/useWebSocket.ts`)
- Универсальный хук для работы с WebSocket
- Автоматическое переподключение при разрыве соединения
- Обработка ошибок и событий
- Умная логика включения/отключения

### 6. Sidebar Integration
- Отображает метку с количеством новых сообщений
- Показывает индикатор подключения WebSocket
- Анимированные уведомления

## Настройка WebSocket сервера

### Переменные окружения

**Для продакшена** (`.env.production`):
```env
# WebSocket включен по умолчанию в продакшене
NEXT_PUBLIC_WS_URL=wss://logistgo.pro/notifications
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
```

**Для разработки** (`.env.local`):
```env
# Для локальной разработки (если WebSocket сервер запущен)
NEXT_PUBLIC_WS_URL=ws://localhost:5555/notifications
NEXT_PUBLIC_API_BASE_URL=http://localhost:5555

# Для отключения WebSocket в разработке
# NEXT_PUBLIC_WS_URL=false
```

## Интеграция в приложение

### Подключение NotificationsProvider

Добавьте `NotificationsProvider` в ваш layout:

```tsx
// apps/frontend/src/app/layout.tsx
import NotificationsProvider from '@/components/NotificationsProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <NotificationsProvider />
        {children}
      </body>
    </html>
  );
}
```

### Использование в компонентах

```tsx
import { useNotifications } from '@/shared/context/notifications-context';

function MyComponent() {
  const { hasNewSupportMessages, newMessagesCount, isWebSocketConnected } = useNotifications();
  
  return (
    <div>
      {hasNewSupportMessages && (
        <div>Новых сообщений: {newMessagesCount}</div>
      )}
      <div>WebSocket: {isWebSocketConnected ? 'Подключен' : 'Отключен'}</div>
    </div>
  );
}
```

**Примечания**:
- В продакшене WebSocket работает автоматически, если не отключен явно
- В разработке WebSocket работает только если настроен URL
- Система автоматически определяет протокол WebSocket на основе текущего URL:
  - HTTP сайт → `ws://localhost:5555/notifications`
  - HTTPS сайт → `wss://logistgo.pro/notifications`
- Если WebSocket недоступен, система автоматически переключается на polling каждые 15 секунд
- Для отключения WebSocket установите `NEXT_PUBLIC_WS_URL=false`

### Backend WebSocket сервер

Создайте WebSocket сервер на бэкенде:

```javascript
// Пример для Node.js с ws
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ host: '0.0.0.0', port: 5555, path: '/ws/notifications' });

wss.on('connection', (ws, req) => {
  // Получаем токен из query параметров
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  try {
    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = decoded.userId;
    
    console.log(`User ${decoded.userId} connected to notifications`);
    
    ws.on('close', () => {
      console.log(`User ${decoded.userId} disconnected from notifications`);
    });
    
  } catch (error) {
    console.error('Invalid token:', error);
    ws.close(1008, 'Invalid token');
  }
});

// Функция для отправки уведомления пользователю
function sendNotificationToUser(userId, notification) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(JSON.stringify(notification));
    }
  });
}

// Пример отправки уведомления при новом сообщении от поддержки
function notifyNewSupportMessage(userId, ticketId) {
  sendNotificationToUser(userId, {
    type: 'support_message',
    ticketId: ticketId,
    timestamp: new Date().toISOString()
  });
}

module.exports = { sendNotificationToUser, notifyNewSupportMessage };
```

### Интеграция с Bitrix24

В вашем API endpoint для отправки сообщений от поддержки:

```javascript
// В API endpoint для отправки сообщения от поддержки
const { notifyNewSupportMessage } = require('./websocket-server');

app.post('/api/bitrix24/support/comment', async (req, res) => {
  // ... ваша логика отправки сообщения ...
  
  // После успешной отправки сообщения
  if (response.success) {
    // Отправляем уведомление через WebSocket
    notifyNewSupportMessage(ticket.userId, ticket.id);
  }
  
  res.json(response);
});
```

## Функциональность

### Автоматические уведомления
- ✅ Колокольчик появляется мгновенно при новом сообщении
- ✅ Счетчик новых сообщений обновляется в реальном времени
- ✅ Метка на кнопке "Поддержка" в меню
- ✅ Автоматическое переподключение при разрыве соединения

### Fallback механизм
- Если WebSocket недоступен, система использует polling каждые 30 секунд
- Пользователь видит статус подключения в сайдбаре

### Безопасность
- Аутентификация через JWT токен
- Валидация токена при подключении
- Автоматическое отключение при неверном токене

## Тестирование

1. Запустите WebSocket сервер
2. Откройте приложение в браузере
3. Проверьте индикатор подключения в сайдбаре
4. Отправьте тестовое сообщение от поддержки
5. Убедитесь, что уведомление появилось мгновенно

## Отладка

В консоли браузера вы увидите:
- `WebSocket connected` - успешное подключение
- `Received notification: {...}` - получение уведомления
- `WebSocket error: ...` - ошибки подключения
- `Attempting to reconnect...` - попытки переподключения
