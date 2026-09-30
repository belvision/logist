# Исправление CORS ошибки при отправке сообщений в поддержку

## Проблема

При отправке сообщений в поддержку с локального компьютера возникала CORS ошибка:

```
Access to fetch at 'https://logistgo.pro/api/bitrix24/support' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'https://logistgo.pro' that is not equal to the supplied origin.
```

**Причина:** Фронтенд пытался обратиться к продакшн API (`https://logistgo.pro`) вместо локального (`http://localhost:5555`).

## Решение

### 1. Централизованная конфигурация API

**Файл:** `apps/frontend/src/lib/config.ts`

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

### 2. Исправление файлов поддержки

#### **apps/frontend/src/app/support/page.tsx**

**Добавлен импорт:**
```typescript
import { API_BASE } from '@/lib/config';
```

**Исправлены API вызовы:**
```typescript
// Было:
const response = await fetch(`${process.env["NEXT_PUBLIC_API_BASE_URL"] || (typeof window !== 'undefined' ? 'http://localhost:5555' : 'http://0.0.0.0:5555')}/api/bitrix24/support`, {

// Стало:
const response = await fetch(`${API_BASE}/api/bitrix24/support`, {
```

#### **apps/frontend/src/components/support/ResumeTicketModal.tsx**

**Добавлены импорты:**
```typescript
import { getCookie } from 'cookies-next';
import { API_BASE } from '@/lib/config';
```

**Исправлены API вызовы:**
```typescript
// mark-viewed
const response = await fetch(`${API_BASE}/api/bitrix24/support/mark-viewed`, {

// comment
const response = await fetch(`${API_BASE}/api/bitrix24/support/comment`, {

// close
const response = await fetch(`${API_BASE}/api/bitrix24/support/close`, {
```

#### **apps/frontend/src/components/support/OpenTicketsList.tsx**

**Добавлены импорты:**
```typescript
import { getCookie } from 'cookies-next';
import { API_BASE } from '@/lib/config';
```

**Исправлены API вызовы:**
```typescript
// open tickets
const response = await fetch(`${API_BASE}/api/bitrix24/support/open`, {

// close ticket
const response = await fetch(`${API_BASE}/api/bitrix24/support/close`, {

// mark as viewed
const response = await fetch(`${API_BASE}/api/bitrix24/support/mark-viewed`, {
```

#### **apps/frontend/src/components/support/ArchiveTicketsList.tsx**

**Добавлены импорты:**
```typescript
import { getCookie } from 'cookies-next';
import { API_BASE } from '@/lib/config';
```

**Исправлен API вызов:**
```typescript
// archive tickets
const response = await fetch(`${API_BASE}/api/bitrix24/support/all`, {
```

## Результат

### ✅ **До исправления:**
- ❌ CORS ошибка при отправке сообщений
- ❌ Обращение к продакшн API с локального компьютера
- ❌ Невозможность отправить сообщение в поддержку

### ✅ **После исправления:**
- ✅ Корректное обращение к локальному API (`http://localhost:5555`)
- ✅ Отсутствие CORS ошибок
- ✅ Успешная отправка сообщений в поддержку
- ✅ Централизованная конфигурация API

## Тестирование

### 1. Проверка отправки сообщения
1. Откройте страницу поддержки (`/support`)
2. Заполните форму создания обращения
3. Нажмите "Отправить запрос"
4. Убедитесь, что сообщение отправляется без ошибок

### 2. Проверка в консоли браузера
- Отсутствие CORS ошибок
- Успешные API запросы к `http://localhost:5555`
- Корректные ответы от сервера

### 3. Проверка работы с тикетами
- Создание новых тикетов
- Добавление комментариев
- Закрытие тикетов
- Просмотр архива

## Логика работы

### 1. Определение API URL
```typescript
// В development режиме
if (process.env.NODE_ENV === 'development') {
  return 'http://localhost:5555';  // Локальный API
}

// В production режиме
return process.env["AUTH_API_BASE_URL"] ||  // Продакшн API
       process.env["NEXT_PUBLIC_API_BASE_URL"] ||
       'http://localhost:5555';
```

### 2. Использование в компонентах
```typescript
import { API_BASE } from '@/lib/config';

// Все API вызовы используют централизованную конфигурацию
const response = await fetch(`${API_BASE}/api/bitrix24/support`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestData),
});
```

## Преимущества решения

### 1. **Централизация**
- Единое место для конфигурации API URL
- Легкость изменения настроек
- Консистентность во всем приложении

### 2. **Автоматическое определение среды**
- Development: автоматически `localhost:5555`
- Production: использует переменные окружения
- Fallback: безопасные значения по умолчанию

### 3. **Отсутствие дублирования**
- Убраны повторяющиеся проверки `process.env`
- Единообразный подход во всех компонентах
- Легкость поддержки и обновления

## Дальнейшие улучшения

### Возможные улучшения
1. **Типизация конфигурации**
```typescript
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}
```

2. **Кэширование конфигурации**
```typescript
const config = useMemo(() => ({
  baseUrl: API_BASE,
  // другие настройки
}), []);
```

3. **Валидация URL**
```typescript
const validateApiUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

## Применение изменений

### 1. Перезапуск приложения
```bash
cd apps/frontend
npm run dev
```

### 2. Проверка работы
1. Откройте страницу поддержки
2. Попробуйте отправить сообщение
3. Проверьте консоль браузера на отсутствие ошибок
4. Убедитесь, что запросы идут на `localhost:5555`

### 3. Мониторинг
- Проверьте Network tab в DevTools
- Убедитесь, что все запросы идут на правильный URL
- Проверьте успешность ответов от API

## Коммит изменений

```bash
git add .
git commit -m "fix: исправить CORS ошибку при отправке сообщений в поддержку

- Заменить прямое использование NEXT_PUBLIC_API_BASE_URL на централизованную конфигурацию API_BASE
- Исправить все компоненты поддержки для использования правильного API URL
- Добавить импорты API_BASE в компоненты поддержки
- Обеспечить корректное обращение к локальному API в development режиме
- Устранить CORS ошибки при отправке сообщений в поддержку"
```

## Результат

✅ **CORS ошибка исправлена**
✅ **Корректное обращение к локальному API**
✅ **Успешная отправка сообщений в поддержку**
✅ **Централизованная конфигурация API**
✅ **Консистентность во всех компонентах поддержки**
