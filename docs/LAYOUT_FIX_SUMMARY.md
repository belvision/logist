# Исправление растянутых страниц на больших экранах

## Проблема
На больших мониторах (>1920px) все публичные страницы (логин, регистрация, лендинги) растягивались на всю ширину экрана, что создавало плохой UX и затрудняло чтение.

## Решение

### 1. Страницы аутентификации (Login/Register)
**Файл:** `apps/frontend/src/components/auth/AuthLayout.tsx`

**Изменения:**
```tsx
// Было:
<div className="min-h-screen flex items-center justify-center p-4">
  <ThemeToggle />
  <div className="w-full max-w-md">
    ...
  </div>
</div>

// Стало:
<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
  <ThemeToggle />
  <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4" style={{ maxWidth: '600px' }}>
    ...
  </div>
</div>
```

**Результат:**
- ✅ Максимальная ширина формы: **600px**
- ✅ Адаптивные breakpoints для разных экранов
- ✅ Красивый градиентный фон
- ✅ Центрирование формы на любом экране

---

### 2. Главная страница
**Файл:** `apps/frontend/src/app/page.tsx`

**Изменения Hero-секции:**
```tsx
// Было:
<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
  ...
</div>

// Стало:
<div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto text-center">
    ...
  </div>
</div>
```

**Результат:**
- ✅ Внешний контейнер: `max-w-7xl` (1280px)
- ✅ Контент с текстом: `max-w-5xl` (1024px)
- ✅ Улучшенная читаемость на больших экранах

---

### 3. Страницы стран
**Файл:** `apps/frontend/src/app/countries/[slug]/page.tsx`

**Изменения:**
- Аналогичная двухуровневая структура контейнеров
- Ограничение ширины Hero-секции до 1024px для контента

---

### 4. Landing страница
**Файл:** `apps/frontend/src/app/landing/components/LandingHero.tsx`

**Изменения:**
```tsx
<div className="relative z-10 flex items-center justify-center min-h-screen px-4">
  <div className="w-full max-w-7xl mx-auto">
    <div className="text-center text-white max-w-5xl mx-auto">
      ...
    </div>
  </div>
</div>
```

---

## Тестирование

### Проверка на разных разрешениях:
- ✅ Mobile (320px-768px) - форма адаптируется
- ✅ Tablet (768px-1024px) - оптимальная ширина
- ✅ Desktop (1024px-1920px) - комфортная ширина
- ✅ Large Desktop (>1920px) - **НЕ растягивается**

### Страницы для проверки:
1. `/login` - страница входа
2. `/registry` - страница регистрации  
3. `/` - главная страница
4. `/countries/[slug]` - страницы стран
5. `/landing` - лендинг

---

## Команды для деплоя

```bash
# Проверка изменений
git status

# Коммит изменений
git add apps/frontend/src/components/auth/AuthLayout.tsx
git add apps/frontend/src/app/page.tsx
git add apps/frontend/src/app/countries/[slug]/page.tsx
git add apps/frontend/src/app/landing/components/LandingHero.tsx

git commit -m "fix: ограничена ширина форм и лендингов на больших экранах"

# Пуш в ветку social
git push origin social
```

---

## Дата изменений
**28 октября 2025**

Ветка: `social`

