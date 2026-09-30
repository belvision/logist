# 🔍 Диагностика проблемы с MinIO Console

## ❓ Проблема: Консоль не открывается в браузере

Порт указывать **не нужно** - он уже указан в `proxy_pass http://127.0.0.1:9001/`.

## 🔧 Пошаговая диагностика

### Шаг 1: Проверьте, что конфигурация применена на сервере

```bash
# На сервере через SSH:
ssh logistgo@10.1.1.215

# Проверьте, что конфигурация скопирована:
sudo cat /etc/nginx/conf.d/logistgo.pro.conf | grep -A 20 "location /console"

# Должна быть видна ваша конфигурация
```

### Шаг 2: Проверьте конфигурацию nginx

```bash
# На сервере:
sudo nginx -t

# Должно быть: "nginx: configuration file /etc/nginx/nginx.conf test is successful"
# Если есть ошибки - исправьте их
```

### Шаг 3: Перезагрузите nginx

```bash
# На сервере:
sudo systemctl reload nginx
# или
sudo systemctl restart nginx

# Проверьте статус:
sudo systemctl status nginx
```

### Шаг 4: Проверьте, что MinIO Console запущен

```bash
# На сервере:
sudo netstat -tlnp | grep 9001

# Должен быть открыт порт 9001
# Пример вывода:
# tcp  0  0  127.0.0.1:9001  0.0.0.0:*  LISTEN  12345/minio
```

Если порт не открыт:

```bash
# Проверьте статус MinIO:
sudo systemctl status minio

# Если не запущен:
sudo systemctl start minio

# Или если в Docker:
docker ps | grep minio
docker start minio-container-name
```

### Шаг 5: Проверьте прямой доступ к MinIO Console

```bash
# На сервере через SSH:
curl -v http://127.0.0.1:9001/

# Должен вернуть HTML страницу (не ошибку)
# Если получаете "Connection refused" - MinIO не запущен
# Если получаете HTML - MinIO работает
```

### Шаг 6: Проверьте доступ через nginx

```bash
# На сервере:
curl -v https://io.logistgo.pro/console/

# Проверьте код ответа:
# - 200 OK - все работает
# - 403 Forbidden - проблема с доступом (allow/deny)
# - 502 Bad Gateway - MinIO не запущен или неправильный proxy_pass
# - 404 Not Found - неправильный путь
```

### Шаг 7: Проверьте логи nginx

```bash
# На сервере в одном терминале:
sudo tail -f /var/log/nginx/error.log

# В другом терминале или в браузере попробуйте открыть:
# https://io.logistgo.pro/console/

# Смотрите, что появляется в логах
```

Также проверьте access.log:

```bash
sudo tail -f /var/log/nginx/access.log
```

## 🐛 Частые проблемы и решения

### Проблема 1: Ошибка 502 Bad Gateway

**Причина:** MinIO Console не запущен или работает на другом порту.

**Решение:**
```bash
# Проверьте порт:
sudo netstat -tlnp | grep 9001

# Если порт не открыт, запустите MinIO:
sudo systemctl start minio
```

### Проблема 2: Ошибка 403 Forbidden

**Причина:** Ваш IP не в сети 10.1.1.0/24 или правила доступа не работают.

**Решение:**
```bash
# Проверьте ваш IP через VPN:
# На вашем компьютере:
ipconfig  # Windows
# или
ifconfig  # Linux/Mac

# Убедитесь, что IP начинается с 10.1.1.

# Временно разрешите доступ всем для тестирования:
# В конфигурации закомментируйте allow/deny:
# # allow 10.1.1.0/24;
# # deny all;
```

### Проблема 3: Ошибка 404 Not Found

**Причина:** MinIO Console работает на другом пути, не на `/console/`.

**Решение:**
```bash
# Проверьте, какой путь использует MinIO:
curl http://127.0.0.1:9001/
curl http://127.0.0.1:9001/minio/console/

# Один из них должен вернуть HTML
# Используйте правильный путь в конфигурации
```

### Проблема 4: Конфигурация не применяется

**Причина:** Файл не скопирован на сервер или nginx не перезагружен.

**Решение:**
```bash
# Убедитесь, что файл скопирован:
sudo ls -la /etc/nginx/conf.d/logistgo.pro.conf

# Проверьте дату изменения:
sudo stat /etc/nginx/conf.d/logistgo.pro.conf

# Перезагрузите nginx:
sudo systemctl reload nginx
```

## ✅ Правильная последовательность действий

1. **Скопируйте конфигурацию на сервер:**
   ```bash
   scp logistgo.pro.conf logistgo@10.1.1.215:/tmp/
   ```

2. **На сервере:**
   ```bash
   ssh logistgo@10.1.1.215
   sudo cp /tmp/logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Проверьте MinIO:**
   ```bash
   sudo netstat -tlnp | grep 9001
   curl http://127.0.0.1:9001/
   ```

4. **Проверьте доступ:**
   ```bash
   curl -v https://io.logistgo.pro/console/
   ```

5. **Откройте в браузере:**
   ```
   https://io.logistgo.pro/console/
   ```

## 🚀 Альтернатива: Используйте MinIO Client

Если консоль все еще не работает, используйте MinIO Client (mc) - это гарантированно работает:

```bash
# Установите mc (см. docs/MINIO_QUICK_UPLOAD.md)
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
mc ls myminio/logistic-pro/
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

---

**Выполните все шаги диагностики и сообщите результаты!** 🔍

