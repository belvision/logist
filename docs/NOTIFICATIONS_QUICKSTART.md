# 🔔 Быстрый старт: Система уведомлений

## Шаг 1: Применить миграции базы данных

```bash
cd apps/backend

# Сгенерировать миграции из схемы
npm run db:generate

# Применить миграции к базе данных
npm run db:migrate
```

## Шаг 2: Перезапустить backend

```bash
# В директории apps/backend
npm run dev
```

## Шаг 3: Перезапустить frontend

```bash
# В директории apps/frontend
npm run dev
```

## Шаг 4: Проверить работу

1. Войдите в систему
2. В левом верхнем углу (в sidebar) появится иконка колокольчика 🔔
3. Создайте новый груз в `/company/{id}/cargo`
4. Вы увидите уведомление о создании груза

## Что было добавлено?

### Backend
- ✅ `/api/notifications` - API для управления уведомлениями
- ✅ Таблицы `notifications` и `notification_settings` в БД
- ✅ Автоматические уведомления при создании/обновлении грузов
- ✅ 14 типов уведомлений (cargo, cars, support, company, system)
- ✅ 4 уровня приоритета (low, medium, high, urgent)

### Frontend
- ✅ `NotificationCenter` - компонент колокольчика с всплывающей панелью
- ✅ `/notifications` - страница всех уведомлений
- ✅ `/notifications/settings` - настройки уведомлений
- ✅ Zustand store для управления состоянием
- ✅ Счетчик непрочитанных уведомлений

### Интеграция
- ✅ Уведомления интегрированы в модуль `cargo`
- ✅ Уведомления отправляются всем пользователям компании
- ✅ Поддержка метаданных (ссылки, ID сущностей)

## Структура файлов

```
apps/backend/src/api/notifications/
├── notifications.schema.ts       # Zod схемы валидации
├── notifications.repository.ts   # Работа с БД
├── notifications.service.ts      # Бизнес-логика
├── notifications.controller.ts   # HTTP handlers
└── notifications.router.ts       # Маршруты

apps/frontend/src/
├── components/notifications/
│   └── NotificationCenter.tsx    # Компонент колокольчика
├── store/
│   └── notificationStore.ts      # Zustand store
├── shared/api/
│   └── notifications.ts          # API клиент
└── app/notifications/
    ├── page.tsx                  # Страница всех уведомлений
    └── settings/page.tsx         # Страница настроек
```

## Как отправить уведомление из кода?

### Одному пользователю

```typescript
import { notifyUser } from '../notifications/notifications.service';

await notifyUser(
  userId,                          // ID пользователя
  'cargo_created',                 // Тип уведомления
  'Создан новый груз',             // Заголовок
  'Груз из Минска в Москву',       // Сообщение
  {                                // Метаданные (опционально)
    cargo_id: 123,
    link: '/company/uuid/cargo',
  },
  'medium'                         // Приоритет (опционально)
);
```

### Всем пользователям компании

```typescript
import { notifyCompanyUsers } from '../notifications/notifications.service';

await notifyCompanyUsers(
  companyId,
  'cargo_created',
  'Создан новый груз',
  'Груз из Минска в Москву',
  {
    cargo_id: 123,
    link: '/company/uuid/cargo',
  },
  'medium'
);
```

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/notifications` | Получить список уведомлений |
| GET | `/api/notifications/unread-count` | Количество непрочитанных |
| POST | `/api/notifications/mark-read` | Отметить как прочитанные |
| POST | `/api/notifications/mark-all-read` | Отметить все как прочитанные |
| DELETE | `/api/notifications/:id` | Удалить уведомление |
| DELETE | `/api/notifications/read/all` | Удалить все прочитанные |
| GET | `/api/notifications/settings` | Получить настройки |
| PUT | `/api/notifications/settings` | Обновить настройки |

## Типы уведомлений

```typescript
type NotificationType =
  | 'cargo_created'      // Создан груз
  | 'cargo_updated'      // Груз обновлен
  | 'cargo_deleted'      // Груз удален
  | 'car_created'        // Добавлен автомобиль
  | 'car_updated'        // Автомобиль обновлен
  | 'route_match'        // Найден подходящий маршрут
  | 'cargo_match'        // Найден подходящий груз
  | 'support_reply'      // Ответ в поддержке
  | 'support_closed'     // Тикет закрыт
  | 'company_invite'     // Приглашение в компанию
  | 'user_added'         // Пользователь добавлен
  | 'user_removed'       // Пользователь удален
  | 'role_changed'       // Роль изменена
  | 'system';            // Системное
```

## Где добавить уведомления?

Рекомендуется добавить уведомления в следующие места:

1. **Cars module** (`apps/backend/src/api/cars/cars.service.ts`)
   - При создании автомобиля: `car_created`
   - При обновлении: `car_updated`

2. **Support module** (`apps/backend/src/api/support/support.service.ts`)
   - При ответе поддержки: `support_reply`
   - При закрытии тикета: `support_closed`

3. **Company module** (`apps/backend/src/api/company/company.service.ts`)
   - При добавлении пользователя: `user_added`
   - При удалении: `user_removed`
   - При изменении роли: `role_changed`

4. **Matching system** (будущее)
   - При нахождении подходящего груза: `cargo_match`
   - При нахождении подходящего маршрута: `route_match`

## Настройки уведомлений

Пользователи могут настроить:
- Email уведомления (per type)
- In-app уведомления (per type)
- Telegram уведомления (будущее)

Страница настроек: `/notifications/settings`

## Troubleshooting

### Уведомления не появляются?

1. Проверьте, что миграции применены:
   ```bash
   npm run db:check
   ```

2. Проверьте логи backend при создании груза:
   ```
   console.log в cargo.service.ts
   ```

3. Проверьте настройки уведомлений:
   ```
   GET /api/notifications/settings
   ```

4. Проверьте, что пользователь авторизован и JWT валиден

### Счетчик не обновляется?

NotificationCenter обновляет счетчик каждые 30 секунд автоматически.
Также обновляется при открытии панели уведомлений.

### Ошибка при применении миграций?

Убедитесь, что:
1. PostgreSQL запущен
2. `DATABASE_URL` в `.env` корректный
3. База данных существует
4. У пользователя БД есть права на создание таблиц

## Что дальше?

См. `NOTIFICATIONS_SYSTEM.md` для:
- Подробной документации API
- Roadmap будущих функций
- Примеров использования
- Настройки email и Telegram

---

**Готово!** Система уведомлений полностью функциональна и готова к использованию! 🎉

