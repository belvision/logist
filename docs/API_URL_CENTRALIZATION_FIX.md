# Исправление проблемы с API URL на главной странице

## Проблема

На главной странице статистика загружалась с продакшн API вместо локального, потому что:

1. **Неправильный порт**: Использовался `8080` вместо `5555`
2. **Прямое обращение к `process.env`**: Вместо централизованной конфигурации
3. **Отсутствие переключения между средами**: Не было автоматического определения локальной/продакшн среды

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

### 2. Исправленные файлы

#### **apps/frontend/src/components/homepage/StatsSection.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

#### **apps/frontend/src/components/company/CompanyOverview.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

#### **apps/frontend/src/components/company/QuickActions.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

#### **apps/frontend/src/components/company/CompanyStatsTest.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

#### **apps/frontend/src/components/routes/PaymentByAddress.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

#### **apps/frontend/src/components/routes/CalculationByCities.tsx**

**Было:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
```

**Стало:**
```typescript
import { API_BASE } from '@/lib/config';
// Убрана локальная константа
```

## Результат

### ✅ **До исправления:**
- ❌ Статистика загружалась с продакшн API (`https://logistgo.pro`)
- ❌ Неправильный порт (`8080` вместо `5555`)
- ❌ Дублирование конфигурации в каждом файле
- ❌ Отсутствие автоматического переключения между средами

### ✅ **После исправления:**
- ✅ Статистика загружается с локального API (`http://localhost:5555`)
- ✅ Правильный порт (`5555`)
- ✅ Централизованная конфигурация
- ✅ Автоматическое переключение между средами

## Логика работы

### 1. Определение среды
```typescript
if (process.env.NODE_ENV === 'development') {
  return 'http://localhost:5555';  // Локальная разработка
}
```

### 2. Fallback для продакшена
```typescript
return process.env["AUTH_API_BASE_URL"] ||           // Основная переменная
       process.env["NEXT_PUBLIC_API_BASE_URL"] ||    // Альтернативная переменная
       'http://localhost:5555';                      // Fallback
```

### 3. Использование в компонентах
```typescript
import { API_BASE } from '@/lib/config';

// Все API вызовы используют централизованную конфигурацию
const response = await fetch(`${API_BASE}/api/stats`);
```

## Тестирование

### 1. Локальная разработка
1. Запустите фронтенд: `npm run dev`
2. Откройте главную страницу
3. Проверьте Network tab в DevTools
4. Убедитесь, что запросы идут на `http://localhost:5555`

### 2. Проверка в консоли
- Отсутствие CORS ошибок
- Успешные API запросы к локальному серверу
- Корректная загрузка статистики

### 3. Проверка продакшена
- В продакшене API_BASE должен использовать переменные окружения
- Статистика должна загружаться с продакшн API

## Преимущества решения

### 1. **Централизация**
- Единое место для конфигурации API URL
- Легкость изменения настроек
- Консистентность во всем приложении

### 2. **Автоматическое переключение**
- Development: автоматически `localhost:5555`
- Production: использует переменные окружения
- Fallback: безопасные значения по умолчанию

### 3. **Отсутствие дублирования**
- Убраны повторяющиеся константы API_BASE
- Единообразный подход во всех компонентах
- Легкость поддержки и обновления

### 4. **Правильные порты**
- Локальная разработка: `5555` (бэкенд)
- Продакшн: переменные окружения
- Нет путаницы с портами

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

2. **Валидация URL**
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

3. **Кэширование конфигурации**
```typescript
const config = useMemo(() => ({
  baseUrl: API_BASE,
  // другие настройки
}), []);
```

## Применение изменений

### 1. Перезапуск приложения
```bash
cd apps/frontend
npm run dev
```

### 2. Проверка работы
1. Откройте главную страницу
2. Проверьте загрузку статистики
3. Убедитесь, что запросы идут на `localhost:5555`
4. Проверьте отсутствие CORS ошибок

### 3. Мониторинг
- Проверьте Network tab в DevTools
- Убедитесь, что все запросы идут на правильный URL
- Проверьте успешность ответов от API

## Коммит изменений

```bash
git add .
git commit -m "fix: централизовать конфигурацию API URL для главной страницы

- Заменить прямое использование process.env на централизованную конфигурацию API_BASE
- Исправить неправильный порт с 8080 на 5555 для локальной разработки
- Добавить импорты API_BASE во все компоненты статистики
- Обеспечить автоматическое переключение между локальной и продакшн средой
- Устранить дублирование конфигурации API URL в компонентах"
```

## Результат

✅ **Статистика на главной странице загружается корректно**
✅ **Автоматическое переключение между локальной и продакшн средой**
✅ **Централизованная конфигурация API URL**
✅ **Правильные порты для каждой среды**
✅ **Отсутствие дублирования кода**
