# Быстрый старт: Как добавить переводы на новую страницу

## 1. Сделайте компонент клиентским

```typescript
'use client';

import { useTranslation } from 'react-i18next';
```

## 2. Используйте хук useTranslation

```typescript
export default function MyPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('myPage.title')}</h1>
      <p>{t('myPage.description')}</p>
    </div>
  );
}
```

## 3. Добавьте ключи переводов

Откройте `src/locales/ru/translation.json` и добавьте:

```json
{
  "myPage": {
    "title": "Мой заголовок",
    "description": "Мое описание"
  }
}
```

## 4. Переведите на все языки

Скопируйте структуру в:
- `src/locales/be/translation.json` (Белорусский)
- `src/locales/kz/translation.json` (Казахский)
- `src/locales/pl/translation.json` (Польский)
- `src/locales/lt/translation.json` (Литовский)
- `src/locales/uz/translation.json` (Узбекский)
- `src/locales/tj/translation.json` (Таджикский)
- `src/locales/tr/translation.json` (Турецкий)
- `src/locales/ka/translation.json` (Грузинский)

## Примеры использования

### Простой текст
```typescript
<h1>{t('key')}</h1>
```

### Массив элементов
```typescript
{(t('features.items', { returnObjects: true }) as string[]).map((item, i) => (
  <li key={i}>{item}</li>
))}
```

### Вложенные ключи
```json
{
  "hero": {
    "title": "Заголовок",
    "subtitle": "Подзаголовок"
  }
}
```

```typescript
<h1>{t('hero.title')}</h1>
<h2>{t('hero.subtitle')}</h2>
```

## Переключатель языка

Добавьте компонент LanguageSwitcher:

```typescript
import { LanguageSwitcher } from '@/components/i18n';

<LanguageSwitcher />
```

## Обертка для лендингов

Используйте LandingLayout для публичных страниц:

```typescript
import { LandingLayout } from '@/components/layout/LandingLayout';

export default function Page() {
  return (
    <LandingLayout>
      {/* Ваш контент */}
    </LandingLayout>
  );
}
```

Он автоматически добавляет:
- Навигацию с переводами
- Переключатель языка
- Cookie consent

## Важно!

- ✅ Используйте `'use client'` для страниц с переводами
- ✅ Добавляйте переводы для ВСЕХ 9 языков
- ✅ Проверяйте качество переводов
- ❌ Не используйте переводы в server components без SSR

