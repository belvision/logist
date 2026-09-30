# Logist / Логист

**English:** An archived logistics platform project, published for study and reuse. Development by the original owner has stopped. The monorepo contains a Next.js frontend, a Hono/TypeScript backend, PostgreSQL and Drizzle ORM. Six development snapshots are available as branches: `cargo` (default), `cars`, `crm`, `landing`, `s-cargo` and `serg`.

**Русский:** Архивный проект логистической платформы, открытый для изучения и повторного использования. Владелец больше не ведёт разработку. Монорепозиторий содержит интерфейс Next.js, сервер Hono/TypeScript, PostgreSQL и Drizzle ORM. Сохранены снимки шести веток: `cargo` (основная), `cars`, `crm`, `landing`, `s-cargo` и `serg`.

## Publication notes / О публикации

- This public repository starts with clean source snapshots. The previous private Git history is not included because it contained credentials. Runtime files and the legacy `old_project` directory are omitted.
- Этот открытый репозиторий начинается с очищенных снимков исходников. Прежняя закрытая Git-история не опубликована из-за секретов в старых коммитах. Рабочие данные и устаревшая папка `old_project` исключены.
- Replace `REDACTED_SECRET` and other examples with your own local environment settings. Never commit real credentials. Some historical documentation describes earlier deployments and may need adaptation.
- Замените `REDACTED_SECRET` и другие заглушки своими локальными настройками. Не коммитьте настоящие секреты. Часть документации описывает прежние установки и может требовать адаптации.
- Shared as-is, with no ongoing support or production-readiness guarantee. Review dependencies and configuration before deployment. Each branch is a separate development snapshot.
- Проект предоставляется как есть, без дальнейшей поддержки и гарантий готовности к эксплуатации. Перед развёртыванием проверьте зависимости и настройки. Ветки отражают разные стадии разработки.
- License / Лицензия: [MIT](LICENSE). Third-party dependencies retain their own licenses.

---

# LogistGo Pro - Система логистики

Современная веб-платформа для управления логистическими процессами с интеграцией Bitrix24, системой уведомлений и мессенджером.

## 🚀 Быстрый старт

### Установка и запуск

1. **Клонирование репозитория:**
   ```bash
   git clone <repository-url>
   cd logistPro
   ```

2. **Установка зависимостей:**
   ```bash
   npm install
   cd apps/backend && npm install
   cd ../frontend && npm install
   ```

3. **Настройка окружения:**
   - Скопируйте `apps/backend/env.example` в `apps/backend/.env`
   - Настройте переменные окружения согласно [документации по настройке backend](docs/BACKEND_ENV_SETUP.md)

4. **Запуск в режиме разработки:**
   ```bash
   npm run dev
   ```

## 📚 Документация

### 🏗️ Архитектура и разработка
- [Архитектура проекта](docs/PROJECT_ARCHITECTURE.md)
- [Руководство по разработке](docs/DEVELOPMENT_GUIDE.md)
- [Инструкции по развертыванию](docs/DEPLOY_INSTRUCTIONS.md)

### 🔧 Настройка и конфигурация
- [Настройка backend окружения](docs/BACKEND_ENV_SETUP.md)
- [Настройка API конфигурации для продакшена](docs/PRODUCTION_API_CONFIG_FIX.md)
- [Настройка MinIO для продакшена](docs/MINIO_PRODUCTION_SETUP.md)

### 🔐 Безопасность и аутентификация
- [Исправления проблем безопасности](docs/SECURITY_FIXES_SUMMARY.md)
- [Исправление reCAPTCHA и безопасности](docs/RECAPTCHA_SECURITY_FIX.md)
- [Быстрое исправление reCAPTCHA](docs/QUICK_FIX_RECAPTCHA.md)

### 🔗 Интеграции
- [Интеграция с Bitrix24](docs/BITRIX24_INTEGRATION_RESTORE.md)
- [Настройка webhook Bitrix24](docs/BITRIX24_WEBHOOK_SETUP_GUIDE.md)
- [Диагностика Bitrix24](docs/BITRIX24_DIAGNOSTIC.md)
- [Исправление токенов Bitrix24](docs/BITRIX24_TOKEN_FIX.md)
- [Интеграция уведомлений Bitrix24](docs/BITRIX24_NOTIFICATIONS_INTEGRATION.md)

### 📨 Система уведомлений
- [Система уведомлений](docs/NOTIFICATIONS_SYSTEM.md)
- [Быстрый старт уведомлений](docs/NOTIFICATIONS_QUICKSTART.md)
- [Исправление развертывания уведомлений](docs/NOTIFICATIONS_DEPLOYMENT_FIX.md)

### 💬 Мессенджер и чат
- [Руководство по мессенджеру](docs/MESSENGER_GUIDE.md)
- [Как начать чат](docs/HOW_TO_START_CHAT.md)
- [Исправления WebSocket мессенджера](docs/MESSENGER_WEBSOCKET_FIX.md)
- [Детали автомобилей и мессенджер](docs/CAR_DETAILS_AND_MESSENGER.md)

### 🌐 WebSocket и соединения
- [Исправления WebSocket](docs/WEBSOCKET_FIXES.md)
- [Исправления ошибок WebSocket](docs/WEBSOCKET_ERRORS_FIX.md)
- [Исправление дублирующих соединений WebSocket](docs/WEBSOCKET_DUPLICATE_CONNECTIONS_FIX.md)
- [Исправление множественных соединений WebSocket](docs/WEBSOCKET_MULTIPLE_CONNECTIONS_FIX.md)
- [Исправления WebSocket (socket branch)](docs/WEBSOCKET_FIXES_SOCKET_BRANCH.md)

### 📄 Документооборот
- [Электронный документооборот](docs/ELECTRONIC_DOCUMENT_MANAGEMENT.md)
- [Руководство по настройке EDO](docs/EDO_SETUP_GUIDE.md)
- [Быстрый старт EDO](docs/QUICK_START_EDO.md)

### ⭐ Система отзывов
- [Система отзывов](docs/REVIEWS_SYSTEM.md)
- [Установка системы отзывов](docs/REVIEWS_INSTALLATION.md)

### 🆘 Поддержка
- [Исправления CORS поддержки](docs/SUPPORT_CORS_FIX.md)
- [Интеграция меню поддержки](docs/SUPPORT_MENU_INTEGRATION.md)
- [Исправление отображения сообщений поддержки](docs/SUPPORT_MESSAGES_DISPLAY_FIX.md)

### 🧪 Тестирование
- [Тестирование приглашений команды](docs/TEAM_INVITATION_TESTING.md)

### 🔧 Технические исправления
- [Исправления TypeScript](docs/TYPESCRIPT_FIXES.md)
- [Отчет о проверке типов](docs/TYPE_CHECK_REPORT.md)
- [Исправления CORS](docs/CORS_FIX.md)
- [Централизация URL API](docs/API_URL_CENTRALIZATION_FIX.md)

## 🛠️ Технологический стек

### Backend
- **Node.js** с **TypeScript**
- **Hono** - веб-фреймворк
- **PostgreSQL** - база данных
- **Drizzle ORM** - ORM для работы с БД
- **JWT** - аутентификация
- **WebSocket** - real-time соединения

### Frontend
- **Next.js 14** с **TypeScript**
- **React 18** с хуками
- **Tailwind CSS** - стилизация
- **shadcn/ui** - компоненты UI
- **Zustand** - управление состоянием

### Интеграции
- **Bitrix24** - CRM система
- **reCAPTCHA** - защита от ботов
- **MinIO** - файловое хранилище
- **SMTP** - отправка email

## 📁 Структура проекта

```
logistPro/
├── apps/
│   ├── backend/          # Backend приложение
│   └── frontend/         # Frontend приложение
├── docs/                 # Документация
├── README.md            # Этот файл
└── package.json         # Корневой package.json
```

## 🚀 Команды

### Разработка
```bash
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка проекта
npm run start            # Запуск в продакшене
```

### Backend
```bash
cd apps/backend
npm run dev              # Запуск backend в режиме разработки
npm run build            # Сборка backend
npm run start            # Запуск backend в продакшене
```

### Frontend
```bash
cd apps/frontend
npm run dev              # Запуск frontend в режиме разработки
npm run build            # Сборка frontend
npm run start            # Запуск frontend в продакшене
```

## 🤝 Вклад в проект

1. Создайте форк репозитория
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [документацию](docs/) в папке `docs/`
2. Создайте issue в репозитории
3. Обратитесь к команде разработки

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

**LogistGo Pro** - Современное решение для логистики 🚛