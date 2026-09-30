# Руководство по установке ЭДО (Электронный документооборот)

## Быстрый старт

### 1. Установка зависимостей

```bash
# Backend
cd apps/backend
npm install

# Frontend (если нужно)
cd apps/frontend  
npm install
```

### 2. Миграция базы данных

```bash
cd apps/backend
npm run db:push
```

Эта команда создаст все необходимые таблицы:
- `documents` - основная таблица документов
- `document_templates` - шаблоны документов
- `document_signatures` - подписи
- `document_versions` - версии документов
- `document_access` - права доступа

### 3. Загрузка начальных шаблонов

```bash
cd apps/backend
npx tsx src/db/seed-documents.ts
```

Эта команда создаст системные шаблоны:
- Стандартная ТТН
- Международная накладная CMR
- Договор перевозки груза

### 4. Запуск сервера

```bash
# Backend
cd apps/backend
npm run dev

# Frontend
cd apps/frontend
npm run dev
```

## Доступ к функциям ЭДО

После запуска системы:

1. Войдите в систему
2. Перейдите в раздел компании
3. В меню появится раздел "Документы" по адресу:
   `http://localhost:3000/company/{company_id}/documents`

## API Endpoints

Все endpoints доступны по префиксу `/api/documents`:

### Документы
- `POST /api/documents` - создать документ
- `GET /api/documents` - список документов
- `GET /api/documents/:id` - получить документ
- `PUT /api/documents/:id` - обновить документ
- `DELETE /api/documents/:id` - удалить документ

### PDF
- `POST /api/documents/:id/generate-pdf` - сгенерировать PDF
- `GET /api/documents/:id/download` - скачать PDF

### Подписи
- `POST /api/documents/:id/sign` - подписать документ
- `GET /api/documents/:id/signatures` - список подписей
- `POST /api/documents/signatures/:signatureId/reject` - отклонить подпись

### Версии
- `GET /api/documents/:id/versions` - история версий
- `GET /api/documents/versions/:versionId` - конкретная версия

### Шаблоны
- `POST /api/documents/templates` - создать шаблон
- `GET /api/documents/templates` - список шаблонов
- `GET /api/documents/templates/:id` - получить шаблон
- `PUT /api/documents/templates/:id` - обновить шаблон
- `DELETE /api/documents/templates/:id` - удалить шаблон

## Тестирование через Swagger

API доступен через Swagger UI: `http://localhost:5000/docs`

## Возможности

✅ **Реализовано:**
- 8 типов документов (ТТН, CMR, Договор, Акт, Счёт, Счёт-фактура, Доверенность, Прочее)
- Система шаблонов с подстановкой данных
- PDF генерация (Puppeteer)
- Электронная подпись документов
- Версионирование
- Контроль доступа по ролям
- История изменений
- Связь с грузами, автомобилями, маршрутами

## Переменные окружения

Добавьте в `.env`:

```env
# Секретный ключ для электронной подписи
SIGNATURE_SECRET=your-secret-key-here
```

## Решение проблем

### Puppeteer не работает

Linux:
```bash
sudo apt-get install -y chromium-browser
```

MacOS/Windows: переустановите puppeteer:
```bash
npm install puppeteer --force
```

### Права доступа к файлам

```bash
mkdir -p uploads/documents
chmod 755 uploads/documents
```

### TypeScript ошибки

```bash
cd apps/backend
npm run type-check
```

## Следующие шаги

1. Добавьте ссылку на документы в навигацию компании
2. Настройте Email уведомления о новых документах
3. Интегрируйте с КриптоПро для квалифицированной ЭЦП (опционально)
4. Настройте backup системы для PDF файлов

## Дополнительная информация

Полная документация: `ELECTRONIC_DOCUMENT_MANAGEMENT.md`

## Поддержка

Если возникли проблемы:
1. Проверьте логи backend: `apps/backend/logs/`
2. Проверьте миграции: `apps/backend/drizzle/`
3. Проверьте права доступа к директории `uploads/`

---

**Готово!** Система ЭДО полностью функциональна и готова к использованию.

