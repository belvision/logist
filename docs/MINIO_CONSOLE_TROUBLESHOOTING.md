# Пошаговая диагностика MinIO Console

## 🔍 Шаг 1: Проверьте, что конфигурация применена

```bash
# На сервере:
sudo cat /etc/nginx/conf.d/logistgo.pro.conf | grep -A 5 "location /console/"

# Должна быть строка:
# proxy_pass http://10.1.1.215:9001/;
```

Если там `127.0.0.1:9001` - конфигурация не применена!

## 🔍 Шаг 2: Проверьте конфигурацию nginx

```bash
# На сервере:
sudo nginx -t

# Должно быть: "nginx: configuration file /etc/nginx/nginx.conf test is successful"
# Если есть ошибки - исправьте их
```

## 🔍 Шаг 3: Проверьте, что nginx перезагружен

```bash
# На сервере:
sudo systemctl status nginx

# Должен быть "active (running)"
# Проверьте время последнего перезапуска
```

## 🔍 Шаг 4: Проверьте прямой доступ к MinIO Console

```bash
# На сервере:
curl -v http://10.1.1.215:9001/

# Должен вернуть HTML страницу (не ошибку)
# Если "Connection refused" - MinIO не запущен
```

## 🔍 Шаг 5: Проверьте доступ через nginx

```bash
# На сервере:
curl -v https://io.logistgo.pro/console/ -H "Host: io.logistgo.pro"

# Проверьте код ответа:
# - 200 OK - все работает
# - 403 Forbidden - проблема с allow/deny
# - 502 Bad Gateway - MinIO не доступен
# - 404 Not Found - неправильный путь
```

## 🔍 Шаг 6: Проверьте логи nginx

```bash
# На сервере в одном терминале:
sudo tail -f /var/log/nginx/error.log

# В другом терминале или в браузере:
# Попробуйте открыть https://io.logistgo.pro/console/

# Смотрите, что появляется в логах
```

Также проверьте access.log:

```bash
sudo tail -f /var/log/nginx/access.log
```

## 🔍 Шаг 7: Проверьте ваш IP адрес

```bash
# На вашем компьютере (через VPN):
ipconfig  # Windows
# или
ifconfig  # Linux/Mac

# Убедитесь, что ваш IP начинается с 10.1.1.
```

Если ваш IP не из сети 10.1.1.0/24, добавьте его в allow:

```nginx
location /console/ {
    allow 10.1.1.0/24;
    allow YOUR_IP_ADDRESS;  # Добавьте ваш IP
    deny all;
    # ...
}
```

## 🔍 Шаг 8: Временно разрешите доступ всем (для тестирования)

Временно закомментируйте allow/deny для проверки:

```nginx
location /console/ {
    # allow 10.1.1.0/24;
    # deny all;
    
    proxy_pass http://10.1.1.215:9001/;
    # ...
}
```

После этого:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Попробуйте открыть консоль. Если работает - проблема в allow/deny.

## 🔍 Шаг 9: Проверьте, какой путь использует MinIO Console

```bash
# На сервере:
curl http://10.1.1.215:9001/
curl http://10.1.1.215:9001/console/
curl http://10.1.1.215:9001/minio/console/

# Один из них должен вернуть HTML страницу
```

Если MinIO Console работает на `/minio/console/`, измените конфигурацию:

```nginx
location /console/ {
    # ...
    rewrite ^/console/(.*)$ /minio/console/$1 break;
    proxy_pass http://10.1.1.215:9001;
    # ...
}
```

## 🔍 Шаг 10: Проверьте статус MinIO

```bash
# На сервере:
sudo systemctl status minio
# или
ps aux | grep minio
# или
docker ps | grep minio
```

## 🐛 Частые проблемы и решения

### Проблема 1: 403 Forbidden

**Причина:** Ваш IP не в списке allow

**Решение:**
```nginx
location /console/ {
    allow 10.1.1.0/24;
    allow YOUR_IP;  # Добавьте ваш IP
    deny all;
    # ...
}
```

### Проблема 2: 502 Bad Gateway

**Причина:** MinIO не доступен на 10.1.1.215:9001

**Решение:**
```bash
# Проверьте, что MinIO запущен:
sudo systemctl start minio

# Проверьте порт:
sudo netstat -tlnp | grep 9001
```

### Проблема 3: 404 Not Found

**Причина:** Неправильный путь в proxy_pass

**Решение:** Проверьте, что в proxy_pass есть слэш в конце:
```nginx
proxy_pass http://10.1.1.215:9001/;  # Слэш в конце!
```

### Проблема 4: Connection refused

**Причина:** MinIO не запущен или слушает на другом порту

**Решение:**
```bash
# Проверьте порты:
sudo netstat -tlnp | grep 900

# Запустите MinIO если нужно:
sudo systemctl start minio
```

## ✅ Чек-лист

- [ ] Конфигурация скопирована на сервер
- [ ] `nginx -t` проходит без ошибок
- [ ] nginx перезагружен
- [ ] MinIO Console доступен на `http://10.1.1.215:9001/`
- [ ] Ваш IP в сети 10.1.1.0/24 или добавлен в allow
- [ ] Логи nginx проверены
- [ ] proxy_pass указывает на `10.1.1.215:9001/` (не 127.0.0.1)

## 🚀 Быстрая проверка

Выполните все команды по порядку и сообщите результаты:

```bash
# 1. Проверка конфигурации
sudo nginx -t

# 2. Проверка порта
sudo netstat -tlnp | grep 9001

# 3. Прямой доступ
curl -v http://10.1.1.215:9001/

# 4. Доступ через nginx
curl -v https://io.logistgo.pro/console/

# 5. Логи
sudo tail -20 /var/log/nginx/error.log
```

---

**Выполните все шаги и сообщите результаты!** 🔍

