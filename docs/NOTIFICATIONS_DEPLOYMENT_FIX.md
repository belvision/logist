# Исправление проблемы с уведомлениями на продакшене

## 🚨 Проблема
Страница `/notifications` возвращает 404 ошибку на продакшене, хотя локально работает корректно.

## 🔍 Причина
Таблица `notifications` и связанные с ней таблицы не существуют в базе данных на продакшене. API endpoints для уведомлений не могут работать без соответствующих таблиц в БД.

## ✅ Решение

### 1. Создана миграция для таблиц уведомлений
Файл: `apps/backend/drizzle/0002_add_notifications.sql`

Создает:
- Enum `notification_type` с типами уведомлений
- Enum `notification_priority` с приоритетами
- Таблицу `notifications` для хранения уведомлений
- Таблицу `notification_settings` для настроек пользователей
- Индексы для оптимизации запросов
- Внешние ключи для связи с таблицей `users`

### 2. Обновлен журнал миграций
Файл: `apps/backend/drizzle/meta/_journal.json`

Добавлена запись о новой миграции `0002_add_notifications`.

## 🚀 Инструкции по развертыванию

### На продакшене выполните:

1. **Скопируйте файлы миграции:**
   ```bash
   # Скопировать миграцию
   scp apps/backend/drizzle/0002_add_notifications.sql user@server:/path/to/backend/drizzle/
   
   # Скопировать обновленный журнал
   scp apps/backend/drizzle/meta/_journal.json user@server:/path/to/backend/drizzle/meta/
   ```

2. **Примените миграцию к базе данных:**
   ```bash
   # Подключитесь к серверу
   ssh user@server
   
   # Перейдите в папку бэкенда
   cd /path/to/backend
   
   # Примените миграцию
   psql $DATABASE_URL -f drizzle/0002_add_notifications.sql
   ```

3. **Перезапустите бэкенд:**
   ```bash
   # Если используете PM2
   pm2 restart backend
   
   # Или если используете systemd
   sudo systemctl restart your-backend-service
   ```

4. **Проверьте работу:**
   - Откройте `https://logistgo.pro/notifications`
   - Страница должна загружаться без 404 ошибки
   - API endpoints `/api/notifications/*` должны работать

## 🔧 Альтернативный способ (через Drizzle CLI)

Если на продакшене установлен Drizzle CLI:

```bash
# На продакшене
cd /path/to/backend
npx drizzle-kit push
```

## 📋 Проверка

После применения миграции проверьте:

1. **Таблицы созданы:**
   ```sql
   \dt notifications
   \dt notification_settings
   ```

2. **API работает:**
   ```bash
   curl -H "Authorization: Bearer $ACCESS_TOKEN" \
        https://logistgo.pro/api/notifications/unread-count
   ```

3. **Страница загружается:**
   - Откройте `https://logistgo.pro/notifications`
   - Должна загружаться без ошибок

## 🎯 Результат

После применения миграции:
- ✅ Страница `/notifications` будет доступна на продакшене
- ✅ API endpoints для уведомлений будут работать
- ✅ Пользователи смогут просматривать и управлять уведомлениями
- ✅ WebSocket уведомления будут сохраняться в БД

## 📝 Примечания

- Миграция безопасна и не влияет на существующие данные
- Создаются только новые таблицы и индексы
- Внешние ключи обеспечивают целостность данных
- Индексы оптимизируют производительность запросов
