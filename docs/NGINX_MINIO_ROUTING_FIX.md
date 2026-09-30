# Исправление проблемы с маршрутизацией nginx (AccessDenied от MinIO)

## 🔍 Проблема

При открытии `https://io.logistgo.pro/` получаете ошибку AccessDenied от MinIO вместо frontend.

**Ошибка:**
```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access Denied.</Message>
<Resource>/</Resource>
</Error>
```

## 🔍 Причина

Запрос идет к MinIO (порт 9000) вместо frontend (порт 3000). Возможные причины:

1. **Неправильный server_name** - запрос идет на `io.logistgo.pro`, а в конфигурации указан только `logistgo.pro`
2. **Конфликт конфигураций** - может быть другая конфигурация nginx, которая перехватывает запросы
3. **Конфигурация не применена** - на сервере используется старая конфигурация

## ✅ Решение

### Шаг 1: Обновите server_name

В конфигурации добавлен `io.logistgo.pro` в `server_name`:

```nginx
server_name logistgo.pro www.logistgo.pro io.logistgo.pro;
```

### Шаг 2: Проверьте порядок location блоков

Важно, чтобы более специфичные location были раньше общего `location /`:

```nginx
# Специфичные пути (должны быть первыми)
location /console/ { ... }
location /logistic-pro/ { ... }
location /api/ { ... }

# Общий путь (должен быть последним)
location / {
    proxy_pass http://127.0.0.1:3000;  # Frontend
}
```

### Шаг 3: Примените конфигурацию на сервере

```bash
# Скопируйте на сервер
scp logistgo.pro.conf logistgo@10.1.1.215:/tmp/

# На сервере:
ssh logistgo@10.1.1.215
sudo cp /tmp/logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 4: Проверьте, нет ли других конфигураций

```bash
# На сервере:
sudo ls -la /etc/nginx/conf.d/
sudo grep -r "io.logistgo.pro" /etc/nginx/

# Проверьте, нет ли других server блоков для io.logistgo.pro
```

### Шаг 5: Проверьте логи nginx

```bash
# На сервере:
sudo tail -f /var/log/nginx/access.log

# Откройте https://io.logistgo.pro/ в браузере
# Смотрите, куда идет запрос
```

## 🔧 Дополнительная диагностика

### Проверка 1: Какой server блок обрабатывает запрос

```bash
# На сервере:
sudo nginx -T | grep -A 5 "server_name.*io.logistgo.pro"

# Должен быть виден ваш server блок
```

### Проверка 2: Проверка маршрутизации

```bash
# На сервере:
curl -v https://io.logistgo.pro/ -H "Host: io.logistgo.pro"

# Проверьте заголовки ответа
# Должен быть ответ от frontend (порт 3000), а не от MinIO
```

### Проверка 3: Проверка frontend

```bash
# На сервере:
curl http://127.0.0.1:3000/

# Должен вернуть HTML страницу frontend
# Если нет - frontend не запущен
```

## 🐛 Возможные проблемы

### Проблема 1: Frontend не запущен

Если frontend не запущен, nginx может проксировать на MinIO по ошибке.

**Решение:**
```bash
# Проверьте статус frontend:
pm2 status
# или
sudo systemctl status logistgo-frontend

# Запустите если нужно:
pm2 start logistgo-frontend
```

### Проблема 2: Другая конфигурация перехватывает запросы

Может быть другая конфигурация nginx с более высоким приоритетом.

**Решение:**
```bash
# На сервере проверьте все конфигурации:
sudo nginx -T | grep -B 5 -A 20 "server_name.*io.logistgo.pro"

# Удалите или исправьте конфликтующие конфигурации
```

### Проблема 3: Неправильный Host header

MinIO может требовать правильный Host header.

**Решение:** Убедитесь, что в location /logistic-pro/ правильно установлен Host:
```nginx
location /logistic-pro/ {
    proxy_pass http://127.0.0.1:9000/;
    proxy_set_header Host $host;  # Важно!
    # ...
}
```

## ✅ Правильная конфигурация

Убедитесь, что конфигурация выглядит так:

```nginx
server {
    listen 10.1.1.215:443 ssl;
    http2 on;
    server_name logistgo.pro www.logistgo.pro io.logistgo.pro;  # Все домены
    
    # ... SSL настройки ...
    
    # Специфичные пути (в порядке приоритета)
    location /console/ {
        # MinIO Console
        proxy_pass http://127.0.0.1:9001/;
        # ...
    }
    
    location /logistic-pro/ {
        # MinIO API
        proxy_pass http://127.0.0.1:9000/;
        # ...
    }
    
    location /api/ {
        # Backend API
        proxy_pass http://127.0.0.1:5555/api/;
        # ...
    }
    
    # Общий путь (последний!)
    location / {
        # Frontend
        proxy_pass http://127.0.0.1:3000;
        # ...
    }
}
```

## 🚀 После исправления

1. **Проверьте конфигурацию:**
   ```bash
   sudo nginx -t
   ```

2. **Перезагрузите nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Проверьте доступ:**
   - `https://io.logistgo.pro/` - должен открыться frontend
   - `https://io.logistgo.pro/logistic-pro/...` - должен открыться MinIO
   - `https://io.logistgo.pro/console/` - должен открыться MinIO Console

---

**После применения исправлений все должно работать правильно!** ✅

