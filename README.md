# Logist / Логист

**English:** An archived logistics platform project, published for study and reuse. Development by the original owner has stopped. The monorepo contains a Next.js frontend, a Hono/TypeScript backend, PostgreSQL and Drizzle ORM. Six development snapshots are available as branches: `cargo` (default), `cars`, `crm`, `landing`, `s-cargo` and `serg`.

**Русский:** Архивный проект логистической платформы, открытый для изучения и повторного использования. Владелец больше не ведёт разработку. Монорепозиторий содержит интерфейс Next.js, сервер Hono/TypeScript, PostgreSQL и Drizzle ORM. Сохранены снимки шести веток: `cargo` (основная), `cars`, `crm`, `landing`, `s-cargo` и `serg`.

## Publication notes / О публикации

- This public repository starts with clean source snapshots. The previous private Git history is not included because it contained credentials. Runtime files and the legacy `old_project` directory are omitted.
- Этот открытый репозиторий начинается с очищенных снимков исходников. Прежняя закрытая Git-история не опубликована из-за секретов в старых коммитах. Рабочие данные и устаревшая папка `old_project` исключены.
- Replace `REDACTED_SECRET` and other examples with your own local environment settings. Never commit real credentials. Some historical documentation describes earlier deployments and may need adaptation.
- Замените `REDACTED_SECRET` и другие заглушки своими локальными настройками. Не коммитьте настоящие секреты. Часть документации описывает прежние установки и может требовать адаптации.
- Shared as-is, with no ongoing support or production-readiness guarantee. Review dependencies and configuration before deployment. Each branch is a separate development snapshot.
- Проект предоставляется как есть, без дальнейшей поддержки и гарантий готовности к эксплуатации. Перед развёртыванием проверьте зависимости и настройки. Ветки отражают разные стадии разработки.
- License / Лицензия: [MIT](LICENSE). Third-party dependencies retain their own licenses.

---

# Логист Про — Паспорт проекта

## 0) Регламент работы
- В репозиторий попадает стабильная версия. Любые доработки — минимальные и совместимые, не ломаем существующие модули.
- Конфигурация строго через `.env`. Ключи/токены не коммитим.
- Не меняем контрактов API и названий таблиц без миграций и явной фиксации в ченджлоге.

## 1. Краткое описание
"Logistic Pro" — монорепозиторий (Turbo) с фронтендом на Next.js и бэкендом на Hono (Node.js). Хранение данных — PostgreSQL. Для схемы БД и миграций используется Drizzle ORM/Drizzle Kit.

## 2. Архитектура и технологии
- Монорепозиторий: `turbo`
- Пакеты/приложения: `apps/frontend` (Next.js), `apps/backend` (Hono)
- Язык: TypeScript
- База данных: PostgreSQL
- ORM/миграции: Drizzle ORM, Drizzle Kit
- Стайл/качество: ESLint, Prettier

Структура:
- `apps/frontend` — UI, страницы (`app` router), Tailwind, формочки через `react-hook-form`
- `apps/backend` — REST API на `hono`, конфигурация окружения и подключение к БД, миграции Drizzle

## 3. Требования к окружению
- Node.js 22.x (см. engines в пакетах)
- npm 10.x
- PostgreSQL 14+ (рекомендовано)
- Windows/Unix — поддерживается

## 4. Установка и запуск
```bash
# Клонирование
git clone <repo-url>
cd logistPro

# Установка зависимостей в монорепо
npm install

# Запуск всех приложений в dev через Turbo
npm run dev
```

Либо по отдельности:
```bash
# Frontend
cd apps/frontend
npm run dev

# Backend
cd ../backend
cp env.example .env  # заполните значения
npm run dev
```

## 5. Переменные окружения
Бэкенд использует обе переменные: `DB_URL` (основная для приложения/клиента) и `DATABASE_URL` (часто используется Drizzle Kit). Держите их синхронизированными:

Файл `apps/backend/.env` (пример см. `env.example`):
```env
DB_URL=postgresql://username:password@localhost:5432/logistic_pro
DATABASE_URL=postgresql://username:password@localhost:5432/logistic_pro
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
# ...
```

Фронтенд (если запускаете миграции из фронта):
```powershell
# PowerShell session перед генерацией/миграцией
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/logistic_pro"
```

## 6. База данных и миграции (Drizzle)
Проект использует Drizzle Kit для генерации и применения миграций из схем TypeScript.

- Backend конфиг: `apps/backend/drizzle.config.ts`
- Frontend конфиг: `apps/frontend/drizzle.config.ts`

Рекомендация: один источник истины для схемы БД — в бэкенде. Генерируйте и применяйте миграции из `apps/backend`.

### Команды (Backend)
Из папки `apps/backend`:
```bash
# Сгенерировать миграции из схемы TypeScript
npm run db:generate

# Применить миграции к базе (push:pg применяется как миграция)
npm run db:migrate

# Быстро выровнять схему без истории (равносильно push)
npm run db:push

# Проверить конфигурацию/схему
npm run db:check

# Открыть Drizzle Studio
npm run db:studio
```

Убедитесь, что `DATABASE_URL` задан в окружении (или в `.env`), и что путь `schema` в `apps/backend/drizzle.config.ts` указывает на файл со схемой (например, индекс, реэкспортирующий таблицы).

### Команды (Frontend) — при необходимости
Из папки `apps/frontend`:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Фронтенд содержит примерную схему таблицы `company` для проверки пайплайна. В проде лучше ограничить миграции одной стороной (бэкендом).

## 7. Скрипты
Корень (`package.json`):
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "turbo run type-check"
  }
}
```

Бэкенд (`apps/backend/package.json`):
- `dev`: запуск API (watch)
- `build`/`start`: сборка/запуск
- `db:generate`, `db:migrate` (`push:pg`), `db:push`, `db:check`, `db:studio`, `db:drop`, `db:create`, `db:seed`

Фронтенд (`apps/frontend/package.json`):
- `dev`, `build`, `start`, `lint`

## 8. Схема БД (состояние)
- Frontend пример: `apps/frontend/src/db/schema.ts` — таблица `company (id, name, created_at)`
- Backend: директория `apps/backend/src/db/schema/` — добавляйте таблицы в отдельных файлах и экспортируйте их через индекс. Убедитесь, что `drizzle.config.ts` ссылается на корректный entry-файл схемы.

## 9. Запуск разработки
1) Поднимите PostgreSQL (локально/в Docker).
2) Заполните `apps/backend/.env` (можно на основе `env.example`).
3) Сгенерируйте и примените миграции (из `apps/backend`).
4) Запустите бэкенд: `npm run dev` (в `apps/backend`).
5) Запустите фронтенд: `npm run dev` (в `apps/frontend`).

## 10. Деплой (в общих чертах)
- Бэкенд: сборка (`npm run build`), запуск `node dist/api/index.js`, предварительно применив миграции к целевой БД.
- Фронтенд: билд Next.js и деплой на выбранную платформу (Vercel/другая), настроить переменные окружения и CORS на бэкенде.

## 11. Полезные замечания
- Следите за согласованностью `DB_URL` и `DATABASE_URL`.
- В проде избегайте параллельных источников миграций. Держите схему и миграции централизованно на бэкенде.
- В Windows PowerShell экспорт окружения делайте через `$env:VARIABLE="value"` на текущую сессию.

## Порты и URL
| Сервис | Адрес по умолчанию | Факт в проекте | Комментарий |
|---|---|---|---|
| Frontend (Next dev) | `http://localhost:3000` | 3000 | Стандартный порт Next |
| Backend (Hono API) | `http://localhost:4001` | 8080 | Используется порт 8080 (настройка `PORT` в `apps/backend/.env`) |
| API базовый путь | `http://localhost:<PORT>/api` | `http://localhost:8080/api` | Фронт вызывает бек по 8080 |
| Swagger UI | `http://localhost:<PORT>/docs` | `http://localhost:8080/docs` | Hono Swagger |
| OpenAPI JSON | `http://localhost:<PORT>/openapi.json` | `http://localhost:8080/openapi.json` | Спека API |
| PostgreSQL | `localhost:5432` | 5432 | Для облака — SSL при необходимости |

Примечание: порт 5173 (Vite) не используется и не должен фигурировать в актуальной документации.

## Backend API (Hono)
- Вход: `apps/backend/src/api/index.ts`
- Базовые маршруты:
Базовые сервисные эндпоинты

GET / — health‑check: возвращает строку «Hello, i am alive!»
GitHub
.

GET /docs — Swagger UI
GitHub
.

GET /openapi.json — OpenAPI‑спецификация
GitHub
.

/api/auth — авторизация и управление учётной записью
GitHub
:

POST /api/auth/register — регистрация пользователя.

POST /api/auth/login — вход в систему.

GET /api/auth/me — получить профиль текущего пользователя.

POST /api/auth/refresh — обновление JWT.

PATCH /api/auth/change-password — смена пароля (требуется авторизация).

POST /api/auth/mfa/setup/start — начало настройки MFA (требуется авторизация).

POST /api/auth/mfa/setup/verify — завершение настройки MFA (требуется авторизация).

POST /api/auth/mfa/verify — проверка MFA-кода.

POST /api/auth/mfa/disable — отключить MFA (требуется авторизация).

POST /api/auth/mfa/recovery/regenerate — сгенерировать набор recovery-кодов (требуется авторизация).

POST /api/auth/google/login — вход через Google OAuth.

/api/company — управление компаниями и участниками
GitHub
:

POST /api/company/ — создать компанию.

GET /api/company/ — получить список компаний.

GET /api/company/type — получить типы компаний.

GET /api/company/grp — поиск сведений о компании по УНП (без записи в БД)
GitHub
.

POST /api/company/:companyId/users — добавить существующего пользователя по email
GitHub
.

POST /api/company/:companyId/invite — пригласить пользователя по email
GitHub
.

GET /api/company/invite/verify — проверить токен приглашения
GitHub
.

GET /api/company/:companyId/users — список пользователей компании
GitHub
.

DELETE /api/company/:companyId/users/:userId — удалить пользователя из компании
GitHub
.

PUT /api/company/:companyId/users/:userId/role — изменить роль пользователя в компании
GitHub
.

/api/cars — работа с автомобилями
GitHub
:

POST /api/cars/ — добавить автомобиль.

PATCH /api/cars/:id — редактировать автомобиль.

DELETE /api/cars/:id — удалить автомобиль.

PATCH /api/cars/:id/toggles — переключить флаги подписки/поиска.

GET /api/cars/places/search — поиск населённых пунктов (подсказки).

GET /api/cars/by-company — список автомобилей компании.

GET /api/cars/:id — получить автомобиль по ID.

GET /api/cars/types — справочник типов автомобилей.

GET /api/cars/load-types — справочник типов загрузки.

/api/cargo — управление грузами
GitHub
:

POST /api/cargo/ — добавить груз.

PATCH /api/cargo/:id — редактировать груз.

DELETE /api/cargo/:id — удалить груз.

GET /api/cargo/places/search — поиск населённых пунктов (подсказки).

GET /api/cargo/types — справочник типов транспорта.

GET /api/cargo/load-types — справочник типов загрузки.

/api/routes — управление маршрутами перевозок
GitHub
:

POST /api/routes/ — создать маршрут.

PATCH /api/routes/:id_routes — редактировать маршрут.

DELETE /api/routes/:id_routes — удалить маршрут.

GET /api/routes/places/search — поиск населённых пунктов (подсказки).

/api/user — данные пользователя
GitHub
:

PATCH /api/user/me — обновить профиль текущего пользователя.
- JWT: `jsonwebtoken` (секрет/TTL из ENV). Режим — Bearer в заголовке, на фронте — HttpOnly cookie.
- CORS: источник читается из `CORS_ORIGIN`.

### Проверки вручную
```bash
curl -i http://localhost:8080/
curl -s http://localhost:8080/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"username":"demo","email":"demo@x.io","password":"REDACTED_SECRET"}'

curl -s http://localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@x.io","password":"REDACTED_SECRET"}'
```

### Безопасность
- HttpOnly cookie, CSRF‑безопасные прокси/эндпоинты
- CORS — только доверенные домены
- Секреты — только в `.env`

### Несоответствия схем (наблюдение)
- В ранних версиях встречались варианты схемы `users`. В качестве стандарта фиксируем `public.users` c полем `email` и UUID‑ключом `id_user` (или `id_users` — см. ниже).

### Переименование ключа `users.id → users.id_users` (план)
1) Миграция SQL (Drizzle): `ALTER TABLE "users" RENAME COLUMN "id" TO "id_users";`
2) Обновить все ссылки FK и код, использующий `id`
3) Проверка: генерация/применение миграций, затем e2e вход/регистрация

## Frontend (Next.js)
- Основные страницы: `/`, `/login`, `/registry`, `/lk`, `/lk/cars`, `/lk/find-cars`
- API‑клиенты: вынести базовый URL в ENV `NEXT_PUBLIC_API_BASE_URL`
- Аутентификация:
  - Login проксирует на бекенд и устанавливает HttpOnly cookie (например, `lg_jwt`)
  - Logout очищает cookie и состояние клиента

### Известные фронтовые моменты
- После регистрации при возврате на главную — добавить null‑guardы и корректные редиректы
- Если используется глобальная переменная для `x-user-id`, обеспечить корректную типизацию и условие наличия

### ЛК «Поиск автомобилей» (`/lk/find-cars`)
- После «Сохранить фильтр» показывать баннер «Последний сохранённый фильтр»
- При удалении последнего фильтра — текст «Сохранённых фильтров нет»
- Рекомендация: использовать soft‑delete (`deleted_at`) вместо физического удаления

### ЛК «Мои автомобили» (`/lk/cars`)
- Добавить/поддерживать CRUD постоянных маршрутов перевозчика (`search_avto_route`) с флагом участия в поиске

## Качество и стиль
- ESLint + TypeScript strict, избегать `any`
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Небольшие PR, атомарные изменения

## Чек‑лист перед выкатом
- [ ] `apps/backend/.env` → `PORT=8080`, задан `JWT_SECRET`
- [ ] `apps/frontend/.env.local` → `NEXT_PUBLIC_API_BASE_URL` указывает на бекенд
- [ ] Применены миграции Drizzle, схема `users` выровнена
- [ ] CORS ограничен на нужные домены
- [ ] Авторизация: cookie ставится/снимается, защищённые страницы редиректят корректно
- [ ] Swagger `/docs` доступен и соответствует реализованным роутам
- [ ] `/lk/find-cars` — баннер сохранённых фильтров соответствует ТЗ

## План ближайших итераций (roadmap)
1) Убрать жёсткий URL бэкенда из фронта, читать `NEXT_PUBLIC_API_BASE_URL`
2) Постоянные маршруты перевозчика: полный CRUD и интеграция в поиск
3) Унификация схемы `users`: миграция `id → id_users`, обновление FK/кода
4) Soft‑delete для сохранённых фильтров
5) E2E smoke: логин/регистрация/редиректы/защита маршрутов

## Быстрые команды
```bash
# Проверка живости бэка
curl -i http://localhost:8080/

# Swagger
start http://localhost:8080/docs

# Smoke: регистрация/логин
curl -s http://localhost:8080/api/auth/register -H 'content-type: application/json' -d '{"username":"demo","email":"demo@x.io","password":"REDACTED_SECRET"}'
curl -s http://localhost:8080/api/auth/login -H 'content-type: application/json' -d '{"email":"demo@x.io","password":"REDACTED_SECRET"}'
```
