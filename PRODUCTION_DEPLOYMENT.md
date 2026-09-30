# Инструкция по деплою на продакшен

> **Важно:** Проект использует именованные адреса `0.0.0.0` вместо `localhost` для обеспечения совместимости между локальной разработкой и продакшеном. Подробнее см. [NAMED_ADDRESSES_CONFIGURATION.md](./NAMED_ADDRESSES_CONFIGURATION.md).

## Быстрое решение проблемы "ERR_CONNECTION_REFUSED"

**TL;DR:** Если при авторизации на продакшене появляется ошибка "ERR_CONNECTION_REFUSED":

1. **Проверьте переменную окружения фронтенда:**
   ```bash
   # В apps/frontend/.env.local должно быть:
   NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
   # НЕ NEXT_PUBLIC_API_URL!
   ```

2. **Добавьте проксирование API в nginx:**
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:8080/api/;
       # остальные заголовки...
   }
   ```

3. **Запустите оба сервиса:**
   ```bash
   # Бэкенд на порту 8080
   cd apps/backend && npm run dev
   
   # Фронтенд на порту 3000  
   cd apps/frontend && npm start
   ```

---

## Проблемы с аутентификацией на продакшене

Если у вас не работает вход в систему на продакшене, проверьте следующие пункты:

### 1. Переменные окружения Backend

Создайте файл `apps/backend/.env` на основе `apps/backend/.env.production.example`:

```bash
# ОБЯЗАТЕЛЬНЫЕ переменные:
DB_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_super_secure_random_jwt_secret_key_here_at_least_32_chars
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
FRONTEND_BASE_URL=https://yourdomain.com
```

**ВАЖНО:**
- `JWT_SECRET` должен быть случайным и длинным (минимум 32 символа)
- `CORS_ORIGIN` должен точно соответствовать домену фронтенда
- `DB_URL` должен указывать на реальную базу данных

### 2. Переменные окружения Frontend

Создайте файл `apps/frontend/.env.production` на основе `apps/frontend/.env.production.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

**ВАЖНО:**
- URL должен точно соответствовать адресу вашего API сервера
- Не забудьте протокол `https://` для продакшена

### 3. CORS настройки

Backend теперь поддерживает множественные домены в `CORS_ORIGIN`:

```bash
# Один домен
CORS_ORIGIN=https://yourdomain.com

# Несколько доменов (через запятую)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### 4. База данных

Убедитесь, что:
- База данных доступна с сервера
- Выполнены все миграции: `npm run db:migrate`
- Есть тестовый пользователь или возможность регистрации

### 5. Проверка работоспособности

1. **Проверьте API сервер:**
   ```bash
   curl https://api.yourdomain.com/
   # Должен вернуть: "Hello, i am alive!"
   ```

2. **Проверьте CORS:**
   ```bash
   curl -H "Origin: https://yourdomain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        https://api.yourdomain.com/api/auth/login
   ```

3. **Проверьте логин:**
   ```bash
   curl -X POST https://api.yourdomain.com/api/auth/login \
        -H "Content-Type: application/json" \
        -H "Origin: https://yourdomain.com" \
        -d '{"email":"test@example.com","password":"password"}'
   ```

### 6. Типичные ошибки

#### "ERR_CONNECTION_REFUSED" при авторизации
**Симптомы:** Фронтенд показывает ошибку "Failed to fetch" или "ERR_CONNECTION_REFUSED" при попытке входа в систему.

**Причины и решения:**

1. **Неправильное название переменной API URL:**
   ```bash
   # НЕПРАВИЛЬНО:
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   
   # ПРАВИЛЬНО:
   NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
   ```
   
2. **Отсутствие проксирования API в nginx:**
   
   Добавьте в конфигурацию nginx (перед блоком `location /`):
   ```nginx
   # API запросы проксируем на бэкенд
   location /api/ {
       proxy_pass         http://127.0.0.1:8080/api/;
       proxy_http_version 1.1;
       proxy_set_header   Host              $host;
       proxy_set_header   X-Real-IP         $remote_addr;
       proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
       proxy_set_header   X-Forwarded-Proto $scheme;
       proxy_read_timeout 120s;
   }
   ```

3. **Конфликт портов (rinetd или другие сервисы):**
   
   Проверьте, что порт 8080 не занят другими сервисами:
   ```bash
   sudo netstat -tlnp | grep :8080
   sudo lsof -i :8080
   ```
   
   Если порт занят rinetd или другим сервисом:
   - Либо остановите конфликтующий сервис
   - Либо измените порт бэкенда в `.env`: `PORT=8081`
   - И обновите nginx соответственно

4. **Бэкенд не запущен:**
   
   Убедитесь, что бэкенд работает:
   ```bash
   cd apps/backend
   npm run dev  # или npm start
   curl http://127.0.0.1:8080/  # должен вернуть "Hello, i am alive!"
   ```

5. **Фронтенд не запущен или упал:**
   
   Проверьте и перезапустите фронтенд:
   ```bash
   cd apps/frontend
   pkill -f "next"  # остановить старые процессы
   npm start        # запустить заново
   ```

**Диагностика:**
```bash
# 1. Проверить процессы
ps aux | grep -E "(node|tsx)" | grep -v grep

# 2. Проверить порты
sudo netstat -tlnp | grep -E ":(3000|8080)"

# 3. Проверить логи nginx
sudo tail -10 /var/log/nginx/error.log
sudo tail -10 /var/log/nginx/access.log

# 4. Тестовые запросы
curl http://127.0.0.1:8080/              # бэкенд напрямую
curl https://yourdomain.com/api/          # через nginx
```

#### "Неверные данные для входа"
- Проверьте, что пользователь существует в базе данных
- Проверьте правильность пароля

#### "CORS error" или "Network error"
- Проверьте `CORS_ORIGIN` в backend
- Проверьте `NEXT_PUBLIC_API_BASE_URL` в frontend
- Убедитесь, что API сервер доступен

#### "Invalid token" или "Требуется авторизация"
- Проверьте `JWT_SECRET` - он должен быть одинаковым при создании и проверке токенов
- Убедитесь, что токены не истекли

#### "Connection refused" или "500 Internal Server Error"
- Проверьте подключение к базе данных (`DB_URL`)
- Проверьте логи сервера

### 7. Команды для деплоя

```bash
# Backend
cd apps/backend
npm install
npm run build  # если есть build скрипт
npm run db:migrate
npm start

# Frontend
cd apps/frontend
npm install
npm run build
npm start
```

### 8. Логи и отладка

Для отладки включите подробные логи в backend:
```bash
DEBUG=true
```

Проверьте логи в консоли браузера (F12) и логи сервера для диагностики проблем.
