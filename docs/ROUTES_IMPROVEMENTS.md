# Улучшения компонента Routes (Маршруты)

## Обзор изменений

Компонент создания маршрутов был полностью переработан с добавлением новых функций и улучшенным UI.

## Основные изменения

### 1. ✅ Интеграция с Nominatim

**Что изменилось:**
- Добавлен компонент `LocationSearchBox` для поиска точек отправления и прибытия
- Автоматический поиск мест через API Nominatim
- Валидация и сохранение координат в формате `{place_id: {lat, lon}}`

**Преимущества:**
- Точный геопоиск с автодополнением
- Сохранение координат для построения маршрутов
- Улучшенный UX с выпадающими подсказками

### 2. ✅ Промежуточные точки (Waypoints)

**Что изменилось:**
- Добавлен компонент `WaypointSearch` для добавления промежуточных точек
- Поддержка множественных промежуточных остановок
- Визуальное отображение списка waypoints

**Формат данных:**
```json
{
  "3044392": {
    "lat": 53.1322925,
    "lon": 26.0184156,
    "waypoints": [
      {
        "place_id": 3076353,
        "lat": 52.7919112,
        "lon": 27.9994587,
        "name": "Любань, Любанский район, Минская область, Беларусь"
      }
    ]
  }
}
```

**Преимущества:**
- Возможность добавлять неограниченное количество промежуточных точек
- Удобное управление списком точек (добавление/удаление)
- Совместимость с форматом данных таблицы cargo

### 3. ✅ Улучшенный календарь

**Что изменилось:**
- Использование `react-day-picker` вместо стандартного компонента
- Кастомные стили календаря в темной теме
- Адаптивная верстка для мобильных устройств

**Файлы:**
- `apps/frontend/src/styles/calendar.css` - кастомные стили

**Преимущества:**
- Современный и красивый UI
- Темная тема, совместимая с дизайном приложения
- Лучшая доступность и UX

### 4. ✅ Улучшенный UI/UX

**Что изменилось:**
- Gradient-дизайн для карточек маршрутов
- Визуальные индикаторы для разных элементов (точки, даты, автомобили)
- Улучшенная типографика и spacing
- Анимации и hover-эффекты

**Компоненты:**
- Иконки для визуального разделения информации
- Цветовое кодирование (зеленый - отправление, красный - прибытие, синий - waypoints)
- Gradient-фоны и border-эффекты

## Изменения в Backend

### Схема базы данных

**Файл:** `apps/backend/src/db/schema/schema.ts`

```typescript
places_departure: jsonb('places_departure')
  .$type<Record<string, { 
    lat: number; 
    lon: number; 
    waypoints?: Array<{ 
      place_id: number; 
      lat: number; 
      lon: number; 
      name: string 
    }> 
  }>>()
  .notNull().default(sql`'{}'::jsonb`),
```

### Валидация (Zod Schema)

**Файл:** `apps/backend/src/api/routes/routes.schema.ts`

```typescript
places_departure: z.union([
  z.record(
    z.string(),
    z.object({ 
      lat: z.number(), 
      lon: z.number(),
      waypoints: z.array(z.object({
        place_id: z.number(),
        lat: z.number(),
        lon: z.number(),
        name: z.string()
      })).optional()
    })
  ),
  z.object({}).passthrough()
]).optional(),
```

## Структура таблицы routes

```sql
CREATE TABLE routes (
  id_routes SERIAL PRIMARY KEY,
  id_cars INTEGER REFERENCES cars(id_cars) ON DELETE SET NULL,
  id_company UUID NOT NULL REFERENCES company(id_company) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id_user) ON DELETE RESTRICT,
  departure_point TEXT NOT NULL,
  arrival_point TEXT NOT NULL,
  places_departure JSONB NOT NULL DEFAULT '{}'::jsonb,
  places_arrival JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_start TIMESTAMP NOT NULL,
  opisanie TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Использование

### Создание маршрута

1. Выберите автомобиль (необязательно)
2. Введите точку отправления через поиск Nominatim
3. Добавьте промежуточные точки (необязательно)
4. Введите точку прибытия через поиск Nominatim
5. Выберите дату отправления
6. Добавьте описание (необязательно)
7. Нажмите "Создать маршрут"

### Пример данных

**Запрос:**
```json
{
  "id_cars": 42,
  "departure_point": "Минск, Беларусь",
  "arrival_point": "Гомель, Беларусь",
  "places_departure": {
    "625144": {
      "lat": 53.9006011,
      "lon": 27.558972,
      "waypoints": [
        {
          "place_id": 3076353,
          "lat": 52.7919112,
          "lon": 27.9994587,
          "name": "Любань, Любанский район, Минская область, Беларусь"
        }
      ]
    }
  },
  "places_arrival": {
    "3063450": {
      "lat": 52.4345138,
      "lon": 30.9870832
    }
  },
  "date_start": "2025-10-30T00:00:00.000Z",
  "opisanie": "Доставка груза с остановкой в Любани"
}
```

## Совместимость

✅ Формат данных совместим с таблицей `cargo`  
✅ Использует те же API Nominatim  
✅ Использует те же компоненты поиска (`LocationSearchBox`, `WaypointSearch`)  
✅ Темная тема и единый стиль приложения

## Зависимости

- `react-day-picker ^9.11.1` - уже установлена
- Компонент `LocationSearchBox` - `apps/frontend/src/components/car-search/LocationSearchBox.tsx`
- Компонент `WaypointSearch` - `apps/frontend/src/components/cargo/WaypointSearch.tsx`

## Файлы изменений

### Frontend
- ✅ `apps/frontend/src/components/routes/Routes.tsx` - основной компонент
- ✅ `apps/frontend/src/styles/calendar.css` - стили календаря

### Backend
- ✅ `apps/backend/src/api/routes/routes.schema.ts` - валидация
- ✅ `apps/backend/src/db/schema/schema.ts` - схема БД
- ✅ `apps/backend/src/api/routes/routes.service.ts` - логика (без изменений)

## Скриншоты функций

### Поиск точек через Nominatim
- Автодополнение при вводе
- Отображение координат
- Валидация выбора

### Промежуточные точки
- Добавление waypoints
- Визуальный список с возможностью удаления
- Сохранение в JSON формате

### Календарь
- Темная тема
- Выделение текущей даты
- Выделение выбранной даты
- Адаптивная верстка

## Следующие шаги (опционально)

- [ ] Добавить визуализацию маршрута на карте
- [ ] Интеграция с OSRM для расчета расстояния
- [ ] Редактирование существующих маршрутов
- [ ] Фильтрация и поиск маршрутов
- [ ] Экспорт маршрутов

