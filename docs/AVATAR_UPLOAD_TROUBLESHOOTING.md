# Устранение проблем с загрузкой аватаров

## 🚨 Проблема

При загрузке аватара на продакшене возникает ошибка **500 (Internal Server Error)**.

## 🔍 Диагностика

### 1. Проверить конфигурацию MinIO на сервере

```bash
cd ~/www/logistgo.pro/logistgo-next
bash check-minio-config.sh
```

Этот скрипт проверит:
- Существует ли `.env` файл
- Правильные ли настройки MinIO
- Статус backend процесса
- Последние логи

### 2. Проверить логи backend

```bash
pm2 logs backend --lines 50
```

Ищите сообщения с `[MINIO]` и `[UPLOAD AVATAR]`:

**Правильная конфигурация:**
```
🔧 [MINIO CONFIG] Initializing MinIO client with config: {
  endpoint: 'io.logistgo.pro',
  port: 443,
  useSSL: true,
  bucketName: 'logistic-pro'
}
```

**Неправильная конфигурация (использует Docker):**
```
🔧 [MINIO CONFIG] Initializing MinIO client with config: {
  endpoint: 'localhost',
  port: 9000,
  useSSL: false
}
```

### 3. Проверить доступность MinIO сервера

```bash
curl -I https://io.logistgo.pro/logistic-pro/
```

Должен вернуть 403 или 200, но не 500 или timeout.

## ✅ Решение

### Шаг 1: Создать/обновить .env файл

```bash
cd ~/www/logistgo.pro/logistgo-next/apps/backend

# Если .env не существует
cp env.example .env

# Проверить содержимое
cat .env | grep MINIO
```

Убедитесь, что настройки правильные:

```bash
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
MINIO_BUCKET_NAME=logistic-pro
```

### Шаг 2: Обновить код и перезапустить backend

```bash
cd ~/www/logistgo.pro/logistgo-next

# Обновить код
git pull origin serg

# Перезапустить backend
pm2 restart backend

# Проверить логи
pm2 logs backend --lines 30
```

### Шаг 3: Проверить MinIO bucket

Перейдите в консоль MinIO: https://io.logistgo.pro/console

Логин: `minioadmin`  
Пароль: `JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t`

Проверьте:
1. Bucket `logistic-pro` существует
2. Bucket доступен для записи
3. Есть папка `avatars`

### Шаг 4: Обновить nginx конфигурацию

```bash
cd ~/www/logistgo.pro/logistgo-next

# Скопировать новую конфигурацию
sudo cp logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf

# Проверить и перезагрузить
sudo nginx -t && sudo systemctl reload nginx
```

## 📋 Чек-лист

- [ ] `.env` файл существует в `apps/backend/`
- [ ] MinIO настройки в `.env` правильные (`io.logistgo.pro:443`)
- [ ] Backend перезапущен после изменений
- [ ] В логах видно правильную MinIO конфигурацию
- [ ] MinIO сервер доступен (`curl https://io.logistgo.pro/logistic-pro/`)
- [ ] Bucket `logistic-pro` существует в MinIO
- [ ] nginx конфигурация обновлена (поддержка DELETE)

## 🔧 Частые ошибки

### Ошибка: "Connection refused" или "ECONNREFUSED"

**Причина:** Backend пытается подключиться к локальному MinIO (localhost:9000)

**Решение:** Проверьте `.env` файл, убедитесь что `MINIO_ENDPOINT=io.logistgo.pro`

### Ошибка: "Access Denied" или "InvalidAccessKeyId"

**Причина:** Неправильные credentials для MinIO

**Решение:** Проверьте `MINIO_ACCESS_KEY` и `MINIO_SECRET_KEY` в `.env`

### Ошибка: "No such bucket"

**Причина:** Bucket не существует на MinIO сервере

**Решение:** Создайте bucket `logistic-pro` в консоли MinIO

### Ошибка: "Certificate error" или "SSL error"

**Причина:** Проблемы с SSL сертификатом

**Решение:** Проверьте, что `MINIO_USE_SSL=true` и сертификат валиден

## 🎯 Ожидаемый результат

После исправления при загрузке аватара вы увидите в логах:

```
🔍 [UPLOAD AVATAR SERVICE] Starting upload for user: <user-id>
🔍 [UPLOAD AVATAR SERVICE] File: { name: 'avatar.jpg', size: 12345, type: 'image/jpeg' }
🔍 [UPLOAD AVATAR SERVICE] Uploading to MinIO...
🔍 [MINIO] Generated URL: https://io.logistgo.pro/logistic-pro/avatars/...
✅ [UPLOAD AVATAR SERVICE] File uploaded successfully
✅ [UPLOAD AVATAR SERVICE] User profile updated successfully
```

И аватар появится на странице профиля!
