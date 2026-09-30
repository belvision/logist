# Очистка файлов в корне проекта

## 📊 Анализ файлов

### ✅ НУЖНЫЕ ФАЙЛЫ (оставить)

| Файл | Статус | Назначение |
|------|--------|------------|
| `package.json` | ✅ Используется | Monorepo конфигурация, зависимости |
| `package-lock.json` | ✅ Используется | Lock-файл NPM |
| `tsconfig.json` | ✅ Используется | TypeScript конфиг для monorepo |
| `tsconfig.tsbuildinfo` | ✅ Используется | TypeScript build cache |
| `turbo.json` | ✅ Используется | Turborepo конфигурация для билдов |
| `ecosystem.config.js` | ✅ Используется | **АКТИВНЫЙ** PM2 конфиг для production |
| `logistgo.pro.conf` | ✅ Используется | **АКТИВНЫЙ** nginx конфиг (в /etc/nginx/conf.d/) |
| `README.md` | ✅ Используется | Основная документация проекта |
| `docker-compose.yml` | ✅ Полезен | Для локальной разработки с MinIO |
| `docs/` | ✅ Используется | Вся документация проекта |

### 🔧 ВСПОМОГАТЕЛЬНЫЕ СКРИПТЫ (можно оставить)

| Файл | Статус | Назначение |
|------|--------|------------|
| `check-minio-config.sh` | ⚙️ Вспомогательный | Диагностика MinIO на сервере |
| `rebuild-backend.sh` | ⚙️ Вспомогательный | Быстрая пересборка backend на сервере |
| `setup-production-env.sh` | ⚙️ Вспомогательный | Создание .env для production |

**Рекомендация:** Можно оставить эти скрипты - они помогают при деплое и диагностике.

### ❌ УДАЛИТЬ (дубликаты и старые версии)

| Файл | Причина удаления |
|------|-----------------|
| `apps/frontend/logistgo.pro.conf` | ❌ Дубликат конфига nginx, используется корневой `logistgo.pro.conf` |
| `nginx-fixed.conf` | ❌ Старая версия nginx конфига (упрощенная) |
| `nginx-websocket.conf` | ❌ Старая версия nginx конфига (с WebSocket настройками) |

## 📝 Детальный анализ

### 1. nginx-fixed.conf
**Статус:** Старая версия  
**Причина:** Упрощенная версия nginx конфига без лимитов и некоторых настроек. Заменена на `logistgo.pro.conf`.

### 2. nginx-websocket.conf
**Статус:** Старая версия  
**Причина:** Версия с настройками WebSocket, но уже интегрирована в активный `logistgo.pro.conf`.

### 3. apps/frontend/logistgo.pro.conf
**Статус:** Дубликат  
**Причина:** Почти идентичен корневому `logistgo.pro.conf`. Используется корневая версия.

**Различия:**
- Корневой: имеет `/ws/notifications` маршрут + более новые настройки
- Frontend: более старая версия без `/ws/notifications`

## 🗑️ Команды для удаления

```bash
# Перейти в корень проекта
cd ~/www/logistgo.pro/logistgo-next  # или ваш путь

# Удалить устаревшие nginx конфиги
rm -f nginx-fixed.conf
rm -f nginx-websocket.conf
rm -f apps/frontend/logistgo.pro.conf

# Проверить что удалено
git status
```

## 📋 Структура после очистки

```
logistPro/
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/                     # Документация
├── node_modules/
├── check-minio-config.sh    # Вспомогательный скрипт
├── docker-compose.yml       # Для локальной разработки
├── ecosystem.config.js      # ✅ АКТИВНЫЙ PM2 конфиг
├── logistgo.pro.conf       # ✅ АКТИВНЫЙ nginx конфиг
├── package.json            # Monorepo
├── package-lock.json
├── README.md
├── rebuild-backend.sh      # Вспомогательный скрипт
├── setup-production-env.sh # Вспомогательный скрипт
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── turbo.json
```

## ✅ Результат

- **Удалено:** 3 устаревших конфига
- **Оставлено:** Все активно используемые файлы
- **Чистота:** Корень проекта теперь содержит только актуальные файлы

## 🔒 Безопасность

Все удаляемые файлы - это дубликаты или старые версии конфигураций, которые не используются в production.

**Git хранит историю**, поэтому можно всегда вернуть удаленные файлы если понадобится:
```bash
git log -- nginx-fixed.conf
git checkout <commit> -- nginx-fixed.conf
```

