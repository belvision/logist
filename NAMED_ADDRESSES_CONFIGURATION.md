# Конфигурация именованных адресов для локальной разработки

## Обзор

В проекте LogistPro реализована система именованных адресов, которая позволяет запускать локальную сборку без конфликтов с продакшеном. Вместо использования `localhost` везде используется `0.0.0.0`, что обеспечивает совместимость между различными средами разработки.

## Принцип работы

### Проблема с localhost

Использование `localhost` в конфигурации может вызывать проблемы:
- В Docker контейнерах `localhost` может указывать на сам контейнер, а не на хост
- В некоторых сетевых конфигурациях `localhost` может быть недоступен
- При развертывании на продакшене могут возникать конфликты с локальными настройками

### Решение через 0.0.0.0

`0.0.0.0` - это специальный IP-адрес, который означает "все доступные сетевые интерфейсы":
- В локальной разработке работает как `localhost`
- В Docker контейнерах корректно связывается с хостом
- На продакшене работает с реальными доменными именами
- Обеспечивает единообразную конфигурацию

## Конфигурация Backend

### Основные настройки

В файле `apps/backend/src/db/config.ts`:

```typescript
export const config: Config = {
  app: {
    // API URL по умолчанию
    apiUrl: getEnv(string('API_URL')).default('http://0.0.0.0:3000') as string,
    // Frontend URL по умолчанию  
    frontendBaseUrl: getEnv(string('FRONTEND_BASE_URL')).default('http://0.0.0.0:3000') as string,
    // Порт бэкенда
    port: getEnv(integer('PORT')).default(5555) as number,
  },
  
  cors: {
    // CORS origin по умолчанию
    origin: getEnv(string('CORS_ORIGIN')).default('http://0.0.0.0:3000') as string,
  },
  
  postgres: {
    // Хост базы данных
    host: getEnv(string('POSTGRES_HOST')).default('localhost') as string,
    // Остальные настройки...
  }
};
```

### Переменные окружения

В файле `apps/backend/env.example`:

```bash
# Database
DB_URL=postgresql://DB_USER:DB_PASSWORD@0.0.0.0:5432/logistic_pro
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@0.0.0.0:5432/logistic_pro
DB_HOST=0.0.0.0
POSTGRES_HOST=0.0.0.0

# Server
PORT=5555
CORS_ORIGIN=http://0.0.0.0:3000
FRONTEND_BASE_URL=http://0.0.0.0:3000

# API документация доступна на http://0.0.0.0:5555/docs
```

## Конфигурация Frontend

### API Base URL

Во всех компонентах фронтенда используется единый подход:

```typescript
const API_BASE = 
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.AUTH_API_BASE_URL ||
  'http://0.0.0.0:5555'; // fallback для локальной разработки
```

### Файлы с конфигурацией

1. **`apps/frontend/src/lib/config.ts`** - основная конфигурация
2. **`apps/frontend/src/shared/api/api.ts`** - API клиент
3. **Компоненты** - локальные определения API_BASE

### Примеры использования

```typescript
// В компонентах
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555';

// API запросы
const response = await fetch(`${API_BASE}/api/endpoint`);
```

## Преимущества именованных адресов

### 1. Единообразие конфигурации
- Одинаковые настройки для локальной разработки и продакшена
- Нет необходимости менять конфигурацию при деплое
- Упрощенное управление переменными окружения

### 2. Совместимость с Docker
- `0.0.0.0` корректно работает в Docker контейнерах
- Нет проблем с сетевым доступом между контейнерами
- Упрощенная настройка docker-compose

### 3. Гибкость развертывания
- Легко переключаться между локальной разработкой и продакшеном
- Поддержка различных сетевых конфигураций
- Совместимость с облачными платформами

## Настройка для разных сред

### Локальная разработка

```bash
# Backend .env
DB_URL=postgresql://user:password@0.0.0.0:5432/logistic_pro
CORS_ORIGIN=http://0.0.0.0:3000
FRONTEND_BASE_URL=http://0.0.0.0:3000
PORT=5555

# Frontend .env.local
NEXT_PUBLIC_API_BASE_URL=http://0.0.0.0:5555
```

### Продакшен

```bash
# Backend .env
DB_URL=postgresql://user:password@prod-host:5432/logistic_pro
CORS_ORIGIN=https://yourdomain.com
FRONTEND_BASE_URL=https://yourdomain.com
PORT=5555

# Frontend .env.production
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
```

### Docker

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "5555:5555"
    environment:
      - DB_URL=postgresql://user:password@db:5432/logistic_pro
      - CORS_ORIGIN=http://0.0.0.0:3000
      
  frontend:
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://0.0.0.0:5555
```

## Миграция с localhost

Если в проекте еще остались ссылки на `localhost`, их нужно заменить на `0.0.0.0`:

### Поиск и замена

```bash
# Найти все вхождения localhost
grep -r "localhost" apps/

# Заменить localhost на 0.0.0.0 (осторожно!)
find apps/ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
xargs sed -i 's/localhost/0.0.0.0/g'
```

### Проверка изменений

```bash
# Проверить что localhost больше не используется
grep -r "localhost" apps/ | grep -v node_modules

# Проверить что 0.0.0.0 используется корректно
grep -r "0.0.0.0" apps/ | grep -v node_modules
```

## Отладка проблем

### Проблема: Сервис недоступен по 0.0.0.0

**Решение:**
1. Проверить что сервис запущен на правильном порту
2. Убедиться что порт не заблокирован файрволом
3. Проверить что нет конфликтов с другими сервисами

```bash
# Проверить занятые порты
netstat -tlnp | grep -E ":(3000|5555)"

# Проверить доступность
curl http://0.0.0.0:5555/
curl http://0.0.0.0:3000/
```

### Проблема: CORS ошибки

**Решение:**
1. Проверить настройки CORS_ORIGIN в backend
2. Убедиться что фронтенд обращается к правильному API URL
3. Проверить что домены совпадают

```bash
# Проверить CORS настройки
echo $CORS_ORIGIN
echo $NEXT_PUBLIC_API_BASE_URL
```

## Рекомендации

### 1. Всегда используйте переменные окружения
- Не хардкодьте адреса в коде
- Используйте fallback значения с 0.0.0.0
- Документируйте все переменные окружения

### 2. Тестируйте в разных средах
- Локальная разработка
- Docker контейнеры
- Продакшен

### 3. Мониторинг и логирование
- Логируйте используемые адреса при запуске
- Мониторьте доступность сервисов
- Отслеживайте ошибки подключения

### 4. Документирование
- Обновляйте документацию при изменениях
- Ведите changelog конфигурации
- Документируйте переменные окружения

## Заключение

Использование именованных адресов `0.0.0.0` вместо `localhost` обеспечивает:
- Совместимость между локальной разработкой и продакшеном
- Корректную работу в Docker контейнерах
- Упрощенное управление конфигурацией
- Гибкость развертывания

Эта конфигурация позволяет разработчикам запускать локальную сборку без конфликтов с продакшеном и обеспечивает единообразное поведение во всех средах.
