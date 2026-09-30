# Электронный документооборот (ЭДО) - Документация

## Обзор

Система электронного документооборота для LogistGo.pro обеспечивает полный цикл создания, управления и подписания транспортных документов.

## Возможности

### ✅ Реализовано

1. **Типы документов**
   - ТТН (Товарно-транспортная накладная)
   - CMR (Международная накладная)
   - Договор перевозки
   - Акт выполненных работ
   - Счёт на оплату
   - Счёт-фактура
   - Доверенность
   - Прочие документы

2. **Управление документами**
   - Создание документов с гибкими полями данных
   - Редактирование черновиков
   - Удаление документов
   - Поиск по названию, номеру, описанию
   - Фильтрация по типу и статусу
   - Пагинация списка документов

3. **Система шаблонов**
   - Предустановленные системные шаблоны
   - Создание пользовательских шаблонов
   - HTML шаблоны с CSS стилями
   - Подстановка данных через плейсхолдеры `{{field_name}}`
   - Условные блоки `{{#if field}}...{{/if}}`
   - Циклы `{{#each items}}...{{/each}}`
   - Форматирование дат, чисел, валюты
   - Валидация синтаксиса шаблонов

4. **PDF генерация**
   - Автоматическая генерация PDF из шаблонов
   - Использование Puppeteer для рендеринга
   - Сохранение PDF файлов на сервере
   - Скачивание PDF документов
   - Контрольные суммы файлов

5. **Электронная подпись**
   - Подписание документов пользователями
   - Указание роли подписанта
   - Комментарии к подписи
   - История подписей
   - Статусы: Ожидает, Подписан, Отклонён
   - IP адрес при подписании
   - Генерация электронной подписи (HMAC SHA256)

6. **Версионирование**
   - Автоматическое создание версий при изменении
   - История всех версий документа
   - Комментарии к изменениям
   - Хранение PDF для каждой версии

7. **Контроль доступа**
   - Роли: Владелец, Администратор, Пользователь
   - Разграничение прав: просмотр, редактирование, удаление, подпись
   - Предоставление доступа другим пользователям/компаниям
   - Проверка прав при каждой операции

8. **Связь с другими сущностями**
   - Привязка к грузам (cargo)
   - Привязка к автомобилям (cars)
   - Привязка к маршрутам (routes)
   - Указание контрагентов

9. **Статусы документов**
   - Черновик - в процессе создания
   - Ожидает подписи - готов к подписанию
   - Подписан - все стороны подписали
   - Отменён - отменен
   - Архив - помещен в архив

## Архитектура

### Backend (Node.js + Hono + PostgreSQL)

#### Структура файлов
```
apps/backend/src/
├── api/documents/
│   ├── documents.controller.ts    # HTTP контроллеры
│   ├── documents.repository.ts    # Работа с БД
│   ├── documents.router.ts        # Маршруты API
│   ├── documents.schema.ts        # Zod схемы валидации
│   ├── documents.service.ts       # Бизнес-логика
│   └── documents.types.ts         # TypeScript типы
├── lib/
│   ├── pdfGenerator.ts            # Генерация PDF (Puppeteer)
│   ├── templateRenderer.ts        # Рендеринг шаблонов
│   └── signatureService.ts        # Электронная подпись
└── db/
    ├── schema/schema.ts            # Drizzle ORM схема
    └── seed-documents.ts           # Начальные шаблоны
```

#### База данных

**Таблицы:**

1. `documents` - основная таблица документов
   - id_document (UUID)
   - document_type (enum)
   - document_number
   - document_date
   - status (enum)
   - id_company (FK)
   - created_by (FK)
   - title, description
   - related_cargo_id, related_car_id, related_route_id
   - counterparty_*
   - document_data (JSONB)
   - template_id (FK)
   - version
   - pdf_file_path
   - metadata (JSONB)
   - timestamps

2. `document_templates` - шаблоны документов
   - id_template (UUID)
   - document_type
   - name, description
   - html_template, css_styles
   - id_company (FK, nullable для системных)
   - is_active, is_system
   - fields (JSONB)
   - timestamps

3. `document_signatures` - подписи документов
   - id_signature (UUID)
   - id_document (FK)
   - id_user (FK)
   - signer_role
   - signature_status (enum)
   - signature_data
   - signature_ip
   - comment
   - signed_at, rejected_at
   - timestamps

4. `document_versions` - версии документов
   - id_version (UUID)
   - id_document (FK)
   - version
   - document_data (JSONB)
   - pdf_file_path
   - created_by (FK)
   - change_comment
   - created_at

5. `document_access` - права доступа
   - id_access (UUID)
   - id_document (FK)
   - id_user (FK, nullable)
   - id_company (FK, nullable)
   - can_view, can_edit, can_delete, can_sign
   - granted_by (FK)
   - timestamps

#### API Endpoints

**Документы:**
- `POST /api/documents` - создать документ
- `GET /api/documents` - список документов (с фильтрами)
- `GET /api/documents/:id` - получить документ
- `PUT /api/documents/:id` - обновить документ
- `DELETE /api/documents/:id` - удалить документ

**PDF:**
- `POST /api/documents/:id/generate-pdf` - сгенерировать PDF
- `GET /api/documents/:id/download` - скачать PDF

**Подписи:**
- `POST /api/documents/:id/sign` - подписать документ
- `GET /api/documents/:id/signatures` - список подписей
- `POST /api/documents/signatures/:signatureId/reject` - отклонить подпись

**Версии:**
- `GET /api/documents/:id/versions` - история версий
- `GET /api/documents/versions/:versionId` - конкретная версия

**Доступ:**
- `POST /api/documents/:id/access` - предоставить доступ
- `GET /api/documents/:id/access` - список доступа
- `DELETE /api/documents/access/:accessId` - отозвать доступ

**Шаблоны:**
- `POST /api/documents/templates` - создать шаблон
- `GET /api/documents/templates` - список шаблонов
- `GET /api/documents/templates/:id` - получить шаблон
- `PUT /api/documents/templates/:id` - обновить шаблон
- `DELETE /api/documents/templates/:id` - удалить шаблон

### Frontend (Next.js + React + TypeScript)

#### Структура файлов
```
apps/frontend/src/
├── app/company/[company_id]/documents/
│   └── page.tsx                    # Главная страница документов
├── components/documents/
│   ├── CreateDocumentDialog.tsx    # Создание документа
│   ├── DocumentDetailDialog.tsx    # Детали документа
│   └── SignDocumentDialog.tsx      # Подписание документа
└── shared/api/
    └── documents.api.ts            # API клиент
```

#### Компоненты

1. **DocumentsPage** - главная страница
   - Список документов в виде таблицы
   - Фильтры: тип, статус, поиск
   - Пагинация
   - Действия: просмотр, скачать PDF, удалить

2. **CreateDocumentDialog** - создание документа
   - Выбор типа документа
   - Выбор шаблона
   - Динамические поля на основе шаблона
   - Информация о контрагенте

3. **DocumentDetailDialog** - детальный просмотр
   - Вкладки: Информация, Подписи, Версии, Данные
   - История подписей с пользователями
   - История версий
   - Генерация и скачивание PDF

4. **SignDocumentDialog** - подписание
   - Указание роли подписанта
   - Комментарий к подписи
   - Подтверждение действия

## Использование

### 1. Миграция базы данных

```bash
cd apps/backend
npm run db:push
```

### 2. Заполнение шаблонами

```bash
cd apps/backend
npx tsx src/db/seed-documents.ts
```

### 3. Создание документа

```typescript
const document = await documentsApi.createDocument({
  document_type: 'ТТН',
  document_number: 'TTN-2024-001',
  document_date: '2024-01-15',
  title: 'ТТН на перевозку груза до Минска',
  template_id: 'template-uuid',
  counterparty_name: 'ООО "Грузоперевозки"',
  counterparty_unp: '123456789',
  document_data: {
    cargo_name: 'Строительные материалы',
    cargo_weight: 15.5,
    cargo_volume: 20,
    loading_address: 'г. Москва, ул. Ленина 1',
    unloading_address: 'г. Минск, пр. Независимости 10',
    driver_name: 'Иванов Иван Иванович',
    vehicle_number: 'А123БВ177',
  },
});
```

### 4. Генерация PDF

```typescript
await documentsApi.generatePdf(documentId);
const pdfBlob = await documentsApi.downloadPdf(documentId);
```

### 5. Подписание документа

```typescript
await documentsApi.signDocument(documentId, {
  signer_role: 'Директор',
  comment: 'Согласовано',
});
```

### 6. Создание шаблона

```typescript
const template = await documentsApi.createTemplate({
  document_type: 'Договор',
  name: 'Договор перевозки v2',
  html_template: `
    <div>
      <h1>{{title}}</h1>
      <p>Номер: {{document_number}}</p>
      <p>Дата: {{formatDate document_date}}</p>
      
      {{#if cargo_name}}
      <p>Груз: {{cargo_name}}</p>
      {{/if}}
    </div>
  `,
  fields: [
    { name: 'cargo_name', label: 'Название груза', type: 'text', required: true },
    { name: 'price', label: 'Стоимость', type: 'number', required: true },
  ],
});
```

## Система шаблонов

### Синтаксис

**Переменные:**
```html
{{field_name}}
{{nested.field}}
```

**Условия:**
```html
{{#if field}}
  Показать если field истинно
{{/if}}

{{#unless field}}
  Показать если field ложно
{{/unless}}
```

**Циклы:**
```html
{{#each items}}
  <li>{{this}}</li>
  <li>{{@index}}</li>
  <li>{{item.name}}</li>
{{/each}}
```

**Форматирование:**
```html
{{formatDate document_date}}      <!-- 15.01.2024 -->
{{formatNumber cargo_weight}}     <!-- 15 500 -->
{{formatCurrency price}}          <!-- 1 500,00 руб. -->
```

### Стандартные поля

Все шаблоны имеют доступ к:
- `document_number` - номер документа
- `document_date` - дата документа
- `title` - название
- `description` - описание
- `counterparty_name` - контрагент
- `counterparty_unp` - УНП контрагента
- `counterparty_address` - адрес контрагента
- Все поля из `document_data`

## Электронная подпись

### Алгоритм

1. Вычисляется контрольная сумма документа (SHA256)
2. Создается строка: `documentId|userId|timestamp|checksum`
3. Генерируется HMAC подпись с использованием секретного ключа
4. Подпись сохраняется в base64 формате

### Верификация

```typescript
const isValid = signatureService.verifySignature(
  signature,
  {
    documentId,
    userId,
    timestamp,
    documentChecksum,
  },
  privateKey
);
```

**Примечание:** В production рекомендуется использовать сертифицированные средства ЭЦП (например, КриптоПро).

## Безопасность

1. **Аутентификация** - все endpoints требуют JWT токен
2. **Авторизация** - проверка прав на каждую операцию
3. **Роли** - Владелец, Администратор, Пользователь
4. **Валидация** - Zod схемы для всех входных данных
5. **Sanitization** - очистка HTML в описаниях
6. **IP Logging** - запись IP при подписании
7. **Версионирование** - невозможность изменить историю

## Производительность

1. **Индексы БД** - на часто используемых полях
2. **Пагинация** - лимит 20 документов на страницу
3. **Lazy Loading** - подписи и версии загружаются по требованию
4. **PDF Cache** - сохранение сгенерированных PDF
5. **Blob Storage** - рекомендуется для production (S3, MinIO)

## Расширение функциональности

### Добавление нового типа документа

1. Добавить в enum `documentTypeEnum` в `schema.ts`
2. Создать шаблон в `seed-documents.ts`
3. Обновить frontend типы в `documents.api.ts`

### Интеграция с внешними системами

```typescript
// Пример webhook при подписании
export async function onDocumentSigned(document: Document) {
  await axios.post('https://external-system.com/webhook', {
    event: 'document.signed',
    document_id: document.id_document,
    document_number: document.document_number,
  });
}
```

### Экспорт в другие форматы

```typescript
// Word, Excel и т.д.
import { Document } from 'docx';

export async function exportToWord(documentId: string) {
  const doc = await documentsService.getDocument(documentId);
  // ... генерация Word документа
}
```

## Тестирование

```bash
# Backend тесты
cd apps/backend
npm run test

# Frontend тесты
cd apps/frontend
npm run test
```

## Развертывание

```bash
# 1. Миграция БД
npm run db:push

# 2. Seed шаблонов
npx tsx src/db/seed-documents.ts

# 3. Сборка backend
npm run build

# 4. Запуск backend
npm start

# 5. Сборка frontend
cd ../frontend
npm run build

# 6. Запуск frontend
npm start
```

## Troubleshooting

### PDF не генерируется

Убедитесь, что Puppeteer корректно установлен:
```bash
npm install puppeteer --force
```

На Linux может потребоваться установка зависимостей:
```bash
apt-get install -y chromium-browser
```

### Ошибки подписи

Проверьте переменную окружения `SIGNATURE_SECRET` в `.env`:
```
SIGNATURE_SECRET=your-secret-key-here
```

### Права доступа к файлам

Убедитесь, что директория `uploads/documents` существует и доступна для записи:
```bash
mkdir -p uploads/documents
chmod 755 uploads/documents
```

## Roadmap

- [ ] Интеграция с КриптоПро для квалифицированной ЭЦП
- [ ] Массовое подписание документов
- [ ] Email уведомления о новых документах
- [ ] Экспорт в Word, Excel
- [ ] OCR для сканированных документов
- [ ] Мобильное приложение
- [ ] Интеграция с 1С
- [ ] Blockchain для неизменяемости подписей

## Лицензия

Проприетарное ПО © 2024 LogistGo.pro

## Поддержка

Для вопросов и поддержки: support@logistgo.pro

