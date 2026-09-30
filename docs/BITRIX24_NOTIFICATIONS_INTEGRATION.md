# Интеграция уведомлений от Bitrix24 в систему уведомлений

## Обзор

Интегрированы уведомления от Bitrix24 в новый блок уведомлений в личном кабинете. Теперь когда сотрудник поддержки добавляет комментарий в Bitrix24, пользователь получает уведомление в реальном времени через WebSocket без перезагрузки страницы.

## Архитектура решения

### 1. WebSocket уведомления в реальном времени
- **WebSocket соединение** поддерживает уведомления в реальном времени
- **Периодическая проверка** каждую минуту как fallback
- **Автоматическое обновление** счетчика непрочитанных уведомлений

### 2. Интеграция с системой уведомлений
- **Новый тип уведомления**: `support_message`
- **Отображение в NotificationCenter** с иконкой поддержки
- **Обновление store** уведомлений автоматически

## Изменения в коде

### Frontend изменения

#### 1. NotificationsProvider.tsx
**Файл:** `apps/frontend/src/components/NotificationsProvider.tsx`

**Изменения:**
```typescript
// Добавлен импорт store уведомлений
import { useNotificationStore } from '@/store/notificationStore';

// Добавлена обработка WebSocket сообщений
onMessage: (data) => {
  // Обрабатываем сообщения от поддержки
  if (data.type === 'support_message') {
    console.log('[NotificationsProvider] New support message received');
    fetchUnreadCount(); // Обновляем счетчик
  }
  
  // Обрабатываем другие типы уведомлений
  if (data.type === 'notification') {
    console.log('[NotificationsProvider] New notification received:', data.data);
    fetchUnreadCount(); // Обновляем счетчик
    
    // Показываем уведомление пользователю
    if (data.data?.type === 'support_message') {
      console.log('[NotificationsProvider] Support message notification:', data.data);
    }
  }
}
```

#### 2. notifications-context.tsx
**Файл:** `apps/frontend/src/shared/context/notifications-context.tsx`

**Изменения:**
```typescript
// Увеличен интервал проверки до 1 минуты
interval = setInterval(checkForNewMessages, 60000); // Каждую минуту
```

#### 3. NotificationCenter.tsx
**Файл:** `apps/frontend/src/components/notifications/NotificationCenter.tsx`

**Изменения:**
```typescript
// Добавлен новый тип уведомления
case 'support_reply':
case 'support_closed':
case 'support_message': // Новый тип
  return <AlertCircle className="h-5 w-5 text-orange-500" />;
```

#### 4. notifications/page.tsx
**Файл:** `apps/frontend/src/app/notifications/page.tsx`

**Изменения:**
```typescript
// Добавлен новый тип уведомления
case 'support_reply':
case 'support_closed':
case 'support_message': // Новый тип
  return <AlertCircle className="h-6 w-6 text-orange-500" />;
```

### Backend изменения

#### 1. webhook.repository.ts
**Файл:** `apps/backend/src/api/bitrix24/webhook.repository.ts`

**Изменения:**
```typescript
// Добавлен импорт WebSocket функции
import { sendNotificationToUser } from '../../ws/notifications';

// В функции addSupportCommentToTicket добавлена отправка уведомления
// Отправляем WebSocket уведомление пользователю
try {
  await sendNotificationToUser(currentTicket[0].id_user, {
    type: 'support_message',
    title: 'Новый ответ от поддержки',
    message: `Получен новый ответ по тикету: ${currentTicket[0].subject}`,
    metadata: {
      ticket_id: ticketId,
      support_message: comment.message,
      author: comment.author
    }
  });
  console.log('✅ [WEBHOOK REPOSITORY] WebSocket notification sent to user:', currentTicket[0].id_user);
} catch (error) {
  console.error('❌ [WEBHOOK REPOSITORY] Failed to send WebSocket notification:', error);
}
```

#### 2. notifications.ts (WebSocket)
**Файл:** `apps/backend/src/ws/notifications.ts`

**Изменения:**
```typescript
// Добавлен интерфейс для уведомлений
interface NotificationData {
  type: string;
  title: string;
  message: string;
  metadata?: {
    ticket_id?: string;
    support_message?: string;
    author?: string;
    [key: string]: any;
  };
}

// Добавлена функция отправки уведомления пользователю
export async function sendNotificationToUser(userId: string, notification: NotificationData): Promise<boolean> {
  // Отправляет уведомление конкретному пользователю через WebSocket
}

// Добавлена функция broadcast уведомлений
export async function broadcastNotification(notification: NotificationData): Promise<number> {
  // Отправляет уведомление всем подключенным пользователям
}
```

## Логика работы

### 1. Получение сообщения от поддержки
1. **Сотрудник поддержки** добавляет комментарий в Bitrix24
2. **Bitrix24 отправляет webhook** на наш сервер
3. **Webhook обрабатывается** в `webhook.service.ts`
4. **Комментарий сохраняется** в БД через `webhook.repository.ts`
5. **WebSocket уведомление отправляется** пользователю

### 2. Получение уведомления пользователем
1. **WebSocket получает уведомление** в `NotificationsProvider`
2. **Счетчик обновляется** автоматически
3. **Уведомление отображается** в NotificationCenter
4. **Пользователь видит** новое уведомление без перезагрузки

### 3. Fallback механизм
1. **Если WebSocket недоступен** - используется polling каждую минуту
2. **Проверка новых сообщений** через API `/api/bitrix24/support/open`
3. **Обновление счетчика** через `notifications-context.tsx`

## Типы уведомлений

### Новый тип: `support_message`
- **Иконка**: AlertCircle (оранжевая)
- **Заголовок**: "Новый ответ от поддержки"
- **Сообщение**: "Получен новый ответ по тикету: [тема тикета]"
- **Метаданные**:
  - `ticket_id`: ID тикета
  - `support_message`: Текст сообщения от поддержки
  - `author`: Автор сообщения

## WebSocket сообщения

### Формат сообщения от сервера
```json
{
  "type": "notification",
  "data": {
    "type": "support_message",
    "title": "Новый ответ от поддержки",
    "message": "Получен новый ответ по тикету: Проблема с авторизацией",
    "metadata": {
      "ticket_id": "uuid-ticket-id",
      "support_message": "Мы работаем над решением вашей проблемы...",
      "author": "Сотрудник поддержки"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Настройки и конфигурация

### Интервалы проверки
- **WebSocket**: В реальном времени
- **Polling fallback**: Каждую минуту (60 секунд)
- **NotificationCenter**: Каждые 30 секунд (счетчик)

### Логирование
Все операции логируются с префиксами:
- `[NotificationsProvider]` - фронтенд WebSocket
- `[WEBHOOK REPOSITORY]` - обработка webhook'ов
- `[WebSocket]` - бэкенд WebSocket

## Тестирование

### 1. Тест WebSocket уведомлений
1. Откройте личный кабинет пользователя
2. Создайте тикет в поддержке
3. Добавьте комментарий от поддержки в Bitrix24
4. Проверьте, что уведомление появилось без перезагрузки

### 2. Тест fallback механизма
1. Отключите WebSocket соединение
2. Добавьте комментарий от поддержки
3. Проверьте, что уведомление появилось через минуту

### 3. Тест счетчика уведомлений
1. Проверьте, что счетчик обновляется автоматически
2. Откройте NotificationCenter
3. Убедитесь, что уведомление отображается с правильной иконкой

## Мониторинг

### Логи для отслеживания
```bash
# Успешная отправка уведомления
✅ [WEBHOOK REPOSITORY] WebSocket notification sent to user: user-id

# Получение уведомления на фронтенде
[NotificationsProvider] New notification received: {...}

# Обновление счетчика
[NotificationsProvider] New support message received
```

### Метрики
- Количество отправленных WebSocket уведомлений
- Количество полученных уведомлений на фронтенде
- Время отклика системы уведомлений
- Количество fallback запросов

## Известные ограничения

1. **WebSocket соединение** должно быть активно для получения уведомлений в реальном времени
2. **Fallback polling** работает каждую минуту, не мгновенно
3. **Уведомления сохраняются** только в локальном состоянии, не в БД
4. **Звуковые уведомления** не реализованы (можно добавить)

## Дальнейшие улучшения

### Возможные улучшения
1. **Звуковые уведомления** при получении сообщений от поддержки
2. **Push уведомления** для мобильных устройств
3. **Email уведомления** как дополнительный канал
4. **Настройки уведомлений** для пользователей
5. **История уведомлений** в БД
6. **Группировка уведомлений** по типу

### Настройки пользователя
```typescript
interface NotificationSettings {
  support_reply_sound: boolean;
  support_reply_push: boolean;
  support_reply_email: boolean;
  support_reply_frequency: 'instant' | 'hourly' | 'daily';
}
```

## Применение изменений

### 1. Перезапуск приложения
```bash
# Backend
cd apps/backend
npm run dev

# Frontend
cd apps/frontend
npm run dev
```

### 2. Проверка работы
1. Откройте личный кабинет
2. Создайте тикет в поддержке
3. Добавьте комментарий от поддержки в Bitrix24
4. Проверьте уведомление в реальном времени

### 3. Мониторинг логов
```bash
# Backend логи
tail -f backend.log | grep -E "(WEBHOOK|WebSocket)"

# Frontend логи (в консоли браузера)
# Фильтр: NotificationsProvider
```

## Коммит изменений

```bash
git add .
git commit -m "feat: интегрировать уведомления от Bitrix24 в систему уведомлений

- Добавлена отправка WebSocket уведомлений при получении сообщений от поддержки
- Обновлен NotificationsProvider для обработки уведомлений поддержки
- Добавлен новый тип уведомления 'support_message' в NotificationCenter
- Увеличен интервал проверки до 1 минуты как fallback
- Добавлены функции sendNotificationToUser и broadcastNotification в WebSocket
- Интеграция с системой уведомлений без перезагрузки страницы"
```
