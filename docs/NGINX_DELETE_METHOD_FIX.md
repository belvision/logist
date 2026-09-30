# Исправление DELETE метода в nginx

## 🚨 Проблема

При попытке удаления аватара возникает ошибка **406 (Not Acceptable)** с HTML ответом вместо JSON. Это происходит потому, что nginx блокирует DELETE запросы.

## ✅ Решение

### 1. Обновить nginx конфигурацию на сервере

На продакшен сервере:

```bash
# Скопировать обновленную конфигурацию
cd /path/to/logistPro
sudo cp logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf

# Проверить конфигурацию nginx
sudo nginx -t

# Если проверка успешна, перезагрузить nginx
sudo systemctl reload nginx
```

### 2. Что изменено в конфигурации

#### Добавлено в `location /api/`:

1. **Разрешение HTTP методов:**
   ```nginx
   if ($request_method !~ ^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$ ) {
       return 405;
   }
   ```

2. **CORS заголовки для API:**
   ```nginx
   add_header 'Access-Control-Allow-Origin' '$http_origin' always;
   add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
   add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
   add_header 'Access-Control-Allow-Credentials' 'true' always;
   ```

3. **Обработка preflight запросов:**
   ```nginx
   if ($request_method = 'OPTIONS') {
       add_header 'Access-Control-Allow-Origin' '$http_origin' always;
       add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
       add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
       add_header 'Access-Control-Max-Age' 1728000;
       add_header 'Content-Type' 'text/plain charset=UTF-8';
       add_header 'Content-Length' 0;
       return 204;
   }
   ```

### 3. Проверка

После обновления конфигурации:

```bash
# Проверить, что nginx работает
sudo systemctl status nginx

# Проверить логи nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 4. Тестирование DELETE метода

Попробуйте удалить аватар через браузер. Вы должны увидеть в логах nginx:

```
127.0.0.1 - - [23/Oct/2025:11:48:50 +0000] "DELETE /api/user/me/avatar HTTP/1.1" 200 ...
```

Вместо:

```
127.0.0.1 - - [23/Oct/2025:11:48:50 +0000] "DELETE /api/user/me/avatar HTTP/1.1" 406 ...
```

## 🎯 Ожидаемый результат

После исправления:

- ✅ DELETE запросы проходят через nginx
- ✅ Backend получает DELETE запросы
- ✅ Аватары удаляются корректно
- ✅ Возвращается JSON ответ вместо HTML
- ✅ Нет ошибок 406

## ⚠️ Важно

1. Всегда проверяйте конфигурацию перед перезагрузкой: `sudo nginx -t`
2. Используйте `reload` вместо `restart` для плавного обновления
3. Проверяйте логи после обновления
4. Сделайте backup старой конфигурации перед изменениями

## 🔧 Альтернативное решение (если не работает)

Если проблема сохраняется, проверьте:

1. **ModSecurity:** может блокировать DELETE
   ```nginx
   modsecurity off;  # Уже отключено в конфигурации
   ```

2. **Firewall:** может блокировать DELETE метод
   ```bash
   sudo ufw status
   ```

3. **Backend логи:** проверьте, доходит ли запрос до backend
   ```bash
   pm2 logs backend | grep DELETE
   ```
