# Альтернативные способы доступа к MinIO

## 🚀 Вариант 1: MinIO Client (mc) - Рекомендуется

Самый простой и надежный способ без веб-интерфейса.

### Установка

**Windows:**
1. Скачайте `mc.exe` с https://min.io/download
2. Поместите в папку (например, `C:\tools\`)

**Linux/Mac:**
```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

### Настройка

```bash
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
```

### Использование

```bash
# Просмотр bucket
mc ls myminio/logistic-pro/

# Создание папок
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers

# Загрузка файла
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Просмотр структуры
mc tree myminio/logistic-pro/backgrounds/

# Скачивание файла
mc cp myminio/logistic-pro/backgrounds/home/hero-bg.jpg ./downloaded.jpg
```

**Преимущества:**
- ✅ Работает гарантированно
- ✅ Не требует настройки nginx
- ✅ Быстро и удобно
- ✅ Поддержка всех операций

---

## 🔧 Вариант 2: SSH туннель

Если у вас есть SSH доступ к серверу.

### Настройка туннеля

```bash
# Создайте SSH туннель
ssh -L 9001:10.1.1.215:9001 logistgo@10.1.1.215

# В другом терминале или после подключения:
# Откройте в браузере:
http://localhost:9001/minio/console/
```

**Преимущества:**
- ✅ Безопасно (через SSH)
- ✅ Не требует изменения nginx
- ✅ Прямой доступ к MinIO Console

---

## 🌐 Вариант 3: Отдельный поддомен

Настроить отдельный поддомен для MinIO Console (например, `minio.logistgo.pro`).

### Настройка DNS

Добавьте A-запись:
```
minio.logistgo.pro → 10.1.1.215
```

### Конфигурация nginx

Создайте отдельный файл `/etc/nginx/conf.d/minio.logistgo.pro.conf`:

```nginx
server {
    listen 10.1.1.215:443 ssl;
    http2 on;
    server_name minio.logistgo.pro;
    
    ssl_certificate /etc/letsencrypt/live/logistgo.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/logistgo.pro/privkey.pem;
    
    location / {
        allow 10.1.1.0/24;
        deny all;
        proxy_pass http://10.1.1.215:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        client_max_body_size 100M;
    }
}
```

**Преимущества:**
- ✅ Чистое разделение
- ✅ Нет конфликтов с основным доменом
- ✅ Простая конфигурация

---

## 🔌 Вариант 4: Прямой доступ через порт (если открыт)

Если порт 9001 открыт в firewall.

```bash
# Откройте в браузере:
http://10.1.1.215:9001/minio/console/
# или
https://10.1.1.215:9001/minio/console/
```

**Недостатки:**
- ⚠️ Требует открытия порта в firewall
- ⚠️ Менее безопасно

---

## 📋 Рекомендация

**Для загрузки фоновых изображений используйте MinIO Client (mc)** - это самый простой и надежный способ:

```bash
# 1. Установите mc
# 2. Настройте:
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t

# 3. Создайте папки:
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers
mc mb myminio/logistic-pro/backgrounds/cargo-owners
mc mb myminio/logistic-pro/backgrounds/team

# 4. Загрузите изображения:
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

Подробная инструкция: `docs/MINIO_QUICK_UPLOAD.md`

---

**Какой вариант вам больше подходит?** 🎯

