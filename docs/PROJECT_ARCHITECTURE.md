# 🏗️ Архитектура проекта LogistPro

> **Техническая документация архитектуры и структуры проекта**

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Монорепозиторий](#монорепозиторий)
3. [Backend архитектура](#backend-архитектура)
4. [Frontend архитектура](#frontend-архитектура)
5. [База данных](#база-данных)
6. [API структура](#api-структура)
7. [Интеграции](#интеграции)
8. [Безопасность](#безопасность)
9. [Производительность](#производительность)
10. [Мониторинг](#мониторинг)

---

## 🎯 Обзор архитектуры

LogistPro построен как **монорепозиторий** с четким разделением на frontend и backend приложения, использующий современный стек технологий для обеспечения масштабируемости, производительности и удобства разработки.

### Архитектурные принципы

- **Модульность**: Каждый компонент имеет четко определенные границы
- **Типобезопасность**: Строгая типизация TypeScript на всех уровнях
- **API-First**: Backend предоставляет RESTful API
- **Компонентность**: Frontend построен на переиспользуемых компонентах
- **Безопасность**: Многоуровневая система аутентификации и авторизации

---

## 📦 Монорепозиторий

### Структура workspace

```
logistPro/
├── apps/                          # Приложения
│   ├── frontend/                  # Next.js приложение
│   └── backend/                   # Hono API сервер
├── package.json                   # Workspace конфигурация
├── turbo.json                    # Turbo конфигурация
├── tsconfig.json                 # Корневая TypeScript конфигурация
└── ecosystem.config.js           # PM2 конфигурация
```

### Turbo конфигурация

```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

### Workspace зависимости

- **Корневой package.json**: Общие dev-зависимости (TypeScript, Prettier, Turbo)
- **apps/frontend/package.json**: Frontend зависимости (Next.js, React, UI библиотеки)
- **apps/backend/package.json**: Backend зависимости (Hono, Drizzle, PostgreSQL)

---

## 🔧 Backend архитектура

### Общая структура

```
apps/backend/src/
├── api/                          # API модули
│   ├── auth/                     # Аутентификация и авторизация
│   ├── company/                  # Управление компаниями
│   ├── cargo/                    # Грузы
│   ├── cars/                     # Автомобили
│   ├── routes/                   # Маршруты
│   ├── support/                  # Система поддержки
│   ├── bitrix24/                 # Интеграция с Bitrix24
│   ├── nominatim/                # Геокодирование
│   ├── osrm/                     # Маршрутизация
│   ├── middleware/               # Middleware
│   └── index.ts                  # Главный файл API
├── db/                          # База данных
│   ├── schema/                  # Схемы Drizzle
│   ├── config.ts                # Конфигурация БД
│   ├── client.ts                # Клиент БД
│   └── createDatabase.ts        # Создание БД
├── lib/                         # Утилиты
│   ├── websocket.ts             # WebSocket менеджер
│   ├── rateLimiter.ts           # Rate limiting
│   ├── password.ts              # Хеширование паролей
│   ├── recaptcha.ts             # reCAPTCHA
│   └── sanitizer.ts             # Санитизация данных
├── core/                        # Ядро приложения
│   └── auth/                    # Аутентификация
└── types/                       # Общие типы
```

### API модуль (паттерн)

Каждый API модуль следует единому паттерну:

```
src/api/feature/
├── feature.controller.ts         # HTTP handlers (Hono Context)
├── feature.service.ts            # Business logic
├── feature.repository.ts         # Database operations
├── feature.router.ts             # Route definitions
├── feature.schema.ts             # Zod validation schemas
└── feature.types.ts              # TypeScript types
```

### Слои архитектуры

1. **Controller Layer** - Обработка HTTP запросов
2. **Service Layer** - Бизнес-логика
3. **Repository Layer** - Работа с базой данных
4. **Schema Layer** - Валидация данных

### Middleware

- **CORS**: Настройка cross-origin запросов
- **Authentication**: JWT токены и MFA
- **Rate Limiting**: Защита от DDoS
- **Validation**: Zod схемы
- **Error Handling**: Централизованная обработка ошибок

---

## 🎨 Frontend архитектура

### Общая структура

```
apps/frontend/src/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Группа страниц аутентификации
│   │   ├── login/              # Вход
│   │   └── registry/           # Регистрация
│   ├── company/                # Страницы компаний
│   │   └── [company_id]/       # Динамические страницы компании
│   ├── cargo-search/           # Поиск грузов
│   ├── car-search/             # Поиск автомобилей
│   ├── support/                # Поддержка
│   ├── globals.css             # Глобальные стили
│   ├── layout.tsx              # Корневой layout
│   └── page.tsx                # Главная страница
├── components/                 # React компоненты
│   ├── ui/                     # Базовые UI компоненты
│   ├── auth/                   # Компоненты аутентификации
│   ├── cargo/                  # Компоненты грузов
│   ├── cars/                   # Компоненты автомобилей
│   ├── company/                # Компоненты компаний
│   ├── layout/                 # Компоненты макета
│   ├── seo/                    # SEO компоненты
│   └── support/                # Компоненты поддержки
├── shared/                     # Общие модули
│   ├── api/                    # API клиенты
│   ├── hooks/                  # React хуки
│   └── context/                # React контексты
├── lib/                        # Утилиты
│   ├── config.ts               # Конфигурация
│   ├── utils.ts                # Общие утилиты
│   ├── toast.ts                # Уведомления
│   └── analytics.ts            # Аналитика
├── store/                      # State management
│   ├── index.ts                # Главный store
│   └── company-store.ts        # Store компаний
├── types/                      # TypeScript типы
└── widgets/                    # Виджеты
```

### App Router структура

- **Route Groups**: `(auth)` для группировки страниц
- **Dynamic Routes**: `[company_id]` для динамических параметров
- **Layouts**: Вложенные layouts для разных разделов
- **Loading/Error**: Специальные страницы для состояний

### Компонентная архитектура

```
components/feature/
├── ComponentName.tsx            # Основной компонент
├── ComponentName.types.ts       # Типы компонента
├── ComponentName.stories.tsx    # Storybook (если есть)
└── index.ts                     # Export barrel
```

### State Management

- **Zustand**: Глобальное состояние
- **React Context**: Контекст аутентификации
- **React Hook Form**: Состояние форм
- **Local State**: useState/useReducer для локального состояния

---

## 🗄️ База данных

### Схема данных

```sql
-- Основные таблицы
users                    # Пользователи
company                  # Компании
users_company           # Связь пользователей с компаниями
company_invitations     # Приглашения в компании

-- Логистические данные
cargo                   # Грузы
cars                    # Автомобили
routes                  # Маршруты
tip_car                 # Типы автомобилей
tip_zagryzki            # Типы загрузки

-- Система поддержки
support_tickets         # Тикеты поддержки

-- Справочники
tip_company             # Типы компаний
```

### Drizzle ORM

```typescript
// Пример схемы
export const users = pgTable('users', {
  id_user: uuid('id_user').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  mfa_enabled: boolean('mfa_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Миграции

- **Drizzle Kit**: Генерация и применение миграций
- **Версионирование**: Каждая миграция имеет версию
- **Откат**: Возможность отката миграций
- **Seed данные**: Начальные данные для разработки

---

## 🔌 API структура

### RESTful API

```
/api/
├── auth/                        # Аутентификация
│   ├── POST /register           # Регистрация
│   ├── POST /login              # Вход
│   ├── POST /refresh            # Обновление токена
│   ├── GET /me                  # Текущий пользователь
│   └── POST /logout             # Выход
├── company/                     # Компании
│   ├── GET /                    # Список компаний
│   ├── POST /                   # Создание компании
│   ├── GET /:id                 # Получение компании
│   ├── PUT /:id                 # Обновление компании
│   └── DELETE /:id              # Удаление компании
├── cargo/                       # Грузы
├── cars/                        # Автомобили
├── support/                     # Поддержка
├── bitrix24/                    # Bitrix24 интеграция
└── webhook/                     # Webhook endpoints
```

### API паттерны

1. **Стандартные HTTP методы**: GET, POST, PUT, DELETE
2. **RESTful URLs**: `/api/resource/:id`
3. **JSON responses**: Единый формат ответов
4. **Error handling**: Стандартизированные коды ошибок
5. **Pagination**: Для списков данных
6. **Filtering/Sorting**: Параметры запросов

### Аутентификация

- **JWT Access Tokens**: Короткоживущие токены (7 дней)
- **JWT Refresh Tokens**: Долгоживущие токены (7 дней)
- **MFA Support**: TOTP аутентификация
- **Rate Limiting**: Защита от брутфорса

---

## 🔗 Интеграции

### Bitrix24

- **Webhook**: Получение уведомлений о комментариях
- **API**: Создание тикетов поддержки
- **Смарт-процессы**: Управление тикетами
- **Контакты**: Синхронизация пользователей

### Картографические сервисы

- **Nominatim**: Геокодирование адресов
- **OSRM**: Построение маршрутов
- **Leaflet**: Интерактивные карты

### Email

- **Nodemailer**: Отправка email
- **SMTP**: Yandex SMTP сервер
- **Templates**: HTML шаблоны писем

### reCAPTCHA

- **v3**: Защита от ботов
- **Score-based**: Адаптивная защита
- **Fallback**: Резервная защита

---

## 🔒 Безопасность

### Аутентификация

1. **JWT Tokens**: Безопасные токены доступа
2. **MFA**: Двухфакторная аутентификация
3. **Password Hashing**: bcrypt для паролей
4. **Session Management**: Управление сессиями

### Авторизация

1. **Role-based Access**: Система ролей
2. **Resource-based**: Доступ к ресурсам
3. **Company Isolation**: Изоляция данных компаний

### Защита данных

1. **Input Validation**: Zod валидация
2. **SQL Injection**: Drizzle ORM защита
3. **XSS Protection**: Санитизация данных
4. **CSRF Protection**: CORS настройки

### Rate Limiting

1. **API Endpoints**: Ограничение запросов
2. **Authentication**: Защита от брутфорса
3. **Registration**: Ограничение регистраций

---

## ⚡ Производительность

### Backend оптимизации

1. **Database Indexing**: Индексы для быстрых запросов
2. **Connection Pooling**: Пул соединений с БД
3. **Caching**: Кэширование часто используемых данных
4. **Compression**: Gzip сжатие ответов

### Frontend оптимизации

1. **Code Splitting**: Разделение кода по страницам
2. **Lazy Loading**: Ленивая загрузка компонентов
3. **Image Optimization**: Оптимизация изображений
4. **Bundle Analysis**: Анализ размера бандла

### Мониторинг производительности

1. **Response Times**: Время ответа API
2. **Database Queries**: Производительность запросов
3. **Memory Usage**: Использование памяти
4. **Error Rates**: Частота ошибок

---

## 📊 Мониторинг

### Логирование

1. **Structured Logs**: JSON формат логов
2. **Log Levels**: DEBUG, INFO, WARN, ERROR
3. **Request Tracing**: Трассировка запросов
4. **Error Tracking**: Отслеживание ошибок

### Health Checks

1. **API Health**: `/health` endpoint
2. **Database Health**: Проверка подключения к БД
3. **External Services**: Проверка внешних сервисов
4. **WebSocket Health**: Статус WebSocket соединений

### Метрики

1. **Response Times**: Время ответа
2. **Throughput**: Пропускная способность
3. **Error Rates**: Частота ошибок
4. **User Activity**: Активность пользователей

---

## 🔄 CI/CD

### Развертывание

1. **Git-based**: Деплой через Git
2. **PM2**: Управление процессами
3. **Nginx**: Reverse proxy
4. **SSL**: Let's Encrypt сертификаты

### Процесс деплоя

1. **Code Push**: Отправка кода в репозиторий
2. **Server Pull**: Подтягивание изменений на сервер
3. **Build**: Сборка приложений
4. **Database Migration**: Применение миграций
5. **Service Restart**: Перезапуск сервисов

---

## 📈 Масштабирование

### Горизонтальное масштабирование

1. **Load Balancer**: Распределение нагрузки
2. **Multiple Instances**: Несколько экземпляров
3. **Database Replication**: Репликация БД
4. **CDN**: Content Delivery Network

### Вертикальное масштабирование

1. **Resource Optimization**: Оптимизация ресурсов
2. **Database Tuning**: Настройка БД
3. **Caching Strategy**: Стратегия кэширования
4. **Code Optimization**: Оптимизация кода

---

*Последнее обновление: Октябрь 2025*
