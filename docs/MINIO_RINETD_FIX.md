# Исправление конфигурации MinIO с rinetd

## 🔍 Проблема

MinIO Console не открывается, ошибка:
```
curl: (7) Failed to connect to 127.0.0.1 port 9001
```

Но проверка показывает:
```
tcp  0  0  10.1.1.215:9001  0.0.0.0:*  LISTEN  1155/rinetd
```

## ✅ Причина

MinIO Console слушает на **`10.1.1.215:9001`**, а не на `127.0.0.1:9001`!

Также используется **rinetd** для проброса портов, что означает, что MinIO работает на внешнем IP, а не на localhost.

## 🔧 Решение

### Шаг 1: Проверьте порт 9000 для MinIO API

```bash
sudo netstat -tlnp | grep 9000

# Должно быть что-то вроде:
# tcp  0  0  10.1.1.215:9000  ...  LISTEN  .../rinetd
```

### Шаг 2: Обновите конфигурацию nginx

Измените `proxy_pass` с `127.0.0.1` на `10.1.1.215`:

```nginx
# MinIO Console
location /console/ {
    allow 10.1.1.0/24;
    deny all;
    
    # Изменить с 127.0.0.1 на 10.1.1.215
    proxy_pass http://10.1.1.215:9001/;
    # ...
}

# MinIO API
location /logistic-pro/ {
    # Изменить с 127.0.0.1 на 10.1.1.215
    proxy_pass http://10.1.1.215:9000/;
    # ...
}
```

### Шаг 3: Примените конфигурацию

```bash
# Скопируйте обновленный файл на сервер
scp logistgo.pro.conf logistgo@10.1.1.215:/tmp/

# На сервере:
sudo cp /tmp/logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Проверка rinetd

### Проверьте конфигурацию rinetd

```bash
# На сервере:
cat /etc/rinetd.conf
# или
sudo cat /etc/rinetd.conf

# Должны быть строки типа:
# 10.1.1.215 9000 127.0.0.1 9000
# 10.1.1.215 9001 127.0.0.1 9001
```

### Проверьте статус rinetd

```bash
sudo systemctl status rinetd
```

## 🎯 Альтернативные варианты

### Вариант 1: Если MinIO работает напрямую на 10.1.1.215

Используйте `10.1.1.215` в `proxy_pass` (как исправлено выше).

### Вариант 2: Если rinetd пробрасывает на localhost

Если rinetd пробрасывает `10.1.1.215:9001` → `127.0.0.1:9001`, то можно использовать `127.0.0.1`, но нужно проверить конфигурацию rinetd.

### Вариант 3: Прямое подключение к MinIO

Если MinIO работает напрямую (без rinetd), проверьте реальный порт:

```bash
# Проверьте, где реально работает MinIO:
sudo netstat -tlnp | grep minio
# или
ps aux | grep minio
```

## ✅ Проверка после исправления

### 1. Проверьте доступность портов

```bash
# На сервере:
curl http://10.1.1.215:9001/
curl http://10.1.1.215:9000/
```

### 2. Проверьте через nginx

```bash
# На сервере:
curl https://io.logistgo.pro/console/
curl https://io.logistgo.pro/logistic-pro/
```

### 3. Проверьте в браузере

- `https://io.logistgo.pro/console/` - должен открыться MinIO Console
- `https://io.logistgo.pro/logistic-pro/...` - должен открыться MinIO API

## 🔧 Дополнительная диагностика

### Проверка 1: Куда реально идет запрос

```bash
# На сервере:
sudo tcpdump -i any -n port 9001

# В другом терминале:
curl http://10.1.1.215:9001/

# Смотрите, куда идут пакеты
```

### Проверка 2: Проверка конфигурации MinIO

```bash
# Проверьте, как запущен MinIO:
ps aux | grep minio

# Или если в systemd:
sudo systemctl cat minio
```

### Проверка 3: Логи nginx

```bash
# На сервере:
sudo tail -f /var/log/nginx/error.log

# Попробуйте открыть консоль в браузере
# Смотрите ошибки в логах
```

## 📝 Итоговая конфигурация

После исправления должно быть:

```nginx
location /console/ {
    allow 10.1.1.0/24;
    deny all;
    
    proxy_pass http://10.1.1.215:9001/;  # Исправлено!
    # ...
}

location /logistic-pro/ {
    proxy_pass http://10.1.1.215:9000/;  # Исправлено!
    # ...
}
```

---

**Главное: используйте `10.1.1.215` вместо `127.0.0.1`, так как MinIO слушает на внешнем IP!** ✅

