# Исправление проблем MinIO на продакшене

## 🚨 Проблема

На продакшене используется локальный Docker MinIO (localhost:9000) вместо продакшен MinIO сервера (io.logistgo.pro:443). Это приводит к тому, что:

- Аватары загружаются в локальный Docker
- При отключении Docker аватары исчезают
- Продакшен MinIO (io.logistgo.pro) не используется

## ✅ Решение

### 1. Создать файл `.env` на продакшен сервере

На продакшен сервере выполните:

```bash
cd /path/to/logistPro
bash setup-production-env.sh
```

Или создайте `.env` вручную:

```bash
cd apps/backend
cp env.example .env
```

### 2. Настроить MinIO для продакшена

Откройте `apps/backend/.env` и убедитесь, что настройки MinIO правильные:

```bash
# === MinIO настройки ===
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
MINIO_BUCKET_NAME=logistic-pro
```

### 3. Убедитесь, что NODE_ENV правильный

```bash
NODE_ENV=production
```

### 4. Перезапустить backend

```bash
pm2 restart backend
pm2 logs backend --lines 50
```

### 5. Проверить логи

При запуске backend вы должны увидеть:

```
🔧 [MINIO CONFIG] Initializing MinIO client with config: {
  endpoint: 'io.logistgo.pro',
  port: 443,
  useSSL: true,
  bucketName: 'logistic-pro',
  accessKeyLength: 9,
  secretKeyLength: 39
}
✅ [MINIO CONFIG] MinIO client initialized for bucket: logistic-pro
```

## 🔍 Проверка

### Проверить, какой MinIO используется

1. Загрузите аватар на сайте
2. Проверьте логи backend:
   ```bash
   pm2 logs backend | grep MINIO
   ```
3. Вы должны увидеть URL с `io.logistgo.pro`, а не `localhost`

### Проверить консоль MinIO

Перейдите на https://io.logistgo.pro/console и проверьте:

1. Бакет `logistic-pro` существует
2. В нем есть папка `avatars` с файлами
3. Файлы доступны по ссылкам

## 🎯 Ожидаемый результат

После исправления:

- ✅ Аватары загружаются на https://io.logistgo.pro/logistic-pro/avatars/...
- ✅ Аватары НЕ зависят от локального Docker
- ✅ Удаление аватаров работает корректно
- ✅ URL генерируются правильно (без порта :443)

## ⚠️ Важно

1. **НЕ** используйте Docker MinIO на продакшене
2. **НЕ** коммитьте файл `.env` в git
3. Проверьте, что в `.gitignore` есть `.env`
4. Регулярно делайте бэкап MinIO данных

## 🔧 Дополнительная настройка

### Миграция существующих аватаров из Docker в продакшен MinIO

Если у вас есть аватары в Docker MinIO, их нужно перенести:

```bash
# 1. Скачать данные из Docker MinIO
docker exec minio mc mirror minio/logistic-pro /tmp/minio-backup

# 2. Загрузить на продакшен MinIO
mc mirror /tmp/minio-backup play/logistic-pro
```

### Настройка mc (MinIO Client)

```bash
# Установка mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Настройка для продакшен MinIO
mc alias set production https://io.logistgo.pro minioadmin 'JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t'

# Проверка
mc ls production/logistic-pro
```
