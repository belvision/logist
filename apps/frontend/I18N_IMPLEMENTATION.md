# Внедрение i18next на публичных лендингах

## Обзор

Реализована мультиязычная поддержка для публичных лендинговых страниц проекта с использованием библиотеки `i18next` и её обёртки `react-i18next`.

## Установленные библиотеки

```json
"i18next": "^23.x",
"react-i18next": "^14.x",
"i18next-browser-languagedetector": "^7.x"
```

## Структура переводов

Переводы размещены в `apps/frontend/src/locales/`:

```
src/locales/
├── ru/translation.json    # Русский (по умолчанию)
├── be/translation.json    # Белорусский
├── kz/translation.json    # Казахский
├── pl/translation.json    # Польский
├── lt/translation.json    # Литовский
├── uz/translation.json    # Узбекский
├── tj/translation.json    # Таджикский
├── tr/translation.json    # Турецкий
└── ka/translation.json    # Грузинский
```

## Конфигурация

### `src/lib/i18n.ts`

Конфигурация i18next с прямыми импортами переводов (без HTTP backend):

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорты всех переводов
import translationRU from '@/locales/ru/translation.json';
// ... остальные языки

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: translationRU },
      // ... остальные языки
    },
    fallbackLng: 'ru',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    supportedLngs: ['ru', 'be', 'kz', 'pl', 'lt', 'uz', 'tj', 'tr', 'ka'],
  });
```

## Компоненты

### 1. `I18nProvider` (`src/components/i18n/I18nProvider.tsx`)

Оборачивает приложение и инициализирует i18next:

```typescript
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export const I18nProvider = ({ children }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
```

### 2. `LanguageSwitcher` (`src/components/i18n/LanguageSwitcher.tsx`)

Компонент переключения языка с dropdown меню:

```typescript
'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { DropdownMenu, Button } from '@/components/ui';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };
  
  // ... компонент с меню выбора языка
};
```

### 3. `LandingNav` (`src/components/layout/LandingNav.tsx`)

Навигационная панель для лендингов с переключателем языка:

```typescript
'use client';

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/i18n';

export const LandingNav = () => {
  const { t } = useTranslation();
  
  return (
    <nav>
      {/* Навигационные ссылки с переводами */}
      <Link href="/">{t('nav.home')}</Link>
      {/* ... */}
      <LanguageSwitcher />
    </nav>
  );
};
```

## Интеграция в приложение

### `src/app/layout.tsx`

```typescript
import { I18nProvider } from '@/components/i18n';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>
          <ThemeProvider>
            {/* ... остальные провайдеры */}
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
```

### `src/components/layout/LandingLayout.tsx`

```typescript
import { LandingNav } from "./LandingNav";

export const LandingLayout = ({ children }) => {
  return (
    <div>
      <LandingNav />
      {children}
    </div>
  );
};
```

## Использование переводов в компонентах

### Основное использование

```typescript
'use client';

import { useTranslation } from 'react-i18next';

export default function Page() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.description')}</p>
    </div>
  );
}
```

### Работа с массивами

```typescript
{(t('features.safe.items', { returnObjects: true }) as string[]).map((item, index) => (
  <li key={index}>{item}</li>
))}
```

## Публичные страницы с переводами

✅ **Реализовано:**
- `/` - Главная страница
- Навигационная панель (LandingNav)

🔄 **Требуется добавить переводы:**
- `/cargo-owners` - Грузовладельцам
- `/carriers` - Перевозчикам
- `/carriers/7-steps` - 7 шагов
- `/carriers/add-transport` - Добавление транспорта
- `/carriers/licenses` - Лицензии
- `/team` - Команда
- `/api-docs` - API документация
- `/privacy-policy` - Политика конфиденциальности
- `/offer-agreement` - Договор оферты
- `/countries/[slug]` - Страницы стран
- `/login` - Вход
- `/registry` - Регистрация

## Добавление новых переводов

1. Добавить ключи в `src/locales/ru/translation.json`
2. Перевести на все 9 языков
3. Использовать в компонентах через `t('key')`

Пример структуры:

```json
{
  "section": {
    "title": "Заголовок",
    "description": "Описание",
    "items": [
      "Пункт 1",
      "Пункт 2"
    ]
  }
}
```

## Поддерживаемые языки

| Код | Язык | Флаг |
|-----|------|------|
| ru  | Русский | 🇷🇺 |
| be  | Беларуская | 🇧🇾 |
| kz  | Қазақша | 🇰🇿 |
| pl  | Polski | 🇵🇱 |
| lt  | Lietuvių | 🇱🇹 |
| uz  | O'zbekcha | 🇺🇿 |
| tj  | Тоҷикӣ | 🇹🇯 |
| tr  | Türkçe | 🇹🇷 |
| ka  | ქართული | 🇬🇪 |

## Особенности реализации

1. **Client-side only**: Переводы работают только на клиенте, страницы используют `'use client'`
2. **Прямые импорты**: Переводы импортируются напрямую в конфигурацию, без HTTP запросов
3. **LocalStorage**: Выбранный язык сохраняется в localStorage
4. **Auto-detection**: Язык определяется автоматически по браузеру пользователя
5. **Fallback**: При отсутствии перевода используется русский язык

## Проверка на продакшене

- ✅ Переключение языка работает
- ✅ Выбор сохраняется в localStorage
- ✅ Переводы загружаются корректно
- ✅ Нет ошибок 500
- ✅ Не требуется дополнительная настройка Next.js

## Дальнейшие шаги

1. Добавить переводы для остальных публичных страниц
2. Проверить качество переводов с носителями языков
3. Добавить SEO метатеги на разных языках
4. Рассмотреть возможность SSR для SEO (next-i18next)

