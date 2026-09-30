# Исправление MinIO Console с использованием regex

## 🔍 Проблема

Запрос `/minio/console/` все еще попадает в MinIO API (порт 9000) вместо MinIO Console (порт 9001).

Ошибка показывает, что MinIO API интерпретирует `/minio/console/` как bucket "minio" с ключом "console/".

## ✅ Решение

Используем regex location с более высоким приоритетом:

```nginx
# MinIO Console - используем regex для точного совпадения
location ~ ^/minio/console(/.*)?$ {
    allow 10.1.1.0/24;
    deny all;
    
    # Проксируем с сохранением полного пути
    proxy_pass http://10.1.1.215:9001$request_uri;
    proxy_http_version 1.1;
    # ... остальные заголовки
}
```

## 🔧 Объяснение

- `location ~` - regex location (имеет более высокий приоритет)
- `^/minio/console(/.*)?$` - точное совпадение для `/minio/console/` и всех подпутей
- `$request_uri` - сохраняет полный путь запроса при проксировании

## ✅ После применения

1. **Примените конфигурацию:**
   ```bash
   sudo cp logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Проверьте доступ:**
   ```bash
   curl -v https://io.logistgo.pro/minio/console/
   # Должен вернуть HTML страницу MinIO Console
   ```

3. **Откройте в браузере:**
   ```
   https://io.logistgo.pro/minio/console/
   ```

---

**Regex location имеет более высокий приоритет и должен перехватывать запросы раньше обычных location!** ✅

