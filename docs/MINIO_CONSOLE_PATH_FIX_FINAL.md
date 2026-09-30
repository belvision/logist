# Исправление пути MinIO Console

## 🔍 Проблема

MinIO Console работает на пути `/minio/console/`, а не на `/console/`.

При проверке:
```bash
curl http://10.1.1.215:9001/minio/console/
# Возвращает HTML страницу ✅
```

Но в nginx мы проксируем `/console/` на `http://10.1.1.215:9001/`, что неправильно.

## ✅ Решение

Используем `rewrite` для преобразования пути:

```nginx
location /console/ {
    allow 10.1.1.0/24;
    deny all;
    
    # Преобразуем /console/ в /minio/console/
    rewrite ^/console/(.*)$ /minio/console/$1 break;
    rewrite ^/console$ /minio/console/ permanent;
    
    # Важно: БЕЗ слэша в конце proxy_pass при использовании rewrite
    proxy_pass http://10.1.1.215:9001;
    # ...
}
```

## 🔧 Объяснение rewrite

- `rewrite ^/console/(.*)$ /minio/console/$1 break;` - преобразует `/console/...` в `/minio/console/...`
- `rewrite ^/console$ /minio/console/ permanent;` - редирект с `/console` на `/console/`
- `break` - останавливает дальнейшую обработку rewrite правил
- `permanent` - возвращает 301 редирект

## ✅ После исправления

1. **Примените конфигурацию:**
   ```bash
   sudo cp logistgo.pro.conf /etc/nginx/conf.d/logistgo.pro.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Проверьте доступ:**
   ```bash
   curl -v https://io.logistgo.pro/console/
   # Должен вернуть HTML страницу MinIO Console
   ```

3. **Откройте в браузере:**
   ```
   https://io.logistgo.pro/console/
   ```
   Должна открыться страница входа в MinIO Console.

## 🎯 Итоговая маршрутизация

- `https://io.logistgo.pro/console/` → `http://10.1.1.215:9001/minio/console/` ✅
- `https://io.logistgo.pro/logistic-pro/...` → `http://10.1.1.215:9000/...` ✅

---

**Теперь консоль должна открываться!** 🎉

