# 🚀 Руководство по разработке LogistPro

> **Единый источник истины для разработки проекта LogistPro**

## 📋 Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура](#архитектура)
3. [Технологический стек](#технологический-стек)
4. [Установка и запуск](#установка-и-запуск)
5. [Структура проекта](#структура-проекта)
6. [Паттерны разработки](#паттерны-разработки)
7. [Работа с базой данных](#работа-с-базой-данных)
8. [API разработка](#api-разработка)
9. [Frontend разработка](#frontend-разработка)
10. [Переменные окружения](#переменные-окружения)
11. [Деплой](#деплой)
12. [Отладка и диагностика](#отладка-и-диагностика)

---

## 🎯 Обзор проекта

**LogistPro** — это монорепозиторий для управления логистическими компаниями, включающий:

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Hono + Node.js + TypeScript  
- **База данных**: PostgreSQL + Drizzle ORM
- **Монорепозиторий**: Turbo + npm workspaces

### Основные функции:
- ✅ Аутентификация и авторизация (JWT + MFA)
- ✅ Управление компаниями и пользователями
- ✅ Система ролей (Владелец, Администратор, Пользователь)
- ✅ Управление грузами и автомобилями
- ✅ Поиск попутных грузов
- ✅ Интеграция с картами (Nominatim, OSRM)
- ✅ Система поддержки (Bitrix24)
- ✅ WebSocket уведомления
- ✅ reCAPTCHA защита

---

## 🏗️ Архитектура

### Монорепозиторий
```
logistPro/
├── apps/
│   ├── frontend/          # Next.js приложение
│   └── backend/           # Hono API сервер
├── package.json           # Workspace конфигурация
├── turbo.json            # Turbo конфигурация
└── tsconfig.json         # Корневая TypeScript конфигурация
```

### Backend архитектура
```
apps/backend/src/
├── api/                   # API модули
│   ├── auth/             # Аутентификация
│   ├── company/          # Управление компаниями
│   ├── cargo/            # Грузы
│   ├── cars/             # Автомобили
│   ├── support/          # Поддержка
│   ├── bitrix24/         # Интеграция с Bitrix24
│   └── index.ts          # Главный файл API
├── db/                   # База данных
│   ├── schema/           # Схемы Drizzle
│   ├── config.ts         # Конфигурация БД
│   └── client.ts         # Клиент БД
├── lib/                  # Утилиты
│   ├── websocket.ts      # WebSocket менеджер
│   ├── rateLimiter.ts    # Rate limiting
│   └── password.ts       # Хеширование паролей
└── types/                # Общие типы
```

### Frontend архитектура
```
apps/frontend/src/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Страницы аутентификации
│   ├── company/         # Страницы компаний
│   ├── cargo-search/    # Поиск грузов
│   └── car-search/      # Поиск автомобилей
├── components/          # React компоненты
│   ├── ui/              # Базовые UI компоненты
│   ├── auth/            # Компоненты аутентификации
│   ├── cargo/           # Компоненты грузов
│   └── layout/          # Компоненты макета
├── shared/              # Общие модули
│   ├── api/             # API клиенты
│   ├── hooks/           # React хуки
│   └── context/         # React контексты
├── lib/                 # Утилиты
└── types/               # TypeScript типы
```

---

## 🛠️ Технологический стек

### Backend
- **Runtime**: Node.js 22.x
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.x (строгий режим)
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM + Drizzle Kit
- **Auth**: JWT + MFA (TOTP)
- **Validation**: Zod
- **WebSocket**: ws
- **Email**: Nodemailer
- **Maps**: Nominatim + OSRM

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **UI Library**: React 19.x
- **Language**: TypeScript 5.x (строгий режим)
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Maps**: Leaflet
- **Icons**: Lucide React

### DevOps
- **Monorepo**: Turbo
- **Package Manager**: npm 10.x
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt

---

## ⚡ Установка и запуск

### Требования
- Node.js 22.x
- npm 10.x
- PostgreSQL 14+
- Git

### Локальная разработка

```bash
# 1. Клонирование репозитория
git clone <repo-url>
cd logistPro

# 2. Установка зависимостей
npm install

# 3. Настройка переменных окружения
cp apps/backend/.env.example apps/backend/.env
# Отредактируйте .env файл

# 4. Настройка базы данных
cd apps/backend
npm run db:create
npm run db:migrate
npm run db:seed

# 5. Запуск в режиме разработки
cd ../..
npm run dev
```

### Доступные команды

```bash
# Разработка
npm run dev              # Запуск всех приложений
npm run build            # Сборка всех приложений
npm run lint             # Проверка кода
npm run type-check       # Проверка типов

# База данных
npm run db:generate      # Генерация миграций
npm run db:migrate       # Применение миграций
npm run db:studio        # Drizzle Studio
```

---

## 📁 Структура проекта

### Backend API модуль
Каждый API модуль следует единому паттерну:

```
src/api/feature/
├── feature.controller.ts    # HTTP handlers (Hono Context)
├── feature.service.ts       # Business logic
├── feature.repository.ts    # Database operations
├── feature.router.ts        # Route definitions
├── feature.schema.ts        # Zod validation schemas
└── feature.types.ts         # TypeScript types
```

### Frontend компонент
```
src/components/feature/
├── ComponentName.tsx        # Main component
├── ComponentName.types.ts   # Component types (optional)
└── index.ts                 # Export barrel
```

---

## 🎨 Паттерны разработки

### 1. Строгая типизация TypeScript

**❌ НЕ ДЕЛАЙТЕ:**
```typescript
const data: any = response.data;
function processData(data) { return data.map(item => item.value); }
```

**✅ ДЕЛАЙТЕ:**
```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
}

function processData<T>(data: T[]): T[] {
  return data.map(item => item);
}
```

### 2. Валидация с Zod

```typescript
// schema.ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// controller.ts
export async function createUser(c: Context) {
  const body = await c.req.json();
  const validatedData = CreateUserSchema.parse(body);
  // ...
}
```

### 3. Обработка ошибок

```typescript
// service.ts
export async function createUser(data: CreateUserDto) {
  try {
    const result = await userRepository.create(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}
```

### 4. React компоненты

```typescript
// ComponentName.types.ts
export interface ComponentNameProps {
  data: DataType[];
  onAction: (id: string) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// ComponentName.tsx
export function ComponentName({ 
  data, 
  onAction, 
  variant = 'primary',
  className 
}: ComponentNameProps) {
  return (
    <div className={cn("base-styles", className)}>
      {/* Component implementation */}
    </div>
  );
}
```

---

## 🗄️ Работа с базой данных

### Схема Drizzle

```typescript
// schema.ts
export const users = pgTable('users', {
  id_user: uuid('id_user').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Repository паттерн

```typescript
// repository.ts
export class UserRepository {
  async create(data: CreateUserDto): Promise<User> {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id_user, id))
      .limit(1);
    return user || null;
  }
}
```

### Миграции

```bash
# Создание миграции
npm run db:generate

# Применение миграций
npm run db:migrate

# Просмотр схемы
npm run db:studio
```

---

## 🔌 API разработка

### Создание нового API модуля

1. **Создайте схему валидации:**
```typescript
// feature.schema.ts
export const CreateFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateFeatureDto = z.infer<typeof CreateFeatureSchema>;
```

2. **Создайте типы:**
```typescript
// feature.types.ts
export interface Feature {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

3. **Создайте репозиторий:**
```typescript
// feature.repository.ts
export class FeatureRepository {
  async create(data: CreateFeatureDto): Promise<Feature> {
    // Database operations
  }
}
```

4. **Создайте сервис:**
```typescript
// feature.service.ts
export class FeatureService {
  private repository = new FeatureRepository();

  async createFeature(data: CreateFeatureDto): Promise<Feature> {
    // Business logic
    return await this.repository.create(data);
  }
}
```

5. **Создайте контроллер:**
```typescript
// feature.controller.ts
export async function createFeatureHandler(c: Context) {
  const body = await c.req.json();
  const validatedData = CreateFeatureSchema.parse(body);
  
  const result = await featureService.createFeature(validatedData);
  return c.json({ success: true, data: result });
}
```

6. **Создайте роутер:**
```typescript
// feature.router.ts
export const featureRouter = new Hono();

featureRouter.post('/', authenticate, createFeatureHandler);
featureRouter.get('/', authenticate, getFeaturesHandler);
```

7. **Подключите к главному роутеру:**
```typescript
// api/index.ts
import { featureRouter } from './feature/feature.router.ts';

app.route('/api/feature', featureRouter);
```

---

## 🎨 Frontend разработка

### Создание нового компонента

1. **Создайте типы:**
```typescript
// ComponentName.types.ts
export interface ComponentNameProps {
  title: string;
  data: DataType[];
  onAction: (id: string) => void;
  variant?: 'primary' | 'secondary';
}
```

2. **Создайте компонент:**
```typescript
// ComponentName.tsx
'use client';

import { ComponentNameProps } from './ComponentName.types';
import { cn } from '@/lib/utils';

export function ComponentName({ 
  title, 
  data, 
  onAction, 
  variant = 'primary' 
}: ComponentNameProps) {
  return (
    <div className={cn("base-styles", variant === 'secondary' && "secondary-styles")}>
      <h2>{title}</h2>
      {/* Component implementation */}
    </div>
  );
}
```

3. **Создайте индексный файл:**
```typescript
// index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

### Работа с формами

```typescript
// FormComponent.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, CreateUserDto } from './schema';

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateUserDto>({
    resolver: zodResolver(CreateUserSchema)
  });

  const onSubmit = async (data: CreateUserDto) => {
    try {
      await createUser(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
```

### API клиенты

```typescript
// api/user.ts
import { CreateUserDto, User } from '@/types/user';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5555';

export async function createUser(data: CreateUserDto): Promise<User> {
  const response = await fetch(`${API_BASE}/api/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}
```

---

## ⚙️ Переменные окружения

### Backend (.env)
```bash
# Основные настройки
PORT=5555
NODE_ENV=production
CORS_ORIGIN=https://logistgo.pro
FRONTEND_BASE_URL=https://logistgo.pro

# База данных
DB_URL=postgresql://user:password@host:5432/database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your_super_secure_random_jwt_secret_key_here_at_least_32_chars
JWT_REFRESH_SECRET=your_super_secure_random_refresh_secret_key_here_at_least_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=7d

# SMTP
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yandex.by
SMTP_PASSWORD=your-app-password
SMTP_FROM="Logistic Pro" <your-email@yandex.by>

# MFA
MFA_ISSUER=LogistGo
MFA_TOTP_WINDOW=1
MFA_RECOVERY_CODES_COUNT=10
MFA_TRUSTED_DEVICE_DAYS=30
MFA_ENCRYPTION_KEY=please_change_this_32bytes_key________
MFA_PENDING_SECRET=changeme_pending_mfa
DEV_GOOGLE_BYPASS=true

# Bitrix24
BITRIX24_URL=https://your-portal.bitrix24.by/rest/1/REDACTED_SECRET/
BITRIX24_WEBHOOK_TOKEN=your_webhook_token

# DaData
DADATA_TOKEN=your_dadata_token

# OSRM
OSRM_URL=http://your-osrm-server:5000
NOMINATIM_URL=http://your-nominatim-server:8080

# reCAPTCHA
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_TIMEOUT=5000
```

### Frontend (.env.local)
```bash
# API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5555
```

### Frontend (.env.production)
```bash
# API URL
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro
```

---

## 🚀 Деплой

### Продакшен деплой

1. **Подготовка сервера:**
```bash
# Установка зависимостей
sudo apt update
sudo apt install nginx postgresql nodejs npm

# Настройка PostgreSQL
sudo -u postgres createdb logistgo
sudo -u postgres createuser logistgo
```

2. **Деплой приложения:**
```bash
# Клонирование репозитория
git clone <repo-url> /var/www/logistgo
cd /var/www/logistgo

# Установка зависимостей
npm install

# Настройка переменных окружения
cp apps/backend/.env.example apps/backend/.env
# Отредактируйте .env файл

# Настройка базы данных
cd apps/backend
npm run db:migrate
npm run db:seed

# Сборка приложений
cd ../..
npm run build

# Запуск с PM2
pm2 start ecosystem.config.js
```

3. **Настройка Nginx:**
```nginx
server {
    listen 80;
    server_name logistgo.pro www.logistgo.pro;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:5555/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:5556/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Обновление приложения

```bash
# На сервере
cd /var/www/logistgo
git fetch origin
git reset --hard origin/landing

# Пересборка и перезапуск
npm run build
pm2 restart all
```

---

## 🔍 Отладка и диагностика

### Логи и мониторинг

```bash
# PM2 логи
pm2 logs
pm2 logs logistgo-backend
pm2 logs logistgo-frontend

# Nginx логи
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Системные логи
sudo journalctl -u nginx -f
```

### Диагностика проблем

1. **Проверка статуса сервисов:**
```bash
pm2 list
pm2 monit
```

2. **Проверка портов:**
```bash
sudo netstat -tlnp | grep -E ":(3000|5555|5556)"
```

3. **Проверка API:**
```bash
curl http://127.0.0.1:5555/health
curl https://logistgo.pro/api/health
```

4. **Проверка базы данных:**
```bash
cd apps/backend
npm run db:studio
```

### Типичные проблемы

#### "ERR_CONNECTION_REFUSED"
- Проверьте, что backend запущен на порту 5555
- Проверьте переменную `NEXT_PUBLIC_API_BASE_URL`
- Проверьте настройки nginx

#### "CORS error"
- Проверьте `CORS_ORIGIN` в backend
- Убедитесь, что домен точно совпадает

#### "Invalid token"
- Проверьте `JWT_SECRET` - должен быть одинаковым
- Убедитесь, что токены не истекли

#### "Database connection error"
- Проверьте `DB_URL` в .env
- Убедитесь, что PostgreSQL запущен
- Проверьте права доступа к базе данных

---

## 📚 Дополнительные ресурсы

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Hono Documentation](https://hono.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev/)

---

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Убедитесь, что переменные окружения настроены правильно
3. Проверьте статус всех сервисов
4. Обратитесь к разделу "Отладка и диагностика"

---

*Последнее обновление: Октябрь 2025*
