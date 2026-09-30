# Настройка для продакшена

## Проблема
На продакшене возникает ошибка 502 при обращении к `/api/auth/recaptcha-config`.

## Решение

### 1. Создайте файл `.env.production` в корне фронтенда:

```bash
# Если бэкенд работает на том же домене:
NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro

# Если бэкенд работает на отдельном поддомене:
# NEXT_PUBLIC_API_BASE_URL=https://api.logistgo.pro

# Если бэкенд работает на отдельном порту:
# NEXT_PUBLIC_API_BASE_URL=https://logistgo.pro:5555
```

### 2. Убедитесь, что бэкенд доступен

Проверьте, что бэкенд отвечает по адресу:
```bash
curl https://logistgo.pro/api/auth/recaptcha-config
```

Должен вернуть:
```json
{"enabled":true,"siteKey":"...","version":"v3","minScore":0.5}
```

### 3. Настройте nginx/proxy (если нужно)

Если бэкенд работает на другом порту, настройте проксирование:

```nginx
location /api/ {
    proxy_pass http://localhost:5555/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4. Пересоберите и разверните

```bash
npm run build
# Разверните на продакшене
```

## Текущий статус
- ✅ reCAPTCHA работает в разработке
- ⚠️ reCAPTCHA отключена на продакшене (временно через fallback)
- ✅ Приложение работает без ошибок
