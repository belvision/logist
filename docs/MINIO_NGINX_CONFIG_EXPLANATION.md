# Объяснение конфигурации MinIO через nginx

## 📋 Текущая настройка

Из `.env` файла:
```
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
```

Это означает, что:
- Backend подключается к MinIO через `https://io.logistgo.pro:443`
- nginx должен проксировать запросы к MinIO на локальный порт 9000
- MinIO работает локально на портах 9000 (API) и 9001 (Console)

## 🔧 Правильная конфигурация nginx

### Структура location блоков (важен порядок!)

```nginx
server {
    server_name logistgo.pro www.logistgo.pro io.logistgo.pro;
    
    # 1. Специфичные пути (должны быть ПЕРВЫМИ)
    location /console/ {
        # MinIO Console - порт 9001
        proxy_pass http://127.0.0.1:9001/;
        # ...
    }
    
    location /logistic-pro/ {
        # MinIO API - порт 9000
        proxy_pass http://127.0.0.1:9000/;
        # ...
    }
    
    location /api/ {
        # Backend API - порт 5555
        proxy_pass http://127.0.0.1:5555/api/;
        # ...
    }
    
    # 2. Общий путь (должен быть ПОСЛЕДНИМ!)
    location / {
        # Frontend - порт 3000
        proxy_pass http://127.0.0.1:3000;
        # ...
    }
}
```

## ⚠️ Важно: порядок location блоков

В nginx более специфичные location должны быть **ДО** общего `location /`.

Если `location /` будет первым, он перехватит все запросы, включая `/logistic-pro/` и `/console/`.

## 🔍 Проблема: AccessDenied при открытии корня

Если при открытии `https://io.logistgo.pro/` получаете ошибку AccessDenied от MinIO, это означает:

1. **На сервере есть отдельная конфигурация для `io.logistgo.pro`**, которая проксирует все на MinIO
2. **Или порядок location блоков неправильный** - `location /` перехватывает запросы раньше специфичных путей
3. **Или `location /` проксирует на MinIO вместо frontend**

## ✅ Решение

### Шаг 1: Проверьте конфигурацию на сервере

```bash
# На сервере:
sudo ls -la /etc/nginx/conf.d/
sudo grep -r "io.logistgo.pro" /etc/nginx/

# Проверьте, нет ли отдельного файла для io.logistgo.pro
```

### Шаг 2: Проверьте порядок location блоков

```bash
# На сервере:
sudo nginx -T | grep -A 5 "location /"

# location / должен быть ПОСЛЕДНИМ
```

### Шаг 3: Убедитесь, что location / проксирует на frontend

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;  # Frontend, НЕ MinIO!
    # ...
}
```

### Шаг 4: Примените правильную конфигурацию

```bash
# Скопируйте обновленный файл на сервер
scp logistgo.pro.conf logistgo@10.1.1.215:/tmp/

# На сервере:
ssh logistgo@10.1.1.215
sudo cp /tmp/logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 🎯 Правильная маршрутизация

После исправления должно работать так:

- `https://io.logistgo.pro/` → Frontend (порт 3000) ✅
- `https://io.logistgo.pro/logistic-pro/...` → MinIO API (порт 9000) ✅
- `https://io.logistgo.pro/console/` → MinIO Console (порт 9001) ✅
- `https://io.logistgo.pro/api/...` → Backend API (порт 5555) ✅

## 🔧 Дополнительные настройки для MinIO

Для правильной работы MinIO через nginx важно:

1. **Правильный Host header:**
   ```nginx
   proxy_set_header Host $host;
   ```

2. **Path style для MinIO:**
   В коде уже установлено `pathStyle: true` в minioClient.ts

3. **Правильная передача пути:**
   ```nginx
   location /logistic-pro/ {
       proxy_pass http://127.0.0.1:9000/;  # Слэш в конце!
   }
   ```

## 🐛 Диагностика

### Проверка 1: Куда идет запрос

```bash
# На сервере:
sudo tail -f /var/log/nginx/access.log

# Откройте https://io.logistgo.pro/ в браузере
# Смотрите, куда идет запрос
```

### Проверка 2: Проверка frontend

```bash
# На сервере:
curl http://127.0.0.1:3000/

# Должен вернуть HTML страницу frontend
```

### Проверка 3: Проверка MinIO

```bash
# На сервере:
curl http://127.0.0.1:9000/

# Должен вернуть XML с ошибкой AccessDenied (это нормально для корня)
```

---

**Главное: убедитесь, что `location /` проксирует на frontend (порт 3000), а не на MinIO!** ✅

