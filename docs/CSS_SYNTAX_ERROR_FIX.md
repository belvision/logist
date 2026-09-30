# Исправление CSS SyntaxError после очистки кэша

## Проблема

Ошибка `Uncaught SyntaxError: Invalid or unexpected token` в файле `vendors-node_modules...` на строке 5, где находится `@font-face` правило для шрифта Inter.

Очистка кэша не помогла.

## Причина

Проблема связана с тем, как Next.js 15 оптимизирует и генерирует CSS для шрифтов из `next/font/google`. При определенных условиях webpack может неправильно обработать сгенерированный CSS.

## Решение

### 1. Обновлена конфигурация шрифта Inter

В `apps/frontend/src/app/layout.tsx`:
- Добавлен `display: 'swap'` для оптимизации загрузки
- Добавлен `variable: '--font-inter'` для CSS переменной
- Добавлен `preload: true` для предзагрузки
- Добавлен `fallback: ['system-ui', 'arial']` для fallback шрифтов

### 2. Обновлена webpack конфигурация

В `apps/frontend/next.config.ts`:
- Добавлено исключение для `next/font` модулей из обработки CSS

## Дополнительные шаги

### Если ошибка все еще есть:

1. **Полная пересборка:**
```powershell
# Остановите dev сервер (Ctrl+C)
cd apps\frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm run dev
```

2. **Проверка версии Next.js:**
```powershell
npm list next
```

Если версия устарела, обновите:
```powershell
npm install next@latest
```

3. **Альтернативный способ - отключить оптимизацию шрифтов:**

Если проблема сохраняется, можно временно использовать обычный импорт шрифтов через CSS вместо `next/font/google`.

### Временное решение (если ничего не помогает)

Можно закомментировать оптимизацию шрифтов:

```typescript
// В apps/frontend/src/app/layout.tsx
// const inter = Inter({ subsets: ["latin", "cyrillic"] });

// И использовать обычный CSS импорт в globals.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
```

Но это не рекомендуется, так как теряются преимущества оптимизации Next.js.

## Проверка

После изменений:
1. Остановите dev сервер
2. Удалите `.next` папку
3. Перезапустите: `npm run dev`
4. Обновите страницу с очисткой кэша (Ctrl+Shift+R)

---

**Важно:** Эта ошибка обычно не критична и не влияет на функциональность, но может замедлять загрузку. Если приложение работает нормально, можно игнорировать эту ошибку в консоли.

