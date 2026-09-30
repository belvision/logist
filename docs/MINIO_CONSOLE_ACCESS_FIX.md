# Исправление доступа к MinIO Console (403 Forbidden)

## 🔍 Проблема

При попытке открыть `https://io.logistgo.pro/console` получаем ошибку **403 Forbidden**.

## ✅ Решения

### Вариант 1: Настроить nginx для проксирования MinIO Console (рекомендуется)

Добавьте в конфигурацию nginx (`/etc/nginx/conf.d/logistgo.pro.conf` или `logistgo.pro.conf`) следующий блок:

```nginx
# MinIO Console (только для администраторов)
location /console/ {
    # Ограничение доступа по IP (опционально, но рекомендуется)
    # allow 10.1.1.0/24;  # Разрешить доступ только с внутренней сети
    # deny all;
    
    proxy_pass http://127.0.0.1:9001/;  # MinIO Console обычно на порту 9001
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # WebSocket support для MinIO Console
    proxy_buffering off;
    proxy_request_buffering off;
    client_max_body_size 100M;
    
    # Таймауты
    proxy_read_timeout 300s;
    proxy_connect_timeout 10s;
    proxy_send_timeout 300s;
}

# MinIO API (для доступа к файлам)
location /logistic-pro/ {
    proxy_pass http://127.0.0.1:9000/;  # MinIO API на порту 9000
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Для загрузки больших файлов
    client_max_body_size 100M;
    proxy_buffering off;
    proxy_request_buffering off;
}
```

**Важно:** 
- MinIO Console обычно работает на порту **9001**
- MinIO API работает на порту **9000**
- Убедитесь, что эти порты открыты и MinIO запущен

После добавления конфигурации:
```bash
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx  # Перезагрузка nginx
```

### Вариант 2: Доступ через SSH туннель (безопасно, но требует SSH доступ)

Если у вас есть SSH доступ к серверу:

```bash
# Создайте SSH туннель
ssh -L 9001:localhost:9001 user@io.logistgo.pro

# Затем откройте в браузере:
# http://localhost:9001
```

### Вариант 3: Использовать MinIO Client (mc) для загрузки файлов

Если консоль недоступна, можно загружать файлы через командную строку:

#### Установка MinIO Client

**Windows:**
1. Скачайте `mc.exe` с https://min.io/download
2. Поместите в папку, доступную из PATH

**Linux/Mac:**
```bash
# Linux
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Mac
brew install minio/stable/mc
```

#### Настройка и использование

```bash
# Настройка подключения
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t

# Проверка подключения
mc ls myminio/logistic-pro

# Создание папок
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers
mc mb myminio/logistic-pro/backgrounds/cargo-owners
mc mb myminio/logistic-pro/backgrounds/team

# Загрузка файла
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Загрузка всех файлов из папки
mc cp --recursive ./images/ myminio/logistic-pro/backgrounds/home/

# Просмотр файлов
mc ls myminio/logistic-pro/backgrounds/home/

# Удаление файла
mc rm myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

### Вариант 4: Создать простой API endpoint для загрузки (для разработчиков)

Можно создать специальный endpoint в backend для загрузки фоновых изображений, но это требует изменения кода.

---

## 🔧 Проверка конфигурации MinIO

Убедитесь, что MinIO запущен и доступен:

```bash
# Проверка статуса MinIO (на сервере)
sudo systemctl status minio
# или
docker ps | grep minio

# Проверка портов
sudo netstat -tlnp | grep 900
# Должны быть открыты порты 9000 (API) и 9001 (Console)
```

---

## 📝 Рекомендации по безопасности

1. **Ограничьте доступ к консоли по IP:**
   ```nginx
   location /console/ {
       allow 10.1.1.0/24;  # Только внутренняя сеть
       allow YOUR_IP_ADDRESS;  # Ваш IP
       deny all;
       # ... остальная конфигурация
   }
   ```

2. **Используйте базовую аутентификацию nginx:**
   ```nginx
   location /console/ {
       auth_basic "MinIO Console";
       auth_basic_user_file /etc/nginx/.htpasswd;
       # ... остальная конфигурация
   }
   ```

3. **Или используйте VPN** для доступа к консоли

---

## 🚀 Быстрое решение (временное)

Если нужно срочно загрузить файлы, используйте MinIO Client (mc) - это самый быстрый способ без настройки nginx.

---

**Дата создания**: 2025-12-06  
**Статус**: ⚠️ Требует настройки nginx или использования альтернативных методов

