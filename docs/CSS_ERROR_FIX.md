# Исправление ошибки CSS SyntaxError

## Проблема

Ошибка: `Uncaught SyntaxError: Invalid or unexpected token (at vendors-node_modules...v=1765033934990:5:1)`

Ошибка указывает на проблему в сгенерированном webpack CSS файле, где находится `@font-face` правило для шрифта Inter.

## Причины

1. **Кэш webpack** - старые файлы в `.next` папке
2. **Проблема с импортом шрифтов** - Next.js пытается оптимизировать шрифт Inter
3. **Конфликт CSS импортов** - проблема с `@import` в globals.css

## Решения

### 1. Очистка кэша Next.js (РЕКОМЕНДУЕТСЯ)

```bash
# Остановите dev сервер (Ctrl+C)

# Удалите папку .next
rm -rf apps/frontend/.next

# Или на Windows PowerShell:
Remove-Item -Recurse -Force apps\frontend\.next

# Перезапустите dev сервер
cd apps/frontend
npm run dev
```

### 2. Очистка node_modules (если проблема не решается)

```bash
# Удалите node_modules и package-lock.json
rm -rf apps/frontend/node_modules
rm apps/frontend/package-lock.json

# Переустановите зависимости
cd apps/frontend
npm install

# Перезапустите dev сервер
npm run dev
```

### 3. Проверка конфигурации шрифтов

В `apps/frontend/src/app/layout.tsx` используется:
```typescript
const inter = Inter({ subsets: ["latin", "cyrillic"] });
```

Это должно работать корректно. Если проблема сохраняется, можно попробовать:
- Добавить `display: 'swap'` для оптимизации
- Или использовать другой способ загрузки шрифтов

### 4. Проверка CSS импортов

В `apps/frontend/src/app/globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
```

Убедитесь, что эти пакеты установлены:
```bash
npm list tailwindcss tw-animate-css
```

## Быстрое решение

**Выполните эти команды по порядку:**

```powershell
# 1. Остановите dev сервер (Ctrl+C в терминале где запущен npm run dev)

# 2. Удалите кэш
cd apps\frontend
Remove-Item -Recurse -Force .next

# 3. Перезапустите
npm run dev
```

После этого обновите страницу в браузере с очисткой кэша (Ctrl+Shift+R).

## Если проблема сохраняется

1. Проверьте версию Next.js: `npm list next`
2. Проверьте версию Node.js: `node --version` (должна быть 18+)
3. Попробуйте обновить зависимости: `npm update`
4. Проверьте логи dev сервера на наличие других ошибок

---

**Важно:** Эта ошибка не влияет на функциональность приложения, но может замедлять загрузку. Очистка кэша обычно решает проблему.

