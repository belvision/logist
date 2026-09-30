# Восстановление интеграции с Bitrix24 и уведомлений

## 🚨 Проблема
Сайт не получает ответы из Bitrix24 в поддержке, и уведомления не отображаются в центре уведомлений без перезагрузки страницы.

## ✅ Решение

### 1. Восстановлена интеграция с Bitrix24

#### **Обновлен webhook.repository.ts:**
- ✅ Добавлено создание уведомлений в базе данных при получении ответов от поддержки
- ✅ Сохранена отправка WebSocket уведомлений
- ✅ Используется тип уведомления `support_reply` для корректной категоризации

#### **Код изменений:**
```typescript
// Создаем уведомление в базе данных
await notifyUser(
  currentTicket[0].id_user,
  'support_reply',
  'Новый ответ от поддержки',
  `Получен новый ответ по тикету: ${currentTicket[0].subject}`,
  {
    ticket_id: ticketId,
    support_message: comment.message,
    author: comment.author
  },
  'medium'
);

// Отправляем WebSocket уведомление
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
```

### 2. Улучшена система уведомлений

#### **Обновлен NotificationsProvider.tsx:**
- ✅ Добавлено обновление контекста уведомлений при получении WebSocket сообщений
- ✅ Уведомления обновляются без перезагрузки страницы
- ✅ Метки в sidebar обновляются в реальном времени

#### **Код изменений:**
```typescript
// Обрабатываем сообщения от поддержки
if (data.type === 'support_message') {
  console.log('[NotificationsProvider] New support message received');
  fetchUnreadCount(); // Обновляем счетчик уведомлений
  refreshNotifications(); // Обновляем контекст для меток
}

// Обрабатываем другие типы уведомлений
if (data.type === 'notification') {
  console.log('[NotificationsProvider] New notification received:', data.data);
  fetchUnreadCount(); // Обновляем счетчик уведомлений
  refreshNotifications(); // Обновляем контекст для меток
}
```

### 3. Создан тестовый скрипт

#### **Файл: `test-bitrix24-webhook.js`**
- ✅ Тестирует webhook от Bitrix24 с реальными данными
- ✅ Проверяет правильность обработки токена
- ✅ Валидирует ответ сервера

#### **Использование:**
```bash
# Запустить тест
node test-bitrix24-webhook.js

# Или с правами выполнения
chmod +x test-bitrix24-webhook.js
./test-bitrix24-webhook.js
```

## 🚀 Инструкции по развертыванию

### 1. Обновите код на продакшене

```bash
# На продакшене
cd /path/to/backend
git pull origin socket  # или main

# Перезапустите бэкенд
pm2 restart backend
# или
sudo systemctl restart your-backend-service
```

### 2. Проверьте переменные окружения

Убедитесь, что на продакшене установлены:
```bash
# Backend .env
BITRIX24_URL=https://your-portal.bitrix24.by/rest/1/REDACTED_SECRET/
BITRIX24_WEBHOOK_TOKEN=your_webhook_token

# Frontend .env.local (опционально)
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
```

### 3. Протестируйте интеграцию

#### **Тест 1: Webhook от Bitrix24**
```bash
# Запустите тестовый скрипт
node test-bitrix24-webhook.js
```

Ожидаемый результат:
```
🎉 [TEST] SUCCESS: Webhook processed successfully!
🎫 [TEST] Ticket ID: uuid-here
💬 [TEST] Message was added to ticket
```

#### **Тест 2: Уведомления в интерфейсе**
1. Откройте `https://logistgo.pro/notifications`
2. Создайте тикет поддержки
3. Ответьте на тикет в Bitrix24
4. Проверьте, что:
   - ✅ Уведомление появилось в центре уведомлений
   - ✅ Метка в sidebar обновилась без перезагрузки
   - ✅ WebSocket соединение работает

#### **Тест 3: API endpoints**
```bash
# Проверьте API уведомлений
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     https://logistgo.pro/api/notifications/unread-count

# Проверьте API поддержки
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     https://logistgo.pro/api/bitrix24/support/open
```

## 🔧 Настройка Bitrix24

### 1. URL обработчика
```
https://logistgo.pro/api/bitrix24/webhook?token=YOUR_WEBHOOK_TOKEN
```

### 2. События для отслеживания
- `ONCRMITEMUPDATE` - обновление смарт-процесса
- `ONCRMITEMADD` - создание смарт-процесса

### 3. ID смарт-процесса
- Убедитесь, что используется правильный ID (1038)
- Проверьте, что `document_id[2]` содержит `DYNAMIC_1038_XXX`

## 📋 Проверка работы

### 1. Логи бэкенда
```bash
# Проверьте логи webhook
tail -f /path/to/backend/logs/webhook.log

# Или через PM2
pm2 logs backend --lines 100
```

Ищите сообщения:
- `✅ [WEBHOOK ROUTER] Token validation passed`
- `✅ [WEBHOOK SERVICE] Comment added to existing ticket`
- `✅ [WEBHOOK REPOSITORY] Database notification created`

### 2. Логи фронтенда
Откройте DevTools → Console и ищите:
- `[NotificationsProvider] New support message received`
- `[NotificationsProvider] New notification received`
- `[WebSocket] Connected successfully`

### 3. База данных
```sql
-- Проверьте уведомления
SELECT * FROM notifications WHERE type = 'support_reply' ORDER BY created_at DESC LIMIT 10;

-- Проверьте тикеты с новыми ответами
SELECT id_ticket, subject, status_new, updated_at 
FROM support_tickets 
WHERE status_new = 'Новый ответ' 
ORDER BY updated_at DESC LIMIT 10;
```

## 🎯 Результат

После применения исправлений:

- ✅ **Bitrix24 интеграция работает**: Ответы от поддержки поступают на сайт
- ✅ **Уведомления создаются**: Записи сохраняются в базе данных
- ✅ **WebSocket работает**: Уведомления приходят в реальном времени
- ✅ **Метки обновляются**: Sidebar показывает новые сообщения без перезагрузки
- ✅ **Центр уведомлений работает**: Пользователи видят все уведомления

## 📝 Примечания

- WebSocket уведомления работают в дополнение к polling
- Уведомления создаются как в БД, так и отправляются через WebSocket
- Метки в sidebar обновляются автоматически при получении уведомлений
- Тестовый скрипт можно использовать для отладки webhook
