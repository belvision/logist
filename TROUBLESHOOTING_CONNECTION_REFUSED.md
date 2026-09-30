# Решение проблемы "ERR_CONNECTION_REFUSED" на продакшене

> **Примечание:** Проект использует именованные адреса `0.0.0.0` вместо `localhost` для обеспечения совместимости между локальной разработкой и продакшеном. Подробнее см. [NAMED_ADDRESSES_CONFIGURATION.md](./NAMED_ADDRESSES_CONFIGURATION.md).

## Описание проблемы

**Симптомы:**
- При попытке авторизации на продакшне появляется ошибка "ERR_CONNECTION_REFUSED"
- В консоли браузера видны ошибки сетевых запросов к API
- Фронтенд загружается, но API запросы не проходят

## Корневые причины

### 1. Неправильное название переменной окружения

**Проблема:** В коде используется переменная `NEXT_PUBLIC_API_BASE_URL`, но в `.env.local` была указана `NEXT_PUBLIC_API_URL`.

**Код в приложении:**
```typescript
// apps/frontend/src/shared/api/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||  // ← Ищет именно эту переменную
  process.env.AUTH_API_BASE_URL ||
  'http://localhost:8080';  // ← Fallback на localhost
```

**Результат:** Поскольку переменная не найдена, используется fallback `http://localhost:8080`, который недоступен на продакшене.

### 2. Отсутствие проксирования API в nginx

**Проблема:** Nginx был настроен только для фронтенда, все запросы (включая `/api/*`) перенаправлялись на порт 3000, где работает Next.js, а не на бэкенд.

**Исходная конфигурация nginx:**
```nginx
server {
    # ... SSL настройки ...
    
    # Все запросы шли только на фронтенд
    location / {
        proxy_pass http://127.0.0.1:3000;
        # ...
    }
}
```

**Результат:** API запросы не могли достичь бэкенда на порту 8080.

### 3. Конфликт портов с rinetd

**Проблема:** Порт 8080 был занят сервисом `rinetd`, который перенаправлял запросы на внешний недоступный сервер:

```bash
# /etc/rinetd.conf
10.1.1.215    8080/tcp  193.176.183.78 8080/tcp
```

**Результат:** Даже если бы nginx правильно проксировал запросы на 8080, они бы попадали на rinetd, а не на наш бэкенд.

### 4. Не запущенные сервисы

**Проблема:** Фронтенд периодически падал, бэкенд не был запущен в режиме продакшена.

## Пошаговое решение

### Шаг 1: Исправить переменную окружения

```bash
# apps/frontend/.env.local
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro  # ← Правильное название
```

### Шаг 2: Настроить nginx проксирование

Добавить в конфигурацию nginx **перед** блоком `location /`:

```nginx
# /etc/nginx/conf.d/logistgo.pro.conf
server {
    # ... SSL настройки ...
    
    # API запросы проксируем на бэкенд (ВАЖНО: перед location /)
    location /api/ {
        proxy_pass         http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    
    # Все остальные запросы на фронтенд
    location / {
        proxy_pass         http://127.0.0.1:3000;
        # ...
    }
}
```

### Шаг 3: Решить конфликт портов

Закомментировать проблемную строку в `/etc/rinetd.conf`:

```bash
# 10.1.1.215    8080/tcp  193.176.183.78 8080/tcp
```

И перезапустить rinetd:
```bash
sudo systemctl restart rinetd
```

### Шаг 4: Запустить сервисы

```bash
# Бэкенд
cd apps/backend
npm run dev  # или npm start

# Фронтенд (в отдельном терминале)
cd apps/frontend
npm start
```

### Шаг 5: Проверить работу

```bash
# Бэкенд напрямую
curl http://127.0.0.1:8080/
# → "Hello, i am alive!"

# API через nginx
curl https://logistgo.pro/api/
# → должен ответить

# Тестовая авторизация
curl https://logistgo.pro/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

## Схема работы после исправления

```
Браузер
  ↓ https://logistgo.pro/api/auth/login
Nginx (порт 443)
  ↓ proxy_pass на 127.0.0.1:8080/api/
Бэкенд (порт 8080)
  ↓ обработка запроса
База данных
```

## Команды для диагностики

```bash
# 1. Проверить переменные окружения
cat apps/frontend/.env.local

# 2. Проверить процессы
ps aux | grep -E "(node|tsx)" | grep -v grep

# 3. Проверить порты
sudo netstat -tlnp | grep -E ":(3000|8080)"

# 4. Проверить конфигурацию nginx
sudo nginx -t

# 5. Проверить логи
sudo tail -10 /var/log/nginx/error.log
sudo tail -10 /var/log/nginx/access.log

# 6. Тестовые запросы
curl http://127.0.0.1:8080/              # бэкенд
curl https://logistgo.pro/                # фронтенд
curl https://logistgo.pro/api/            # API
```

## Предотвращение проблемы в будущем

1. **Используйте правильные названия переменных** - следуйте документации
2. **Настраивайте nginx сразу полностью** - и для фронтенда, и для API
3. **Проверяйте конфликты портов** перед запуском сервисов
4. **Используйте процесс-менеджеры** (PM2, systemd) для автозапуска сервисов
5. **Ведите мониторинг** сервисов на продакшене

## Полезные ссылки

- [Документация Next.js по переменным окружения](https://nextjs.org/docs/basic-features/environment-variables)
- [Документация Nginx по проксированию](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Основная документация по деплою](./PRODUCTION_DEPLOYMENT.md)
