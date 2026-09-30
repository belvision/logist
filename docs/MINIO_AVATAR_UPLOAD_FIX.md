# Исправление ошибки загрузки аватара в MinIO

## Проблема
При загрузке аватара в профиле пользователя появлялась ошибка:
```
API Error: Error: Ошибка при загрузке аватара: MinIO upload failed: Unknown error. Check MinIO connection and credentials.
```

## Причина
В файле `ecosystem.config.js` отсутствовали переменные окружения для подключения к MinIO. Бэкенд использовал дефолтные значения (localhost:9000), которые не работали с продакшн MinIO сервером.

## Решение

### 1. Обновлен ecosystem.config.js
Добавлены переменные окружения для MinIO в конфигурацию PM2:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 5555,
  // MinIO Production Settings
  MINIO_ENDPOINT: 'io.logistgo.pro',
  MINIO_PORT: '443',
  MINIO_USE_SSL: 'true',
  MINIO_ACCESS_KEY: 'REDACTED_SECRET',
  MINIO_SECRET_KEY: 'REDACTED_SECRET',
  MINIO_BUCKET_NAME: 'logistic-pro'
}
```

### 2. Настройки MinIO
- **Endpoint**: `io.logistgo.pro` (reverse proxy с SSL)
- **Port**: `443` (HTTPS)
- **SSL**: включен
- **Access Key**: `minioadmin`
- **Secret Key**: `JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t`
- **Bucket Name**: `logistic-pro`

### 3. Созданные бакеты в MinIO
- `data`
- `logistic-pro` (используется для аватаров и других файлов)

## Инструкция по применению исправления

### Шаг 1: Перезапустить бэкенд
```bash
# Перезапустить приложение с новыми переменными окружения
pm2 restart logistgo-backend

# ИЛИ полностью перезагрузить PM2
pm2 delete logistgo-backend
pm2 start ecosystem.config.js
```

### Шаг 2: Проверить логи
```bash
# Проверить, что MinIO подключился успешно
pm2 logs logistgo-backend --lines 50

# Вы должны увидеть:
# 🔧 [MINIO CONFIG] Initializing MinIO client with config:
# ✅ [MINIO CONFIG] MinIO client initialized for bucket: logistic-pro
```

### Шаг 3: Проверить статус
```bash
pm2 status
```

### Шаг 4: Тестирование
1. Откройте профиль пользователя на https://logistgo.pro
2. Попробуйте загрузить аватар
3. Проверьте, что загрузка прошла успешно
4. Проверьте, что аватар отображается по URL: `https://io.logistgo.pro/logistic-pro/avatars/...`

## Альтернативный метод (через .env файл)

Если хотите использовать `.env` файл вместо `ecosystem.config.js`:

### Создайте файл apps/backend/.env:
```bash
cat > apps/backend/.env << 'EOF'
# MinIO Production Settings
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
MINIO_BUCKET_NAME=logistic-pro

# ... остальные переменные из env.example ...
EOF
```

### Перезапустите PM2:
```bash
pm2 restart logistgo-backend
```

## Проверка подключения к MinIO

### Через MinIO Client (mc)
```bash
# Установите mc (если еще не установлен)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Настройте алиас для вашего MinIO
mc alias set myprod https://io.logistgo.pro minioadmin 'JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t'

# Проверьте список бакетов
mc ls myprod

# Проверьте содержимое бакета logistic-pro
mc ls myprod/logistic-pro

# Проверьте политику доступа к бакету
mc policy get myprod/logistic-pro
```

### Через curl
```bash
# Проверьте доступность MinIO API
curl -k https://io.logistgo.pro/minio/health/live
```

## Возможные проблемы

### 1. Ошибка подключения к MinIO
**Симптом**: `Error: connect ECONNREFUSED`

**Решение**:
- Проверьте, что MinIO работает на сервере
- Проверьте nginx конфигурацию для reverse proxy
- Убедитесь, что SSL сертификат настроен правильно

### 2. Ошибка доступа (Access Denied)
**Симптом**: `Error: Access Denied`

**Решение**:
- Проверьте credentials (access key и secret key)
- Убедитесь, что бакет `logistic-pro` существует
- Проверьте политику доступа к бакету

### 3. Bucket не существует
**Симптом**: `Error: The specified bucket does not exist`

**Решение**:
```bash
# Создайте бакет через mc
mc mb myprod/logistic-pro

# Установите публичную политику для чтения
mc policy set download myprod/logistic-pro
```

### 4. Неправильный endpoint
**Симптом**: DNS resolution failed или connection timeout

**Решение**:
- Убедитесь, что `io.logistgo.pro` резолвится корректно
- Проверьте DNS настройки
- Проверьте файрвол и открытые порты

## Логи для отладки

В коде добавлены подробные логи для отладки:

```typescript
// В minioClient.ts
console.log('🔧 [MINIO CONFIG] Initializing MinIO client with config:', {...});
console.log('🔍 [MINIO UPLOAD] Starting upload:', {...});
console.log('✅ [MINIO UPLOAD] File uploaded successfully to bucket');

// В user.service.ts
console.log('🔍 [UPLOAD AVATAR SERVICE] Starting upload for user:', userId);
console.log('✅ [UPLOAD AVATAR SERVICE] File uploaded successfully, URL:', url);
```

Смотрите эти логи через `pm2 logs logistgo-backend` для диагностики проблем.

## Nginx конфигурация для MinIO (справка)

Если нужно настроить reverse proxy для MinIO через nginx:

```nginx
# MinIO API
location / {
    proxy_pass https://localhost:9000;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # MinIO specific
    proxy_buffering off;
    proxy_request_buffering off;
    client_max_body_size 100M;
}
```

## Дата исправления
23 октября 2024

