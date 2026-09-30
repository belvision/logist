# MinIO Production Setup Guide

## Текущая конфигурация MinIO

### Локальная разработка (Docker)
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=logistic-pro
```

### Продакшен конфигурация
```env
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
MINIO_BUCKET_NAME=logistic-pro
```

## Информация о продакшен MinIO

- **URL**: https://io.logistgo.pro
- **Консоль**: https://io.logistgo.pro/console
- **Доступ**: minioadmin / JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
- **Бакеты**: 
  - `data`
  - `logistic-pro` (используется в приложении)

## Что нужно добавить в .env на продакшене

Добавьте следующие переменные в файл `.env` на бэкенде:

```env
# MinIO Production Settings
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
MINIO_BUCKET_NAME=logistic-pro
```

## Проверка работы

После настройки переменных окружения:

1. Перезапустите бэкенд
2. Проверьте логи - должно появиться сообщение: `✅ [MINIO] MinIO initialized successfully`
3. Попробуйте загрузить файл через API
4. Проверьте доступность файлов по URL: `https://io.logistgo.pro/logistic-pro/...`

## Структура URL файлов

Файлы будут доступны по адресу:
```
https://io.logistgo.pro/logistic-pro/{путь_к_файлу}
```

Например:
- `https://io.logistgo.pro/logistic-pro/cars/uuid-timestamp.jpg`
- `https://io.logistgo.pro/logistic-pro/documents/uuid.pdf`

## Безопасность

- MinIO настроен с reverse proxy и SSL
- Бакет `logistic-pro` имеет политику публичного чтения для изображений
- Доступ к консоли MinIO защищен паролем
