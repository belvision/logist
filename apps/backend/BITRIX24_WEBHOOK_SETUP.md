# Настройка вебхуков Bitrix24 для системы поддержки

## Обзор

Система поддержки интегрирована с Bitrix24 через вебхуки. Когда сотрудник поддержки добавляет комментарий к смарт-процессу в Bitrix24, система автоматически получает уведомление и обновляет тикет в базе данных.

## Настройка вебхука в Bitrix24

### 1. Настройка переменных окружения

Добавьте в файл `.env` следующие переменные:

```env
# Bitrix24 Integration
BITRIX24_URL=https://your-portal.bitrix24.by/rest/1/REDACTED_SECRET/
BITRIX24_WEBHOOK_TOKEN=REDACTED_SECRET
```

**Где:**
- `BITRIX24_URL` - URL вашего портала Bitrix24 с кодом вебхука
- `BITRIX24_WEBHOOK_TOKEN` - токен приложения для исходящих вебхуков

### 2. Создание вебхука

1. Войдите в административную панель Bitrix24
2. Перейдите в **Настройки** → **Разработчикам** → **Другие настройки** → **Входящие вебхуки**
3. Нажмите **Добавить вебхук**
4. Заполните форму:
   - **Название**: "Поддержка logistgo.by"
   - **URL обработчика**: `https://your-domain.com/api/bitrix24/webhook`
   - **События**: Выберите события для смарт-процессов
   - **Права доступа**: CRM (чтение и запись)

### 2. Настройка событий

Выберите следующие события:
- `OnCrmDynamicItemAdd` - создание элемента смарт-процесса
- `OnCrmDynamicItemUpdate` - обновление элемента смарт-процесса
- `OnCrmTimelineCommentAdd` - добавление комментария в таймлайн

### 3. Получение URL и токена вебхука

После создания вебхука вы получите:

**URL вебхука:**
```
https://your-portal.bitrix24.by/rest/1/REDACTED_SECRET/
```

**Токен приложения:**
```
REDACTED_SECRET
```

**Настройте в .env:**
```env
BITRIX24_URL=https://your-portal.bitrix24.by/rest/1/REDACTED_SECRET/
BITRIX24_WEBHOOK_TOKEN=REDACTED_SECRET
```

## Структура вебхука

### Входящие данные

Вебхук получает JSON с следующей структурой:

```json
{
  "event": "OnCrmTimelineCommentAdd",
  "data": {
    "FIELDS": {
      "ID": "123",
      "TITLE": "Запрос в поддержку: Проблема с авторизацией",
      "STAGE_ID": "DT1038_11:NEW"
    },
    "ITEM": {
      "ID": "123",
      "TITLE": "Запрос в поддержку: Проблема с авторизацией"
    }
  },
  "ts": "1640995200"
}
```

### Обработка вебхука

1. **Извлечение ID смарт-процесса**: Система извлекает ID из `data.FIELDS.ID` или `data.ITEM.ID`
2. **Поиск тикета**: Ищет тикет в БД по `bitrix24_ticket_id`
3. **Получение комментария**: Запрашивает последний комментарий из смарт-процесса
4. **Обновление БД**: Добавляет комментарий в массив `messages` и меняет статус на "Новый ответ"

## API эндпоинты

### POST /api/bitrix24/webhook
**Описание**: Прием входящих вебхуков от Bitrix24

**Тело запроса**:
```json
{
  "event": "OnCrmTimelineCommentAdd",
  "data": {
    "FIELDS": {
      "ID": "123"
    }
  }
}
```

**Ответ**:
```json
{
  "success": true,
  "message": "Вебхук обработан успешно",
  "ticketId": "uuid-ticket-id",
  "messageAdded": true
}
```

### POST /api/bitrix24/support/mark-viewed
**Описание**: Отметить тикет как просмотренный пользователем

**Заголовки**: `Authorization: Bearer <token>`

**Тело запроса**:
```json
{
  "ticketId": "uuid-ticket-id"
}
```

**Ответ**:
```json
{
  "success": true,
  "message": "Тикет отмечен как просмотренный",
  "ticket": {
    "id": "uuid-ticket-id",
    "status": "Открыто"
  }
}
```

## Статусы тикетов

### Основной статус (колонка `status`):
- **Открыто** - тикет открыт
- **Закрыто** - тикет закрыт пользователем
- **В обработке** - тикет в работе у поддержки

### Статус новых ответов (колонка `status_new`):
- **Новый ответ** - есть новый ответ от поддержки (не просмотрен пользователем)
- **Просмотрен** - новый ответ просмотрен пользователем
- **NULL** - нет новых ответов

## Логика работы

### 1. Создание тикета пользователем
- Пользователь создает тикет через `/api/bitrix24/support`
- Система создает смарт-процесс в Bitrix24
- Сохраняет тикет в БД со статусом "Открыто"

### 2. Ответ поддержки
- Сотрудник поддержки добавляет комментарий в Bitrix24
- Bitrix24 отправляет вебхук на наш сервер
- Система получает комментарий и обновляет тикет
- `status_new` меняется на "Новый ответ"
- Основной `status` остается без изменений

### 3. Просмотр пользователем
- Пользователь открывает тикет на сайте
- Система автоматически вызывает `/api/bitrix24/support/mark-viewed`
- `status_new` меняется на "Просмотрен"
- Основной `status` остается без изменений

## Безопасность

1. **Валидация данных**: Все входящие данные проходят валидацию через Zod схемы
2. **Проверка источника**: Рекомендуется добавить проверку подписи вебхука
3. **Логирование**: Все операции логируются для отладки

## Отладка

### Логи
Все операции вебхуков логируются с префиксом `[WEBHOOK SERVICE]`:

```
🔍 [WEBHOOK SERVICE] ===== PROCESSING WEBHOOK =====
🔍 [WEBHOOK SERVICE] Smart process ID: 123
✅ [WEBHOOK SERVICE] Ticket updated successfully
```

### Тестирование
Для тестирования можно отправить POST запрос на `/api/bitrix24/webhook` с тестовыми данными:

```bash
curl -X POST https://your-domain.com/api/bitrix24/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "OnCrmTimelineCommentAdd",
    "data": {
      "FIELDS": {
        "ID": "123"
      }
    }
  }'
```

## Исходящие вебхуки

Система также поддерживает отправку исходящих вебхуков в Bitrix24:

### Пример использования

```typescript
import { Bitrix24Service } from './bitrix24.service';

const bitrix24Service = new Bitrix24Service();

// Отправка уведомления в Bitrix24
const result = await bitrix24Service.sendOutgoingWebhook({
  method: 'crm.timeline.comment.add',
  params: {
    fields: {
      ENTITY_TYPE: 'DYNAMIC_1038',
      ENTITY_ID: '123',
      COMMENT: 'Автоматическое уведомление от системы'
    }
  }
});
```

### Настройка исходящих вебхуков

1. **Получите токен приложения** в Bitrix24
2. **Добавьте в .env**:
   ```env
   BITRIX24_WEBHOOK_TOKEN=REDACTED_SECRET
   ```
3. **Используйте в коде**:
   ```typescript
   const bitrix24Service = new Bitrix24Service();
   await bitrix24Service.sendOutgoingWebhook(data);
   ```

## Использование на фронтенде

### Отображение индикатора новых ответов

```typescript
// Проверка наличия новых ответов
const hasNewResponse = ticket.status_new === 'Новый ответ';

// Отображение индикатора
if (hasNewResponse) {
  // Показать красную точку или другой индикатор
  showNewResponseIndicator();
}
```

### Автоматическая отметка как просмотренный

```typescript
// При открытии тикета пользователем
const markAsViewed = async (ticketId: string) => {
  await fetch('/api/bitrix24/support/mark-viewed', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ticketId })
  });
};
```

### Структура ответа API

```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "subject": "Тема тикета",
    "status": "Открыто",
    "status_new": "Новый ответ",
    "messages": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Мониторинг

Рекомендуется настроить мониторинг:
1. **Успешность обработки вебхуков**
2. **Время отклика API**
3. **Количество ошибок**
4. **Статистика по статусам тикетов**
5. **Количество непросмотренных ответов** (`status_new = 'Новый ответ'`)
