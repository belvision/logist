# Система уведомлений LogisticPro

## Обзор

Полноценная система уведомлений для платформы LogisticPro с поддержкой различных типов уведомлений, приоритетов и каналов доставки.

## Возможности

### ✅ Реализовано

1. **Backend API**
   - Создание уведомлений
   - Получение списка уведомлений с фильтрацией
   - Отметка уведомлений как прочитанных
   - Удаление уведомлений
   - Настройки уведомлений для пользователей

2. **Frontend UI**
   - NotificationCenter (компонент колокольчика в шапке)
   - Страница просмотра всех уведомлений
   - Страница настроек уведомлений
   - Zustand store для управления состоянием

3. **Интеграция**
   - Автоматические уведомления при создании/обновлении грузов
   - Уведомления для всех пользователей компании

4. **Типы уведомлений**
   - `cargo_created` - Создан новый груз
   - `cargo_updated` - Груз обновлен
   - `cargo_deleted` - Груз удален
   - `car_created` - Добавлен новый автомобиль
   - `car_updated` - Автомобиль обновлен
   - `route_match` - Найден подходящий маршрут
   - `cargo_match` - Найден подходящий груз
   - `support_reply` - Ответ в тикете поддержки
   - `support_closed` - Тикет поддержки закрыт
   - `company_invite` - Приглашение в компанию
   - `user_added` - Пользователь добавлен в компанию
   - `user_removed` - Пользователь удален из компании
   - `role_changed` - Изменена роль в компании
   - `system` - Системное уведомление

5. **Приоритеты**
   - `low` - Низкий приоритет
   - `medium` - Средний приоритет
   - `high` - Высокий приоритет
   - `urgent` - Срочное

## Структура базы данных

### Таблица `notifications`

```typescript
{
  id_notification: uuid (PK)
  id_user: uuid (FK -> users)
  type: enum (notification_type)
  priority: enum (notification_priority)
  title: string
  message: string
  metadata: jsonb {
    cargo_id?: number
    car_id?: number
    route_id?: number
    company_id?: string
    ticket_id?: string
    link?: string
    [key: string]: any
  }
  is_read: boolean
  read_at: timestamp
  created_at: timestamp
}
```

### Таблица `notification_settings`

```typescript
{
  id_setting: uuid (PK)
  id_user: uuid (FK -> users, unique)
  
  // Email уведомления
  email_cargo_created: boolean
  email_cargo_match: boolean
  email_route_match: boolean
  email_support_reply: boolean
  email_company_invite: boolean
  
  // In-app уведомления
  inapp_cargo_created: boolean
  inapp_cargo_match: boolean
  inapp_route_match: boolean
  inapp_support_reply: boolean
  inapp_company_invite: boolean
  inapp_system: boolean
  
  // Telegram уведомления (будущее)
  telegram_enabled: boolean
  telegram_chat_id: string
  
  created_at: timestamp
  updated_at: timestamp
}
```

## API Endpoints

### Получить уведомления
```
GET /api/notifications
Query params:
  - limit?: number (default: 50)
  - offset?: number (default: 0)
  - unread_only?: boolean
  - type?: notification_type
```

### Получить количество непрочитанных
```
GET /api/notifications/unread-count
Response: { count: number }
```

### Отметить уведомления как прочитанные
```
POST /api/notifications/mark-read
Body: {
  notification_ids: string[]
}
```

### Отметить все как прочитанные
```
POST /api/notifications/mark-all-read
```

### Удалить уведомление
```
DELETE /api/notifications/:id
```

### Удалить все прочитанные
```
DELETE /api/notifications/read/all
```

### Получить настройки уведомлений
```
GET /api/notifications/settings
```

### Обновить настройки уведомлений
```
PUT /api/notifications/settings
Body: Partial<NotificationSettings>
```

## Использование в коде

### Backend: Отправка уведомления одному пользователю

```typescript
import { notifyUser } from '../notifications/notifications.service';

await notifyUser(
  userId,
  'cargo_created',
  'Создан новый груз',
  'Груз из Минска в Москву',
  {
    cargo_id: 123,
    company_id: 'uuid',
    link: '/company/uuid/cargo',
  },
  'medium'
);
```

### Backend: Отправка уведомления всем пользователям компании

```typescript
import { notifyCompanyUsers } from '../notifications/notifications.service';

await notifyCompanyUsers(
  companyId,
  'user_added',
  'Новый пользователь в команде',
  'В команду добавлен новый пользователь',
  {
    user_id: 'uuid',
    link: '/company/uuid/team',
  },
  'low'
);
```

### Backend: Уведомление ДРУГИХ компаний о новом грузе

```typescript
import { notifyOtherCompaniesAboutCargo } from '../notifications/notifications.service';

await notifyOtherCompaniesAboutCargo(
  excludeCompanyId, // Не отправлять этой компании
  cargo,
  {
    cargo_id: 123,
    departure_point: 'Минск',
    arrival_point: 'Москва',
    tonn: 20,
    m3: 40,
    date_start: new Date(),
    date_end: new Date(),
  }
);
```

### Frontend: Использование NotificationCenter

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// В компоненте Header/Sidebar
<NotificationCenter />
```

### Frontend: Использование store

```tsx
import { useNotificationStore } from '@/store/notificationStore';

const {
  notifications,
  unreadCount,
  fetchNotifications,
  markAsRead,
} = useNotificationStore();

// Загрузить уведомления
await fetchNotifications({ unread_only: true });

// Отметить как прочитанное
await markAsRead(['notification-id']);
```

## Миграция базы данных

После внесения изменений в схему выполните:

```bash
cd apps/backend

# Сгенерировать миграции
npm run db:generate

# Применить миграции
npm run db:migrate
```

## Настройка

### Backend (.env)

```env
# SMTP для email уведомлений (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@logisticpro.com
```

## Roadmap

### Планируется добавить:

1. **WebSocket/SSE для real-time уведомлений**
   - Мгновенное получение уведомлений без перезагрузки
   - Использование Socket.io или Server-Sent Events

2. **Email уведомления**
   - Отправка уведомлений на почту (используя существующую SMTP настройку)
   - Настройка частоты email (мгновенно, дайджест раз в день)

3. **Telegram бот**
   - Интеграция с Telegram Bot API
   - Отправка уведомлений в Telegram
   - Управление подпиской через бота

4. **Умные уведомления**
   - ML-алгоритм для подбора подходящих грузов/маршрутов
   - Уведомления о грузах, максимально подходящих под параметры перевозчика

5. **Push уведомления**
   - Web Push API для браузерных уведомлений
   - PWA поддержка

6. **Группировка уведомлений**
   - Объединение похожих уведомлений
   - "5 новых грузов по вашему маршруту"

7. **Snooze функция**
   - Отложить уведомление на время
   - Напомнить позже

## Тестирование

### Создание тестового уведомления

```bash
curl -X POST http://localhost:8080/api/notifications \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_user": "user-uuid",
    "type": "system",
    "priority": "high",
    "title": "Тестовое уведомление",
    "message": "Это тестовое уведомление для проверки системы",
    "metadata": {
      "link": "/notifications"
    }
  }'
```

## Производительность

- Индексы на `id_user` и `is_read` для быстрой выборки
- Периодическая очистка старых прочитанных уведомлений (рекомендуется через cronjob)
- Пагинация для больших списков

## Безопасность

- Все endpoints требуют авторизации
- Пользователь видит только свои уведомления
- XSS защита: все данные экранируются перед отображением
- Валидация данных через Zod schema

## Поддержка

При возникновении вопросов или проблем:
1. Проверьте логи backend (`console.log` в notifications.service.ts)
2. Проверьте настройки уведомлений в `/notifications/settings`
3. Убедитесь, что миграции применены
4. Проверьте JWT токен и права доступа

---

**Версия**: 1.0.0  
**Дата**: 2025-10-03  
**Автор**: LogisticPro Team

