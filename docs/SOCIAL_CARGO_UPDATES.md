# Обновления функционала грузов из социальных сетей

**Дата:** 28 октября 2025  
**Ветка:** social

---

## 🐛 Исправлена критическая ошибка

### Проблема
- При попытке открыть `/social-cargo` возникала ошибка: **"Internal Server Error"**
- Backend падал из-за неправильной логики фильтров в Drizzle ORM

### Причина
В `social-cargo.repository.ts`:
1. Двойной вызов `.where()` (строка 32 и 65) - **невалидно в Drizzle**
2. Неправильный синтаксис для `NOT` с `ilike`
3. Неправильное использование `sql` template для JOIN

### Решение
✅ Полностью переписан `SocialCargoRepository`:
- Используем массив `whereConditions` для накопления условий
- Объединяем все условия через `and()` один раз
- Используем `not()` функцию из Drizzle вместо raw SQL
- Используем `eq()` для JOIN вместо SQL template

**Файл:** `apps/backend/src/api/social-cargo/social-cargo.repository.ts`

---

## ✨ Новая функция: фильтрация через запятую

### Описание
Теперь пользователи могут вводить **несколько слов через запятую** в фильтры.

### Примеры использования

#### Фильтр "Содержит"
**Ввод:** `Москва, срочно, попутный`

**Логика:** Найдутся только те объявления, которые содержат **ВСЕ три слова** (AND).

**SQL эквивалент:**
```sql
WHERE (
  (departure_point ILIKE '%Москва%' OR arrival_point ILIKE '%Москва%' OR ...)
  AND
  (departure_point ILIKE '%срочно%' OR arrival_point ILIKE '%срочно%' OR ...)
  AND
  (departure_point ILIKE '%попутный%' OR arrival_point ILIKE '%попутный%' OR ...)
)
```

#### Фильтр "Не содержит"
**Ввод:** `срочно, попутный, груз 200`

**Логика:** Исключаются объявления, содержащие **ХОТЯ БЫ ОДНО** из этих слов.

**SQL эквивалент:**
```sql
WHERE (
  NOT (departure_point ILIKE '%срочно%' OR arrival_point ILIKE '%срочно%' OR ...)
AND
  NOT (departure_point ILIKE '%попутный%' OR arrival_point ILIKE '%попутный%' OR ...)
  AND
  NOT (departure_point ILIKE '%груз 200%' OR arrival_point ILIKE '%груз 200%' OR ...)
)
```

### Реализация

#### Backend
**Файл:** `apps/backend/src/api/social-cargo/social-cargo.repository.ts`

```typescript
// Обработка фильтра "содержит"
if (contains) {
  const keywords = contains.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  const keywordConditions = keywords.map(keyword => {
    const searchPattern = `%${keyword}%`;
    return or(
      ilike(cargo_messendger.departure_point, searchPattern),
      ilike(cargo_messendger.arrival_point, searchPattern),
      ilike(cargo_messendger.opisanie, searchPattern),
      ilike(cargo_messendger.price, searchPattern)
    );
  });
  
  // AND между всеми ключевыми словами
  whereConditions.push(and(...keywordConditions));
}
```

#### Frontend
**Файл:** `apps/frontend/src/app/social-cargo/page.tsx`

**Изменения:**
1. ✅ Обновлены placeholder'ы с примерами
2. ✅ Добавлены подсказки под полями ввода
3. ✅ Визуальные теги для каждого слова отдельно
4. ✅ Зеленые теги с ✓ для "содержит"
5. ✅ Красные теги с ✗ для "не содержит"

**Скриншот тегов:**
```
✓ Москва    ✓ срочно    ✓ попутный
✗ срочно      ✗ попутный
```

---

## 📊 Примеры использования API

### Простой поиск
```bash
curl "http://localhost:3001/api/social-cargo?contains=Москва"
```

### Множественный поиск (новое!)
```bash
curl "http://localhost:3001/api/social-cargo?contains=Москва,срочно,попутный"
```
*Результат: грузы содержащие ВСЕ три слова*

### Множественное исключение (новое!)
```bash
curl "http://localhost:3001/api/social-cargo?notContains=срочно,попутный,груз%20200"
```
*Результат: грузы БЕЗ этих слов*

### Комбинация (новое!)
```bash
curl "http://localhost:3001/api/social-cargo?contains=Минск,фура&notContains=попутный,срочно&limit=50"
```

---

## 🎨 UI улучшения

### До
```
[Объявление содержит: ]
Placeholder: "Введите ключевое слово..."

Теги: [Содержит: Москва, срочно]
```

### После
```
[Объявление содержит: ]
Placeholder: "Москва, срочно, попутный (через запятую)"
Подсказка: Можно вводить несколько слов через запятую

Теги: [✓ Москва] [✓ срочно] [✓ попутный]
```

---

## ✅ Тестирование

### 1. Проверка базового функционала
```bash
# Запустите бэкенд
cd apps/backend
npm run dev

# В другом терминале
curl http://localhost:3001/api/social-cargo
```
**Ожидаемый результат:** JSON с 20 грузами

### 2. Проверка фильтра с запятыми
```bash
curl "http://localhost:3001/api/social-cargo?contains=Минск,фура"
```
**Ожидаемый результат:** Только грузы содержащие И "Минск" И "фура"

### 3. Проверка на фронтенде
1. Откройте `http://localhost:3000/social-cargo`
2. Введите в "Содержит": `Москва, Минск`
3. Нажмите "Применить фильтры"
4. Проверьте что показываются теги: [✓ Москва] [✓ Минск]

---

## 📝 Обновленная документация

Обновлен файл: `docs/SOCIAL_CARGO_FEATURE.md`

Добавлены разделы:
- ✨ Поддержка запятых в фильтрах
- 📊 Новые примеры API
- 🎨 Визуальные теги

---

## 🔄 Git команды для коммита

```bash
git add apps/backend/src/api/social-cargo/social-cargo.repository.ts
git add apps/frontend/src/app/social-cargo/page.tsx
git add docs/SOCIAL_CARGO_FEATURE.md
git add docs/SOCIAL_CARGO_UPDATES.md

git commit -m "fix: исправлена ошибка фильтров + добавлена поддержка запятых"
```

---

**Автор:** AI Assistant (Claude Sonnet 4.5)

