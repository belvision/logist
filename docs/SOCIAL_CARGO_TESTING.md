# Тестирование функции социальных грузов

## ✅ Статус

### Backend
- ✅ API работает на `http://localhost:5555/api/social-cargo`
- ✅ Возвращает данные из таблицы `cargo_messendger`
- ✅ Фильтры с запятыми работают корректно
- ✅ Обработка NULL значений исправлена

### Frontend
- ⏳ Требуется проверка страницы `/social-cargo`

## 🧪 Проверка работы

### 1. Проверка Backend API
```bash
# Тест без фильтров
curl http://localhost:5555/api/social-cargo?limit=3

# Тест с фильтром "содержит"
curl "http://localhost:5555/api/social-cargo?contains=Минск,фура"

# Тест с фильтром "не содержит"
curl "http://localhost:5555/api/social-cargo?notContains=срочно,попутный"

# Комбинированные фильтры
curl "http://localhost:5555/api/social-cargo?contains=Минск&notContains=срочно&limit=50"
```

### 2. Запуск Frontend в режиме разработки

**Важно**: Убедитесь, что смотрите на локальный сервер, а НЕ на `https://logistgo.pro`!

```bash
# Перейдите в папку frontend
cd apps/frontend

# Запустите dev-сервер
npm run dev
```

Frontend должен запуститься на `http://localhost:3000`

### 3. Проверка страницы `/social-cargo`

Откройте в браузере:
```
http://localhost:3000/social-cargo
```

**НЕ** `https://logistgo.pro/social-cargo` (это production!)

### 4. Проверка в браузере

1. Откройте DevTools (F12)
2. Перейдите на вкладку Network
3. Обновите страницу `/social-cargo`
4. Проверьте:
   - Запрос к `/api/social-cargo` должен возвращать 200 OK
   - В Preview должны быть данные грузов
   - На странице должны отображаться карточки грузов

### 5. Очистка кеша (если страница не обновляется)

**В браузере:**
- Ctrl + Shift + Delete → Очистить кеш
- Или Ctrl + F5 для жесткой перезагрузки

**В Next.js:**
```bash
# Удалить кеш Next.js
cd apps/frontend
rm -rf .next
npm run dev
```

## 🐛 Типичные проблемы

### Проблема: "Ничего не отображается"

**Решение 1: Проверьте URL**
- ✅ Правильно: `http://localhost:3000/social-cargo`
- ❌ Неправильно: `https://logistgo.pro/social-cargo`

**Решение 2: Проверьте, что frontend запущен**
```bash
# Должно быть запущено на localhost:3000
cd apps/frontend
npm run dev
```

**Решение 3: Проверьте, что backend запущен**
```bash
# Должно быть запущено на localhost:5555
cd apps/backend
npm run dev
```

**Решение 4: Очистите кеш браузера**
- Ctrl + Shift + Delete
- Или откройте в режиме инкогнито

### Проблема: "Failed to fetch"

**Решение: Проверьте CORS**
Backend должен разрешать запросы с `localhost:3000`:
```bash
# В .env backend
CORS_ORIGIN=http://localhost:3000,http://0.0.0.0:3000,https://logistgo.pro
```

## 📝 Что исправлено

1. ✅ **Импорт БД**: Изменен с `{ db }` на `db` (default export)
2. ✅ **Обработка NULL**: Добавлена проверка NULL для полей `opisanie` и `price`
3. ✅ **Логирование**: Добавлено подробное логирование ошибок
4. ✅ **Упоминания Украины**: Удалены из кода и документации

## 🎯 Следующие шаги

1. Убедитесь, что смотрите на `http://localhost:3000/social-cargo`
2. Если страница пустая, откройте DevTools (F12) и проверьте консоль
3. Проверьте вкладку Network, есть ли ошибки при запросе к API
4. Если проблема остается, пришлите скриншот консоли браузера

