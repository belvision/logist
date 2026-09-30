# 🚀 Как завершить добавление переводов

## ✅ Что уже сделано

### Готовые страницы:
1. **`/` (Главная)** - полностью переведена ✅
2. **`/cargo-owners` (Грузовладельцам)** - полностью переведена ✅
3. **`/carriers` (Перевозчикам)** - JSON создан, страница в процессе ⏳

### Созданные файлы переводов:
- ✅ `src/locales/ru/translation.json` - основные переводы
- ✅ `src/locales/ru/cargo-owners.json` - для страницы грузовладельцев
- ✅ `src/locales/ru/carriers.json` - для страницы перевозчиков
- ✅ Все файлы для 8 остальных языков (be, kz, pl, lt, uz, tj, tr, ka)

### Настроенные компоненты:
- ✅ `LanguageSwitcher` с непрозрачным фоном
- ✅ `LandingNav` с переводами навигации
- ✅ `i18n.ts` настроен и загружает все JSON файлы

## 📋 Что нужно доделать

### Страница `/carriers` (Перевозчикам)
**Статус:** 🟡 В процессе

**Что нужно сделать:**
1. Заменить оставшиеся тексты на `{t('carriers.key')}`

**Ключи уже созданы в `src/locales/ru/carriers.json`:**
```typescript
// Hero секция
t('carriers.hero.title')
t('carriers.hero.subtitle')
t('carriers.hero.description')
t('carriers.hero.register')

// Основная секция
t('carriers.mainSection.title')
t('carriers.mainSection.subtitle')
t('carriers.mainSection.participants.title')
t('carriers.mainSection.participants.description')
// ...и так далее

// Удобство
t('carriers.convenience.title')
t('carriers.convenience.workAnywhere.title')
// ...

// Безопасность
t('carriers.safety.title')
t('carriers.safety.passport.title')
// ...

// Бесплатные функции
t('carriers.free.title')
t('carriers.free.seeContacts.title')
// ...
```

**Пример замены:**
```tsx
// Было:
<h1>Поиск грузов</h1>

// Стало:
<h1>{t('carriers.hero.title')}</h1>
```

### Остальные страницы

#### 1. `/team` - Команда
**Нужно:**
1. Прочитать страницу: `apps/frontend/src/app/team/page.tsx`
2. Создать JSON: `src/locales/ru/team.json`
3. Добавить в i18n.ts:
```typescript
import teamRU from '@/locales/ru/team.json';

const resources = {
  ru: { translation: { ...translationRU, ...cargoOwnersRU, ...carriersRU, ...teamRU } },
  //...
};
```
4. Обновить страницу:
   - Добавить `'use client'` в начало
   - Удалить `export const metadata`
   - Добавить `const { t } = useTranslation();`
   - Заменить тексты на `{t('team.key')}`

#### 2. `/api-docs` - API документация
Аналогично team

#### 3. `/privacy-policy` и `/offer-agreement`
**Особенность:** Это длинные документы с юридическим текстом.
**Рекомендация:** Можно не переводить, оставить только на русском, или перевести ключевые заголовки.

#### 4. `/login` и `/registry`
**Нужно:**
- Создать `src/locales/ru/auth.json` для обеих страниц
- Добавить переводы для:
  - Заголовков
  - Полей форм (email, пароль и т.д.)
  - Кнопок (Войти, Зарегистрироваться)
  - Сообщений об ошибках

#### 5. `/countries/[slug]` - Страницы стран
**Нужно:**
- Создать `src/locales/ru/countries.json`
- Добавить переводы для общих элементов
- **Важно:** Динамический контент о странах может остаться в `src/data/countries.ts`

#### 6. Подстраницы перевозчиков:
- `/carriers/7-steps`
- `/carriers/add-transport`
- `/carriers/licenses`

## 🔧 Пошаговая инструкция для каждой страницы

### Шаг 1: Прочитать страницу
```bash
# Посмотреть содержимое
cat apps/frontend/src/app/team/page.tsx
```

### Шаг 2: Создать JSON с переводами
```json
// src/locales/ru/team.json
{
  "team": {
    "title": "Наша команда",
    "subtitle": "Описание",
    // ... все тексты со страницы
  }
}
```

### Шаг 3: Добавить в i18n.ts
```typescript
import teamRU from '@/locales/ru/team.json';

const resources = {
  ru: { translation: { 
    ...translationRU, 
    ...cargoOwnersRU, 
    ...carriersRU,
    ...teamRU  // <- Добавить здесь
  } },
  // ...
};
```

### Шаг 4: Обновить страницу
```typescript
'use client';  // <- Добавить

import { useTranslation } from 'react-i18next';  // <- Добавить

// Удалить export const metadata

export default function TeamPage() {
  const { t } = useTranslation();  // <- Добавить
  
  return (
    <div>
      <h1>{t('team.title')}</h1>  // <- Заменить тексты
    </div>
  );
}
```

## 📝 Массовая замена текстов

Для ускорения можно использовать поиск и замену:

**Найти:** `"Текст на русском"`  
**Заменить:** `{t('section.key')}`

**Найти:** `<h1>Заголовок</h1>`  
**Заменить:** `<h1>{t('section.title')}</h1>`

## 🌍 Переводы на другие языки

После завершения русских переводов, нужно перевести на 8 остальных языков:

### Быстрый способ:
1. Скопировать структуру из русского JSON
2. Перевести значения (можно использовать Google Translate для первоначального перевода)
3. **Важно:** Проверить качество переводов с носителями языков

### Пример:
```json
// be/translation.json (Белорусский)
{
  "team": {
    "title": "Наша каманда",  // Перевод с русского
    "subtitle": "Апісанне"
  }
}
```

## ⚡ Советы для ускорения

1. **Используйте VS Code Multi-cursor**
   - Alt + Click для множественного курсора
   - Ctrl + D для выделения следующего вхождения

2. **Regex поиск**
   - Найти все h1, h2, h3: `<h[1-3]>(.+?)</h[1-3]>`

3. **Копируйте структуру**
   - Сначала создайте полный JSON со всеми ключами
   - Затем заменяйте тексты на странице

4. **Группируйте по секциям**
   - Hero секция
   - Features секция
   - CTA секция
   - Footer

## 🎯 Приоритеты

### Высокий приоритет:
1. ✅ `/` (Главная) - готово
2. ✅ `/cargo-owners` - готово
3. 🟡 `/carriers` - почти готово
4. ⚪ `/team` - важная страница
5. ⚪ `/login` - критично для UX
6. ⚪ `/registry` - критично для UX

### Средний приоритет:
- `/api-docs`
- `/countries/[slug]`
- `/carriers/7-steps`
- `/carriers/add-transport`
- `/carriers/licenses`

### Низкий приоритет:
- `/privacy-policy` - можно оставить на русском
- `/offer-agreement` - можно оставить на русском

## 📊 Прогресс

```
Завершено: 2/12 страниц (17%)
В процессе: 1 страница
Осталось: 9 страниц
```

## 🚀 Быстрый старт

Чтобы продолжить с `/carriers`:

```bash
# 1. Страница уже подготовлена ('use client', useTranslation)
# 2. JSON создан (src/locales/ru/carriers.json)
# 3. Нужно заменить тексты на {t('carriers.key')}
```

**Откройте:**
- `apps/frontend/src/app/carriers/page.tsx`
- `apps/frontend/src/locales/ru/carriers.json` (для справки по ключам)

**Замените тексты по секциям:**
1. Hero: строки 73-81
2. Main section: строки 119-171
3. Convenience: строки 178-218
4. Safety: строки 225-289
5. Free section: строки 340-376

---

**Удачи! Если нужна помощь - обращайтесь! 💪**

