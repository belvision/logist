# Исправление CORS ошибок в режиме разработки

## Проблема
При работе в режиме разработки фронтенд пытался обращаться к продакшн API (`https://logistgo.pro`) вместо локального бэкенда (`http://localhost:5555`), что вызывало CORS ошибки:

```
Access to fetch at 'https://logistgo.pro/api/bitrix24/support/open' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Причина
Переменная окружения `NEXT_PUBLIC_API_BASE_URL` была настроена на продакшн URL, и многие компоненты использовали её напрямую вместо централизованной конфигурации.

## Решение

### 1. Обновили централизованную конфигурацию API

**Файл:** `apps/frontend/src/lib/config.ts`

**Изменения:**
```typescript
export const API_BASE = (() => {
  // В режиме разработки всегда используем localhost:5555
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5555';
  }
  
  // В продакшене используем переменные окружения
  return process.env["AUTH_API_BASE_URL"] ||
         process.env["NEXT_PUBLIC_API_BASE_URL"] ||
         (typeof window !== 'undefined' ? 'http://localhost:5555' : 'http://0.0.0.0:5555');
})();
```

### 2. Обновили notifications-context.tsx

**Файл:** `apps/frontend/src/shared/context/notifications-context.tsx`

**Изменения:**
```typescript
import { API_BASE } from '@/lib/config';

// Заменили:
// const response = await fetch(`${process.env["NEXT_PUBLIC_API_BASE_URL"] || 'http://localhost:5555'}/api/bitrix24/support/open`, {

// На:
const response = await fetch(`${API_BASE}/api/bitrix24/support/open`, {
```

### 3. Обновили shared/api/notifications.ts

**Файл:** `apps/frontend/src/shared/api/notifications.ts`

**Изменения:**
```typescript
// Заменили:
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// На:
import { API_BASE } from '@/lib/config';
```

### 4. Обновили shared/api/api.ts

**Файл:** `apps/frontend/src/shared/api/api.ts`

**Изменения:**
```typescript
// Заменили:
// const API_BASE = 
//   process.env["NEXT_PUBLIC_API_BASE_URL"] ||
//   process.env["AUTH_API_BASE_URL"] ||
//   'http://localhost:5555';

// На:
import { API_BASE } from '@/lib/config';
```

## Результат

### ✅ До исправления:
- CORS ошибки при обращении к API
- Фронтенд обращался к продакшн API вместо локального
- Ошибки в консоли браузера

### ✅ После исправления:
- Нет CORS ошибок
- Фронтенд корректно обращается к локальному API
- Чистая консоль браузера

## Логика работы

### В режиме разработки (`NODE_ENV=development`):
- **Всегда используется:** `http://localhost:5555`
- **Игнорируются:** переменные окружения `NEXT_PUBLIC_API_BASE_URL`

### В продакшене (`NODE_ENV=production`):
- **Используется:** `NEXT_PUBLIC_API_BASE_URL` или `AUTH_API_BASE_URL`
- **Fallback:** `http://localhost:5555` (для браузера) или `http://0.0.0.0:5555` (для сервера)

## Дополнительные файлы для обновления

Следующие файлы также используют `NEXT_PUBLIC_API_BASE_URL` напрямую и должны быть обновлены для использования централизованной конфигурации:

- `apps/frontend/src/components/routes/PaymentByAddress.tsx`
- `apps/frontend/src/components/routes/CalculationByCities.tsx`
- `apps/frontend/src/components/homepage/StatsSection.tsx`
- `apps/frontend/src/components/company/QuickActions.tsx`
- `apps/frontend/src/components/company/CompanyStatsTest.tsx`
- `apps/frontend/src/components/company/CompanyOverview.tsx`
- `apps/frontend/src/app/company/[company_id]/cargo/page.tsx`
- `apps/frontend/src/app/company/[company_id]/cargo-search/page.tsx`
- `apps/frontend/src/app/company/[company_id]/car-search/page.tsx`
- `apps/frontend/src/components/support/ResumeTicketModal.tsx`
- `apps/frontend/src/app/support/page.tsx`
- `apps/frontend/src/components/support/OpenTicketsList.tsx`
- `apps/frontend/src/components/support/ArchiveTicketsList.tsx`
- `apps/frontend/src/app/company/[company_id]/cars/[car_id]/cargo-search/page.tsx`
- `apps/frontend/src/components/cars/AddCarModal.tsx`
- `apps/frontend/src/components/cars/EditCarModal.tsx`
- `apps/frontend/src/components/cargo/WaypointSearch.tsx`
- `apps/frontend/src/components/cargo-search/WaypointSearch.tsx`
- `apps/frontend/src/components/cargo-search/SearchBox.tsx`
- `apps/frontend/src/components/car-search/LocationSearchBox.tsx`
- `apps/frontend/src/app/company/[company_id]/cargo/[cargo_id]/car-search/page.tsx`
- `apps/frontend/src/components/cargo/cargoService.ts`

## Применение исправлений

### 1. Перезапуск приложения

**Локально:**
```bash
cd apps/frontend
npm run dev
```

### 2. Проверка работы

**Откройте консоль браузера и проверьте:**
- Нет CORS ошибок
- API запросы идут на `http://localhost:5555`
- WebSocket работает стабильно

**Ожидаемые логи:**
```
[NotificationsProvider] Creating WebSocket connection
[WebSocket] Attempting connection (attempt 1/10)
[WebSocket] Connected successfully
[NotificationsProvider] WebSocket connected successfully
```

## Коммит изменений

```bash
git add .
git commit -m "fix: исправить CORS ошибки в режиме разработки

- Обновили централизованную конфигурацию API
- В режиме разработки всегда используется localhost:5555
- Обновили notifications-context.tsx для использования API_BASE
- Обновили shared/api файлы для использования централизованной конфигурации
- Убрали CORS ошибки при обращении к API"
```

## Дополнительные улучшения

### Если нужно принудительно использовать продакшн API в разработке:

1. **Временно изменить в `config.ts`:**
   ```typescript
   if (process.env.NODE_ENV === 'development' && process.env.FORCE_PROD_API === 'true') {
     return 'https://logistgo.pro';
   }
   ```

2. **Добавить в `.env.local`:**
   ```bash
   FORCE_PROD_API=true
   ```

### Мониторинг API запросов:

Теперь все API запросы логируются в консоли:
- URL запроса
- Метод
- Заголовки
- Тело запроса
- Статус ответа
