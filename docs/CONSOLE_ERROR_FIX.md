# Исправление ошибки в консоли

## Проблема

Ошибка `Uncaught SyntaxError: Invalid or unexpected token (at vendors-node_modules...v=1765031551433:5:1)` указывает на проблему с CSS файлом, сгенерированным webpack.

## Возможные причины

1. **Проблема с кэшем webpack** - старые файлы в `.next` папке
2. **Проблема с CSS импортами** - неправильный синтаксис в CSS файлах
3. **Проблема с webpack конфигурацией** - ошибка в настройках сборки

## Решения

### 1. Очистка кэша Next.js

```bash
# Удалить папку .next
rm -rf apps/frontend/.next

# Или на Windows
rmdir /s /q apps\frontend\.next

# Перезапустить dev сервер
cd apps/frontend
npm run dev
```

### 2. Очистка node_modules (если проблема не решается)

```bash
# Удалить node_modules и package-lock.json
rm -rf apps/frontend/node_modules
rm apps/frontend/package-lock.json

# Переустановить зависимости
cd apps/frontend
npm install

# Перезапустить dev сервер
npm run dev
```

### 3. Проверка CSS файлов

Убедитесь, что в `apps/frontend/src/app/globals.css` нет синтаксических ошибок.

### 4. Перезапуск dev сервера

Иногда простая перезагрузка помогает:

1. Остановить dev сервер (Ctrl+C)
2. Запустить заново: `npm run dev`
3. Обновить страницу с очисткой кэша (Ctrl+Shift+R)

## Текущее состояние кода

Код страницы `7-steps/page.tsx` исправлен:
- ✅ Structured Data вынесен в отдельную переменную
- ✅ Overlay использует черный цвет с opacity 0.4 (как в BackgroundImage)
- ✅ Паттерн добавлен поверх изображения
- ✅ Fallback на градиент работает корректно

## Проверка

После очистки кэша проверьте:
1. Ошибка в консоли должна исчезнуть
2. Изображения должны быть видны с правильным overlay
3. Градиент должен отображаться только если изображение не загружено

---

**Рекомендация:** Начните с очистки кэша `.next` - это решает большинство проблем с webpack.

