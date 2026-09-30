# Удаление локального MinIO из проекта

## Дата: 28 октября 2025

## Проблема

В проекте использовался локальный MinIO в Docker для разработки, но после развертывания продакшн MinIO сервера на `io.logistgo.pro`, локальный MinIO стал избыточным. Все окружения (локальная разработка и продакшн) должны использовать единый серверный MinIO.

## Внесенные изменения

### 1. Удален `docker-compose.yml`
Файл `docker-compose.yml` содержал только конфигурацию локального MinIO контейнера и был полностью удален из проекта.

**Было:**
```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: logistic-pro-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
```

**Стало:** Файл удален.

### 2. Обновлены дефолтные значения MinIO в `apps/backend/src/db/config.ts`

Дефолтные значения для подключения к MinIO изменены с локальных на серверные:

**Было:**
```typescript
minio: {
  endpoint: getEnv(string('MINIO_ENDPOINT')).default('localhost') as string,
  port: getEnv(integer('MINIO_PORT')).default(9000) as number,
  useSSL: getEnv(boolean('MINIO_USE_SSL')).default(false) as boolean,
  accessKey: getEnv(string('MINIO_ACCESS_KEY')).default('minioadmin') as string,
  secretKey: getEnv(string('MINIO_SECRET_KEY')).default('minioadmin') as string,
  bucketName: getEnv(string('MINIO_BUCKET_NAME')).default('logistic-pro') as string,
}
```

**Стало:**
```typescript
minio: {
  endpoint: getEnv(string('MINIO_ENDPOINT')).default('io.logistgo.pro') as string,
  port: getEnv(integer('MINIO_PORT')).default(443) as number,
  useSSL: getEnv(boolean('MINIO_USE_SSL')).default(true) as boolean,
  accessKey: getEnv(string('MINIO_ACCESS_KEY')).required('Missing MINIO_ACCESS_KEY') as string,
  secretKey: getEnv(string('MINIO_SECRET_KEY')).required('Missing MINIO_SECRET_KEY') as string,
  bucketName: getEnv(string('MINIO_BUCKET_NAME')).default('logistic-pro') as string,
}
```

**Изменения:**
- `endpoint`: `localhost` → `io.logistgo.pro`
- `port`: `9000` → `443`
- `useSSL`: `false` → `true`
- `accessKey` и `secretKey`: теперь обязательные (`.required()` вместо `.default()`), чтобы избежать использования небезопасных дефолтных значений

### 3. Удален скрипт `check-minio-config.sh`

Скрипт проверки конфигурации MinIO был удален, так как он был ориентирован на проверку локального подключения и больше не актуален.

### 4. Обновлены скрипты в корневом `package.json`

Удалены скрипты, связанные с docker-compose:

**Было:**
```json
"scripts": {
  "dev": "docker-compose up -d && turbo run dev",
  "dev:stop": "docker-compose down",
  "minio:start": "docker-compose up -d minio",
  "minio:stop": "docker-compose stop minio",
  ...
}
```

**Стало:**
```json
"scripts": {
  "dev": "turbo run dev",
  ...
}
```

Удалены команды:
- `dev:stop` - остановка docker-compose
- `minio:start` - запуск локального MinIO
- `minio:stop` - остановка локального MinIO

## Конфигурация для всех окружений

Теперь для всех окружений (разработка и продакшн) необходимо использовать переменные окружения из `apps/backend/env.example`:

```bash
# MinIO Production Settings
MINIO_ENDPOINT=io.logistgo.pro
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<ваш_секретный_ключ>
MINIO_BUCKET_NAME=logistic-pro
```

## Инструкции для разработчиков

### Локальная разработка

1. Убедитесь, что файл `apps/backend/.env` содержит правильные настройки MinIO:
   ```bash
   cd apps/backend
   cp env.example .env
   ```

2. В файле `.env` должны быть указаны реальные креденшалы для серверного MinIO

3. Больше не нужно запускать `docker-compose up` для MinIO

4. Все файлы (аватары, документы, изображения) будут загружаться на серверный MinIO

### Продакшн

Конфигурация остается без изменений. Все переменные окружения уже настроены в `ecosystem.config.js` или в `.env` файле.

## Преимущества изменений

1. ✅ **Единая среда хранения** - все окружения используют один и тот же серверный MinIO
2. ✅ **Упрощение инфраструктуры** - нет необходимости в локальном Docker для MinIO
3. ✅ **Консистентность данных** - разработчики видят те же файлы, что и на продакшене
4. ✅ **Безопасность** - обязательное указание креденшалов вместо дефолтных значений
5. ✅ **Упрощение настройки** - меньше шагов для запуска проекта локально

## Проверка

После внесения изменений убедитесь, что:

1. Backend успешно запускается:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. Загрузка файлов работает (проверьте загрузку аватара или документа)

3. В логах нет ошибок подключения к MinIO

## Связанные документы

- [MINIO_PRODUCTION_SETUP.md](./MINIO_PRODUCTION_SETUP.md)
- [MINIO_PRODUCTION_FIX.md](./MINIO_PRODUCTION_FIX.md)
- [AVATAR_UPLOAD_TROUBLESHOOTING.md](./AVATAR_UPLOAD_TROUBLESHOOTING.md)

