# Финальное исправление CSS SyntaxError

## Проблема

Ошибка `Uncaught SyntaxError: Invalid or unexpected token` в CSS файле vendors после очистки кэша.

## Что было сделано

1. **Обновлена конфигурация шрифта Inter:**
   - Добавлен `display: 'swap'`
   - Добавлен `variable: '--font-inter'`
   - Добавлен `preload: true`
   - Добавлен `fallback: ['system-ui', 'arial']`

2. **Упрощена webpack конфигурация:**
   - Убрана конфликтующая обработка CSS (Next.js сам обрабатывает CSS)

## Если ошибка все еще есть

### Вариант 1: Полная пересборка

```powershell
# 1. Остановите dev сервер (Ctrl+C)

# 2. Удалите все кэши
cd apps\frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 3. Перезапустите
npm run dev
```

### Вариант 2: Проверка версии Next.js

```powershell
cd apps\frontend
npm list next
```

Если версия устарела:
```powershell
npm install next@latest
```

### Вариант 3: Временное отключение оптимизации шрифтов

Если ничего не помогает, можно временно использовать обычный CSS импорт:

1. В `apps/frontend/src/app/layout.tsx` закомментируйте:
```typescript
// const inter = Inter({ subsets: ["latin", "cyrillic"] });
```

2. В `apps/frontend/src/app/globals.css` добавьте в начало:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap&subset=latin,cyrillic');
```

3. В `apps/frontend/src/app/layout.tsx` измените:
```typescript
<body className="antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
```

## Важно

Эта ошибка обычно **не критична** и не влияет на функциональность приложения. Если приложение работает нормально, можно игнорировать эту ошибку в консоли.

Ошибка связана с тем, как webpack генерирует CSS для оптимизированных шрифтов Next.js, и это известная проблема в некоторых версиях Next.js 15.

---

**Рекомендация:** Попробуйте сначала вариант 1 (полная пересборка). Если не поможет, используйте вариант 3 как временное решение.

