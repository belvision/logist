# Быстрый запуск с именованными адресами

## Краткая справка

Проект LogistPro использует именованные адреса `0.0.0.0` вместо `localhost` для обеспечения совместимости между локальной разработкой и продакшеном.

## Быстрый старт

### 1. Backend

```bash
cd apps/backend

# Создать .env на основе env.example
cp env.example .env

# Установить зависимости
npm install

# Запустить миграции
npm run db:migrate

# Запустить сервер
npm run dev
```

**Результат:** Backend будет доступен на `http://0.0.0.0:5555`

### 2. Frontend

```bash
cd apps/frontend

# Создать .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://0.0.0.0:5555" > .env.local

# Установить зависимости
npm install

# Запустить сервер разработки
npm run dev
```

**Результат:** Frontend будет доступен на `http://0.0.0.0:3000`

## Проверка работы

### Тест Backend API

```bash
# Проверить что API отвечает
curl http://0.0.0.0:5555/

# Проверить документацию API
open http://0.0.0.0:5555/docs
```

### Тест Frontend

```bash
# Открыть в браузере
open http://0.0.0.0:3000
```

## Переменные окружения

### Backend (.env)

```bash
# Основные настройки
PORT=5555
NODE_ENV=development
CORS_ORIGIN=http://0.0.0.0:3000
FRONTEND_BASE_URL=http://0.0.0.0:3000

# База данных
DB_URL=postgresql://user:password@0.0.0.0:5432/logistic_pro
POSTGRES_HOST=0.0.0.0
POSTGRES_PORT=5432

# JWT
JWT_SECRET=your_secret_key_here
```

### Frontend (.env.local)

```bash
# API URL
NEXT_PUBLIC_API_BASE_URL=http://0.0.0.0:5555
```

## Преимущества 0.0.0.0

- ✅ Работает в Docker контейнерах
- ✅ Совместимость с продакшеном
- ✅ Единая конфигурация для всех сред
- ✅ Нет конфликтов с localhost

## Решение проблем

### Сервис недоступен

```bash
# Проверить порты
netstat -tlnp | grep -E ":(3000|5555)"

# Проверить доступность
curl http://0.0.0.0:5555/
curl http://0.0.0.0:3000/
```

### CORS ошибки

```bash
# Проверить переменные
echo $CORS_ORIGIN
echo $NEXT_PUBLIC_API_BASE_URL

# Должно быть:
# CORS_ORIGIN=http://0.0.0.0:3000
# NEXT_PUBLIC_API_BASE_URL=http://0.0.0.0:5555
```

## Дополнительная информация

- [Полная документация по именованным адресам](./NAMED_ADDRESSES_CONFIGURATION.md)
- [Инструкция по деплою](./PRODUCTION_DEPLOYMENT.md)
- [Решение проблем подключения](./TROUBLESHOOTING_CONNECTION_REFUSED.md)
