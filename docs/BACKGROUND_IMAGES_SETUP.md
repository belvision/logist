# Настройка фоновых изображений для лендингов

## 📋 Обзор

Система позволяет легко добавлять и изменять фоновые изображения для всех публичных страниц (лендингов). Все изображения хранятся в MinIO и могут быть легко заменены без изменения кода.

## 🏗️ Архитектура

### 1. Конфигурационный файл
`apps/frontend/src/lib/background-images.ts` - содержит все URL изображений из MinIO

### 2. Компонент BackgroundImage
`apps/frontend/src/components/landing/BackgroundImage.tsx` - универсальный компонент для фоновых изображений с автоматическим fallback на градиенты

### 3. Применение на страницах
Все публичные страницы используют компонент `BackgroundImage` вместо обычных секций с градиентами

## 📁 Структура хранения в MinIO

Изображения должны быть загружены в MinIO по следующей структуре:

```
logistic-pro/
  └── backgrounds/
      ├── home/
      │   └── hero-bg.jpg
      ├── carriers/
      │   └── hero-bg.jpg
      ├── cargo-owners/
      │   └── hero-bg.jpg
      ├── team/
      │   └── hero-bg.jpg
      ├── countries/
      │   ├── belarus/
      │   │   └── hero-bg.jpg
      │   ├── russia/
      │   │   └── hero-bg.jpg
      │   └── ...
      └── ...
```

## 🔧 Как добавить/изменить изображение

**📖 Подробная инструкция**: См. [MINIO_UPLOAD_GUIDE.md](./MINIO_UPLOAD_GUIDE.md)

### Краткая инструкция:

1. Откройте MinIO Console: **https://io.logistgo.pro/console**
2. Войдите:
   - Access Key: `minioadmin`
   - Secret Key: `JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t`
3. Перейдите в bucket **`logistic-pro`**
4. Создайте структуру папок: `backgrounds/home/`, `backgrounds/carriers/`, и т.д.
5. Загрузите изображения с именами:
   - `hero-bg.jpg` для всех hero-секций
   - Размер: **1920x1080px** или больше
   - Формат: **JPG** (оптимизированный, размер < 500KB)
6. Изображения автоматически появятся на страницах

## 📝 Конфигурация изображений

Все URL изображений настраиваются в файле `apps/frontend/src/lib/background-images.ts`:

```typescript
export const backgroundImages = {
  home: {
    hero: getBackgroundImageUrl('home/hero-bg.jpg'),
  },
  carriers: {
    hero: getBackgroundImageUrl('carriers/hero-bg.jpg'),
  },
  // ... и т.д.
};
```

### Как изменить путь к изображению

Если вы загрузили изображение с другим именем или в другую папку, просто измените путь в конфигурации:

```typescript
home: {
  hero: getBackgroundImageUrl('home/my-custom-background.jpg'), // измените имя файла
},
```

### Как добавить изображение для новой страницы

1. Загрузите изображение в MinIO по пути `backgrounds/{page-name}/hero-bg.jpg`
2. Добавьте конфигурацию в `background-images.ts`:

```typescript
export const backgroundImages = {
  // ... существующие
  newPage: {
    hero: getBackgroundImageUrl('new-page/hero-bg.jpg'),
  },
};
```

3. Используйте на странице:

```tsx
<BackgroundImage
  imageUrl={backgroundImages.newPage.hero}
  gradientClass="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
  overlayOpacity={0.4}
  showPattern={true}
  className="min-h-screen flex items-center justify-center"
>
  {/* контент */}
</BackgroundImage>
```

## 🎨 Настройка компонента BackgroundImage

### Параметры компонента

- `imageUrl` - URL изображения из MinIO (опционально)
- `gradientClass` - CSS классы для градиентного фона (fallback)
- `gradientStyle` - Инлайн стили для градиента (альтернатива gradientClass)
- `overlayOpacity` - Прозрачность overlay поверх изображения (0-1, по умолчанию 0.3)
- `overlayColor` - Цвет overlay (по умолчанию 'black')
- `showPattern` - Показывать ли паттерн поверх изображения (по умолчанию true)
- `className` - Дополнительные CSS классы

### Пример использования

```tsx
<BackgroundImage
  imageUrl={backgroundImages.home.hero}
  gradientClass="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
  overlayOpacity={0.4}
  showPattern={true}
  className="min-h-screen flex items-center justify-center"
>
  <div className="text-white">
    <h1>Заголовок</h1>
    <p>Текст поверх изображения</p>
  </div>
</BackgroundImage>
```

## 🔄 Автоматический Fallback

Если изображение:
- Не указано в конфиге (`imageUrl` = `null` или `undefined`)
- Не загрузилось (ошибка 404 или другая ошибка)
- Загружается слишком долго

То автоматически используется градиентный фон, указанный в `gradientClass` или `gradientStyle`.

## 🌍 Переменные окружения

Вы можете настроить базовый URL MinIO через переменные окружения:

```env
NEXT_PUBLIC_MINIO_BASE_URL=https://io.logistgo.pro
NEXT_PUBLIC_MINIO_BUCKET=logistic-pro
```

Если переменные не заданы, используются значения по умолчанию:
- `MINIO_BASE_URL`: `https://io.logistgo.pro`
- `MINIO_BUCKET`: `logistic-pro`

## 📄 Текущие страницы с фоновыми изображениями

- ✅ Главная страница (`/`) - `backgrounds/home/hero-bg.jpg`
- ✅ Страница перевозчиков (`/carriers`) - `backgrounds/carriers/hero-bg.jpg`
- ✅ Страница грузовладельцев (`/cargo-owners`) - `backgrounds/cargo-owners/hero-bg.jpg`
- ✅ Страница команды (`/team`) - `backgrounds/team/hero-bg.jpg`

## 🎯 Рекомендации по изображениям

1. **Размер**: Рекомендуется использовать изображения размером 1920x1080px или больше
2. **Формат**: JPG или WebP для лучшей оптимизации
3. **Вес**: Старайтесь не превышать 500KB для быстрой загрузки
4. **Контраст**: Убедитесь, что текст будет читаемым поверх изображения (используйте overlay)
5. **Фокус**: Важные элементы должны быть в центре изображения

## 🔍 Проверка работы

После загрузки изображения в MinIO:

1. Проверьте доступность по прямому URL: `https://io.logistgo.pro/logistic-pro/backgrounds/home/hero-bg.jpg`
2. Обновите страницу в браузере (может потребоваться очистка кэша)
3. Если изображение не загрузилось, проверьте:
   - Правильность пути в конфигурации
   - Доступность MinIO
   - Права доступа к файлу в MinIO

## 🐛 Отладка

Если изображение не отображается:

1. Откройте консоль браузера (F12)
2. Проверьте вкладку Network на наличие ошибок загрузки
3. Проверьте, что URL изображения правильный
4. Убедитесь, что изображение загружено в MinIO по правильному пути
5. Проверьте, что используется правильный bucket (`logistic-pro`)

## 📝 Изменение изображений без изменения кода

Для изменения изображения на странице:

1. Загрузите новое изображение в MinIO с тем же именем (замените старое)
2. Или загрузите с новым именем и обновите конфигурацию в `background-images.ts`
3. Перезапустите frontend (если нужно) или просто обновите страницу

---

**Дата создания**: 2025-12-06  
**Автор**: AI Assistant  
**Статус**: ✅ Готово к использованию

