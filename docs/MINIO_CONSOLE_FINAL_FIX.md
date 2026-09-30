# Финальное исправление MinIO Console

## 🔍 Проблема

1. `https://io.logistgo.pro/minio/console/` → AccessDenied (MinIO интерпретирует как bucket)
2. `https://io.logistgo.pro/console/` → 403 Forbidden

## ✅ Решение

MinIO Console должен работать через правильный путь. Проверьте несколько вариантов:

### Вариант 1: Проксировать на корневой путь

Если MinIO Console работает на корневом пути `/` на порту 9001:

```nginx
location /console/ {
    allow 10.1.1.0/24;
    deny all;
    
    # Проксируем на корневой путь MinIO Console
    proxy_pass http://10.1.1.215:9001/;
    proxy_http_version 1.1;
    # ...
}
```

### Вариант 2: Использовать правильный путь /minio/console/

Если MinIO Console действительно работает на `/minio/console/`, нужно правильно настроить rewrite:

```nginx
location /console/ {
    allow 10.1.1.0/24;
    deny all;
    
    # Преобразуем путь
    rewrite ^/console/(.*)$ /minio/console/$1 break;
    rewrite ^/console$ /minio/console/ permanent;
    
    # Проксируем БЕЗ слэша в конце
    proxy_pass http://10.1.1.215:9001;
    proxy_http_version 1.1;
    # ...
}
```

### Вариант 3: Использовать location /minio/console/ напрямую

```nginx
location /minio/console/ {
    allow 10.1.1.0/24;
    deny all;
    
    # Проксируем напрямую без преобразования
    proxy_pass http://10.1.1.215:9001/minio/console/;
    proxy_http_version 1.1;
    # ...
}
```

## 🔍 Диагностика

### Проверьте, на каком пути работает MinIO Console:

```bash
# На сервере:
curl http://10.1.1.215:9001/
curl http://10.1.1.215:9001/minio/console/
curl http://10.1.1.215:9001/console/

# Один из них должен вернуть HTML страницу
```

### Проверьте конфигурацию MinIO:

```bash
# На сервере:
sudo systemctl cat minio | grep -i console
# или
ps aux | grep minio
```

## 🎯 Рекомендуемое решение

Попробуйте использовать location для `/minio/console/` напрямую:

```nginx
# MinIO Console - прямой доступ
location /minio/console/ {
    allow 10.1.1.0/24;
    deny all;
    
    proxy_pass http://10.1.1.215:9001/minio/console/;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_buffering off;
    proxy_request_buffering off;
    client_max_body_size 100M;
    
    proxy_read_timeout 300s;
    proxy_connect_timeout 10s;
    proxy_send_timeout 300s;
}

# Редирект с /console/ на /minio/console/
location = /console {
    allow 10.1.1.0/24;
    deny all;
    return 301 /minio/console/;
}

location = /console/ {
    allow 10.1.1.0/24;
    deny all;
    return 301 /minio/console/;
}
```

## ✅ После применения

1. **Примените конфигурацию:**
   ```bash
   sudo cp logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Откройте в браузере:**
   ```
   https://io.logistgo.pro/minio/console/
   ```

---

**Попробуйте открыть `/minio/console/` напрямую - это должно работать!** 🎯

