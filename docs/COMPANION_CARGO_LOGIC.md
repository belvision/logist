# Логика обработки попутных грузов

## Обзор

Система поиска попутных грузов позволяет найти грузы, которые можно взять попутно по маршруту пользователя. Алгоритм основан на сравнении OSRM node IDs и проверке геометрии маршрутов для определения совпадения и направления движения.

## Архитектура

### Компоненты системы

1. **Backend (Node.js + Hono)**
   - `apps/backend/src/api/cargo/cargo.service.ts` - Создание и обновление грузов с сохранением route_nodes
   - `apps/backend/src/api/companion_cargo/companion_cargo.service.ts` - Поиск попутных грузов
   - `apps/backend/src/api/companion_cargo/companion_cargo.repository.ts` - Работа с БД
   - `apps/backend/src/api/companion_cargo/companion_cargo.controller.ts` - Обработка HTTP запросов
   - `apps/backend/src/api/companion_cargo/companion_cargo.router.ts` - Роутинг API

2. **Frontend (React + Leaflet)**
   - `apps/frontend/src/components/cargo-search/MapCanvas.tsx` - Прорисовка маршрутов на карте
   - `apps/frontend/src/app/company/[company_id]/cargo-search/page.tsx` - Страница поиска грузов

3. **База данных (PostgreSQL + Drizzle ORM)**
   - Таблица `cargo` с полем `route_nodes` (JSONB, массив чисел) - сохраненные OSRM node IDs

---

## Часть 1: Логика добавления грузов

### 1.1. Процесс создания груза

При создании груза (`createCargoService` в `cargo.service.ts`) выполняется следующая последовательность:

#### Шаг 1: Извлечение координат

1. Из `departure_place_id` (JSONB объект) извлекается основная точка отправления:
   ```typescript
   const depKeys = Object.keys(dto.departure_place_id);
   const depPlaceId = depKeys[0];
   departureCoords = dto.departure_place_id[depPlaceId]; // { lat, lon }
   ```

2. Из `arrival_place_id` (JSONB объект) извлекается точка прибытия:
   ```typescript
   const arrKeys = Object.keys(dto.arrival_place_id);
   const arrPlaceId = arrKeys[0];
   arrivalCoords = dto.arrival_place_id[arrPlaceId]; // { lat, lon }
   ```

3. Из `departure_place_id.waypoints` (если есть) извлекаются промежуточные точки:
   ```typescript
   if ('waypoints' in dto.departure_place_id) {
     waypoints = dto.departure_place_id.waypoints; // Array<{ lat, lon }>
   }
   ```

#### Шаг 2: Построение маршрута через OSRM

Вызывается функция `buildCargoRouteNodes(departureCoords, arrivalCoords, waypoints)`:

1. Формируется строка координат для OSRM:
   ```typescript
   const allPoints = [departureCoords, ...waypoints, arrivalCoords];
   const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
   // Пример: "23.6851851,52.093751;23.8342648,53.6834599;27.5618225,53.9024716"
   ```

2. Выполняется запрос к OSRM:
   ```
   GET /route/v1/driving/{pointsString}?overview=full&geometries=geojson&steps=true&annotations=nodes
   ```

3. OSRM возвращает маршрут с:
   - `routes[0].legs[]` - массив сегментов маршрута (между точками)
   - `routes[0].legs[i].annotation.nodes` - массив OSRM node IDs для каждого сегмента

#### Шаг 3: Извлечение и упрощение nodes

Функция `extractSimplifiedNodes(osrmResponse)` обрабатывает ответ OSRM:

**ВАЖНО: Правильный сбор nodes из legs**

OSRM возвращает маршрут как массив `legs` (сегментов). Каждый leg содержит nodes от одной точки до другой. **Критически важно**: последняя node каждого leg совпадает с первой node следующего leg.

**Правильный алгоритм сбора:**

```typescript
const allNodes: number[] = [];

for (let legIndex = 0; legIndex < r.legs.length; legIndex++) {
  const leg = r.legs[legIndex];
  const legNodes = leg.annotation.nodes;
  
  if (legIndex === 0) {
    // Первый leg - добавляем ВСЕ nodes
    allNodes.push(...legNodes);
  } else {
    // Остальные legs - пропускаем первую node (она совпадает с последней предыдущего)
    allNodes.push(...legNodes.slice(1));
  }
}
```

**Пример:**
- Leg 0 (Брест → Гродно): nodes [100, 101, 102, 103, 104]
- Leg 1 (Гродно → Минск): nodes [104, 105, 106, 107, 108]
- Результат: [100, 101, 102, 103, 104, 105, 106, 107, 108] (без дублирования 104)

**Упрощение nodes (каждая 50-я точка):**

После сбора всех nodes выполняется упрощение:

```typescript
const simplifiedNodes: number[] = [];

// Всегда первая точка
simplifiedNodes.push(allNodes[0]);

// Каждая 50-я точка (начиная с 50-й)
for (let i = 50; i < allNodes.length; i += 50) {
  simplifiedNodes.push(allNodes[i]);
}

// Всегда последняя точка (если еще не добавлена)
const lastNode = allNodes[allNodes.length - 1];
if (simplifiedNodes[simplifiedNodes.length - 1] !== lastNode) {
  simplifiedNodes.push(lastNode);
}
```

**Пример:**
- Всего nodes: 1000
- Упрощенные: [0, 50, 100, 150, ..., 950, 999]
- Примерно 20-21 node вместо 1000

#### Шаг 4: Сохранение в БД

Упрощенные nodes сохраняются в поле `route_nodes` таблицы `cargo`:

```typescript
await insertCargo({
  // ... другие поля
  route_nodes: simplifiedNodes, // JSONB массив чисел
});
```

**Схема БД:**
```typescript
route_nodes: jsonb('route_nodes')
  .$type<number[]>()
  .default(sql`'[]'::jsonb`)
```

### 1.2. Процесс обновления груза

При обновлении груза (`updateCargoService`) проверяется, изменились ли координаты:

1. Если изменились `departure_place_id`, `arrival_place_id` или `waypoints`
2. Вызывается `buildCargoRouteNodes()` для пересчета nodes
3. Обновляется `route_nodes` в БД

---

## Часть 2: Логика поиска попутных грузов

### 2.1. Построение маршрута пользователя

#### Вариант A: С переданной геометрией (`user_route_geo`)

Если фронтенд передает готовую геометрию маршрута:

1. **Проверка промежуточных точек:**
   - Если есть `waypoints` или `waypoint_coords`, маршрут перестраивается через OSRM для получения точных nodes
   - Если промежуточных точек нет, но есть `user_route_nodes`, используются переданные nodes

2. **Построение через OSRM (если есть waypoints):**
   ```typescript
   const allPoints = [dep, ...waypointCoords, arr];
   const pointsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');
   // Запрос к OSRM с annotations=nodes
   ```

3. **Сбор nodes из legs:**
   - Используется тот же алгоритм, что и при создании груза
   - **ВАЖНО**: пропускается первая node каждого последующего leg

#### Вариант B: Без переданной геометрии

1. Получаются координаты по `place_id` через Nominatim
2. Если есть `waypoint_coords` или `waypoints`, они включаются в маршрут
3. Маршрут строится через OSRM с учетом всех промежуточных точек
4. Nodes собираются из всех legs с правильной обработкой дублирования

**Критический момент:** Если промежуточные точки есть, но не переданы в `waypoints` или `waypoint_coords`, маршрут будет построен **напрямую** (без промежуточных точек), что приведет к неправильному поиску.

### 2.2. Получение кандидатов из БД

Функция `findCandidateCargos()` в `companion_cargo.repository.ts`:

1. **Фильтрация по статусу:**
   ```sql
   WHERE cargo.status = 0 AND cargo.irrelevant = 0
   ```

2. **Фильтрация по дате:**
   ```sql
   WHERE cargo.date_end >= CURRENT_DATE
   ```
   **ВАЖНО**: Фильтруется по `date_end`, а не `date_start`!

3. **Выборка полей:**
   - Все поля груза
   - `route_nodes` - сохраненные упрощенные nodes
   - Информация о компании

### 2.3. Сравнение маршрутов

Для каждого кандидата выполняется двухуровневая проверка:

#### Уровень 1: Проверка по геометрии маршрута

Функция `checkCargoEndpointsOnRoute()` проверяет, находятся ли начало и конец груза на маршруте пользователя:

**Алгоритм:**

1. **Извлечение координат груза:**
   ```typescript
   const departureCoords = cargo.departure_place_id[depPlaceId]; // { lat, lon }
   const arrivalCoords = cargo.arrival_place_id[arrPlaceId]; // { lat, lon }
   ```

2. **Поиск ближайших точек на маршруте пользователя:**
   ```typescript
   // Для начала груза
   let minStartDist = Infinity;
   let startIndex = -1;
   for (let i = 0; i < routeCoords.length; i++) {
     const dist = haversineMeters(
       departureCoords.lat, departureCoords.lon,
       routeCoords[i][1], routeCoords[i][0] // [lon, lat]
     );
     if (dist < minStartDist) {
       minStartDist = dist;
       startIndex = i;
     }
   }
   
   // Аналогично для конца груза
   ```

3. **Проверка условий:**
   - `minStartDist <= 15000` (15 км) - начало груза на маршруте
   - `minEndDist <= 15000` (15 км) - конец груза на маршруте
   - `startIndex < endIndex` - направление совпадает

4. **Результат:**
   - Если все условия выполнены → груз считается подходящим на **100%**
   - Поиск прекращается, переход к следующему грузу

**Зачем это нужно:**
- Груз может идти по другой трассе, но пересекаться с маршрутом пользователя
- Например, груз идет через центр города, а пользователь по объездной
- Они пересекаются на мосту/эстакаде на разных уровнях
- Nodes не совпадают, но координаты начала и конца близки к маршруту

#### Уровень 2: Проверка по nodes

Если проверка по геометрии не прошла, выполняется сравнение по nodes.

Функция `compareRoutesByNodes(userRouteNodes, cargoNodes, minPercent)`:

**Шаг 1: Проверка по 10% хвостам**

Груз начинается и заканчивается в городах, а маршрут идет по трассе. Поэтому проверяются не первая/последняя node, а первые и последние 10% nodes:

```typescript
const tailPercent = 0.1; // 10%
const startTailCount = Math.max(1, Math.ceil(cargoNodes.length * tailPercent));
const endTailCount = Math.max(1, Math.ceil(cargoNodes.length * tailPercent));

const cargoStartNodes = cargoNodes.slice(0, startTailCount);
const cargoEndNodes = cargoNodes.slice(-endTailCount);
```

**Поиск совпадений:**

```typescript
// Ищем хотя бы одну node из начала груза на маршруте пользователя
let startIndex = -1;
for (const startNode of cargoStartNodes) {
  const index = userRouteNodes.indexOf(startNode);
  if (index !== -1) {
    startIndex = index;
    break;
  }
}

// Аналогично для конца
```

**Проверка направления:**
- Если `startIndex !== -1 && endIndex !== -1 && startIndex < endIndex`
- → Груз считается подходящим на **100%**

**Шаг 2: Прежняя логика (если проверка хвостов не прошла)**

1. **Создание Set для быстрого поиска:**
   ```typescript
   const userRouteNodesSet = new Set(userRouteNodes);
   ```

2. **Поиск совпадающих nodes:**
   ```typescript
   const matchedPositions: number[] = [];
   for (const cargoNode of cargoNodes) {
     if (userRouteNodesSet.has(cargoNode)) {
       const userIndex = userRouteNodes.indexOf(cargoNode);
       if (userIndex !== -1) {
         matchedPositions.push(userIndex);
       }
     }
   }
   ```

3. **Расчет процента совпадения:**
   ```typescript
   const matchPercent = Math.round(
     (matchedPositions.length / cargoNodes.length) * 100
   );
   ```

4. **Проверка направления:**
   ```typescript
   let sameDirection = false;
   if (matchedPositions.length >= 2) {
     sameDirection = true;
     for (let i = 1; i < matchedPositions.length; i++) {
       if (matchedPositions[i] <= matchedPositions[i - 1]) {
         sameDirection = false;
         break;
       }
     }
   }
   ```

**Пример расчета:**
- Nodes груза: 50 (каждая 50-я из ~2500)
- Совпадающие nodes: 35
- Процент: (35 / 50) * 100 = 70%

### 2.4. Фильтрация результатов

Груз считается подходящим, если:

1. **Проверка по геометрии прошла** (100% совпадение), ИЛИ
2. **Проверка по nodes:**
   - `matchPercent >= minPercent` (из запроса пользователя)
   - `sameDirection === true`

### 2.5. Построение геометрии для отображения

Если `withRoutes = true`, для каждого подходящего груза:

1. Если у груза есть `route_nodes`, но нет полной геометрии
2. Выполняется запрос к OSRM для построения полного маршрута
3. Геометрия добавляется в ответ для отображения на карте

**Оптимизация:**
- Геометрия строится только для подходящих грузов
- Если геометрия уже есть (из предыдущих запросов), она переиспользуется

---

## Часть 3: Логика прорисовки на карте

### 3.1. Компонент MapCanvas

Компонент `MapCanvas` (`apps/frontend/src/components/cargo-search/MapCanvas.tsx`) отвечает за отображение маршрутов на карте Leaflet.

### 3.2. Структура данных

**Props компонента:**
```typescript
{
  mainRoute: { geometry: LineString } | null; // Маршрут пользователя
  mainStart: { lat: number; lon: number } | null;
  mainEnd: { lat: number; lon: number } | null;
  companionCargos: CompanionCargo[]; // Найденные грузы
  visibleIds: Set<string | number>; // ID видимых грузов
  focusId: string | number | null; // ID выделенного груза
  height?: number | string;
}
```

**CompanionCargo:**
```typescript
{
  id_cargo: number | string;
  match_percent?: number;
  departure_point?: string;
  arrival_point?: string;
  route?: {
    distance: number;
    duration: number;
    geometry: LineString; // GeoJSON LineString
  };
  company?: { ... };
}
```

### 3.3. Стили отображения

**Маршрут пользователя:**
- Цвет: `#2563eb` (синий)
- Толщина: 8px
- Halo (обводка): +1px для контраста

**Маршруты грузов:**
- Базовая толщина: 6px
- При наложении: 4px (второй и последующие грузы)
- Прозрачность: 0.9
- Цвета: контрастная палитра (красный, зеленый, желтый, оранжевый, фиолетовый, розовый, бирюзовый, лайм)

**Палитра цветов:**
```typescript
const CARGO_PALETTE = [
  '#ef4444', // красный
  '#22c55e', // зелёный
  '#fbbf24', // жёлтый
  '#f97316', // оранжевый
  '#a855f7', // фиолетовый
  '#ec4899', // розовый
  '#06b6d4', // бирюзовый
  '#84cc16', // лайм
  // ... дополнительные цвета
];
```

### 3.4. Алгоритм прорисовки

#### Инициализация карты

1. Создается карта Leaflet с центром в Минске
2. Добавляется слой OpenStreetMap
3. Инициализируются refs для хранения слоев:
   ```typescript
   layersRef.current = {
     base?: L.LayerGroup; // Базовый слой
     main?: { // Маршрут пользователя
       halo?: L.Polyline;
       line?: L.Polyline;
       start?: L.CircleMarker;
       end?: L.CircleMarker;
     };
     similars: Map<string, L.LayerGroup>; // Грузы
     similarMarkers: Map<string, { start?: L.CircleMarker; end?: L.CircleMarker }>;
     baseGeom: Map<string, LineString>; // Геометрия грузов
     styles: Map<string, { color, weight, opacity }>; // Стили грузов
   };
   ```

#### Прорисовка маршрута пользователя

1. **Halo (обводка):**
   ```typescript
   const halo = L.polyline(latlngs, {
     color: '#ffffff',
     weight: MAIN_WIDTH + HALO_EXTRA * 2, // 10px
     opacity: 0.8,
   });
   ```

2. **Основная линия:**
   ```typescript
   const line = L.polyline(latlngs, {
     color: MAIN_COLOR, // #2563eb
     weight: MAIN_WIDTH, // 8px
     opacity: 1.0,
   });
   ```

3. **Маркеры начала и конца:**
   ```typescript
   const startMarker = L.circleMarker([startLat, startLon], {
     radius: 8,
     fillColor: '#10b981',
     color: '#ffffff',
     weight: 2,
   });
   
   const endMarker = L.circleMarker([endLat, endLon], {
     radius: 8,
     fillColor: '#ef4444',
     color: '#ffffff',
     weight: 2,
   });
   ```

#### Прорисовка грузов

**Оптимизация: Batch rendering через requestAnimationFrame**

Для производительности все грузы отрисовываются в одном кадре:

```typescript
useEffect(() => {
  let frameId: number;
  
  const render = () => {
    frameId = requestAnimationFrame(() => {
      // Отрисовка всех грузов
      for (const cargo of companionCargos) {
        // ...
      }
    });
  };
  
  render();
  return () => cancelAnimationFrame(frameId);
}, [companionCargos, visibleIds]);
```

**Алгоритм для каждого груза:**

1. **Проверка видимости:**
   ```typescript
   const isVisible = visibleIds.has(String(cargo.id_cargo));
   if (!isVisible) {
     // Удаляем слой, если был
     if (has) map.removeLayer(has);
     continue;
   }
   ```

2. **Проверка геометрии:**
   ```typescript
   const baseGeom = cargo?.route?.geometry;
   if (!baseGeom || baseGeom.type !== 'LineString') {
     // Удаляем слой, если был
     continue;
   }
   ```

3. **Определение цвета:**
   ```typescript
   const sortedCargoIds = [...visibleIds].sort(/* ... */);
   const cargoIndex = sortedCargoIds.indexOf(String(cargo.id_cargo));
   const color = CARGO_PALETTE[cargoIndex % CARGO_PALETTE.length];
   ```

4. **Создание полилинии:**
   ```typescript
   const coords = baseGeom.coordinates; // [lon, lat][]
   const latlngs = coords.map(([lon, lat]) => [lat, lon]); // Leaflet использует [lat, lon]
   
   const polyline = L.polyline(latlngs, {
     color: color,
     weight: SIM_WIDTH, // 6px
     opacity: SIM_OPACITY, // 0.9
   });
   ```

5. **Создание маркеров начала и конца:**
   ```typescript
   const startCoord = coords[0]; // [lon, lat]
   const endCoord = coords[coords.length - 1];
   
   const startMarker = L.circleMarker([startCoord[1], startCoord[0]], {
     radius: 6,
     fillColor: color,
     color: '#ffffff',
     weight: 2,
   });
   
   const endMarker = L.circleMarker([endCoord[1], endCoord[0]], {
     radius: 6,
     fillColor: color,
     color: '#ffffff',
     weight: 2,
   });
   ```

6. **Группировка в LayerGroup:**
   ```typescript
   const layerGroup = L.layerGroup([polyline, startMarker, endMarker]);
   layerGroup.addTo(map);
   ```

7. **Обработка выделения (focus):**
   ```typescript
   if (String(cargo.id_cargo) === String(focusId)) {
     // Выделенный груз отрисовывается поверх остальных
     layerGroup.bringToFront();
     // Увеличиваем толщину
     polyline.setStyle({ weight: SIM_WIDTH + 2 });
   }
   ```

### 3.5. Оптимизации производительности

1. **Batch rendering:** Все грузы отрисовываются в одном `requestAnimationFrame`
2. **Удаление невидимых:** Грузы, не в `visibleIds`, удаляются с карты
3. **Кэширование слоев:** Слои переиспользуются, если геометрия не изменилась
4. **Ранний выход:** Если геометрия отсутствует, груз пропускается

### 3.6. Обработка событий

**Tooltip при наведении:**
```typescript
polyline.bindTooltip(
  `${cargo.departure_point} → ${cargo.arrival_point} (${cargo.match_percent}%)`,
  { permanent: false }
);
```

**Клик по грузу:**
- Обрабатывается родительским компонентом через `focusId`
- Выделенный груз отрисовывается поверх остальных

---

## Критические моменты и частые ошибки

### 1. Неправильный сбор nodes из legs

**Ошибка:**
```typescript
// НЕПРАВИЛЬНО - дублирование nodes
for (const leg of r.legs) {
  allNodes.push(...leg.annotation.nodes); // Дублируется последняя node предыдущего leg
}
```

**Правильно:**
```typescript
// ПРАВИЛЬНО - пропуск первой node каждого последующего leg
for (let legIndex = 0; legIndex < r.legs.length; legIndex++) {
  const legNodes = r.legs[legIndex].annotation.nodes;
  if (legIndex === 0) {
    allNodes.push(...legNodes);
  } else {
    allNodes.push(...legNodes.slice(1)); // Пропускаем первую node
  }
}
```

### 2. Игнорирование промежуточных точек

**Ошибка:** Если маршрут пользователя имеет промежуточные точки, но они не переданы в `waypoints` или `waypoint_coords`, маршрут строится напрямую.

**Решение:** Всегда проверять наличие `waypoint_coords` в блоке `else` (когда нет переданной геометрии).

### 3. Фильтрация по неправильной дате

**Ошибка:** Фильтровать по `date_start` вместо `date_end`.

**Правильно:**
```sql
WHERE cargo.date_end >= CURRENT_DATE
```

### 4. Неправильный формат координат

**Важно:**
- GeoJSON: `[lon, lat]` (долгота, широта)
- Leaflet: `[lat, lon]` (широта, долгота)
- OSRM: `lon,lat` (строка)

При конвертации между форматами нужно быть внимательным.

---

## API Эндпоинты

### 1. Построение маршрута пользователя
**POST** `/api/companion-cargo/build-route`

Строит маршрут через OSRM с учетом промежуточных точек.

**Запрос:**
```json
{
  "points": [
    { "lat": 52.093751, "lon": 23.6851851 },
    { "lat": 53.6834599, "lon": 23.8342648 },
    { "lat": 53.9024716, "lon": 27.5618225 }
  ],
  "avoidMotorwayToll": false
}
```

**Ответ:**
```json
{
  "ok": true,
  "data": {
    "distance": 351309.8,
    "duration": 14858.2,
    "geometry": {
      "type": "LineString",
      "coordinates": [[23.6851851, 52.093751], ...]
    },
    "nodes": [3291247709, 10196545185, ...]
  }
}
```

### 2. Поиск попутных грузов
**POST** `/api/companion-cargo/companion-cargos`

Ищет грузы, совпадающие с маршрутом пользователя.

**Запрос:**
```json
{
  "user_route": {
    "departure_place_id": 10687611,
    "arrival_place_id": 3461526,
    "departure_coords": { "lat": 52.093751, "lon": 23.6851851 },
    "arrival_coords": { "lat": 53.9024716, "lon": 27.5618225 },
    "waypoints": [123456],
    "waypoint_coords": [{ "lat": 53.6834599, "lon": 23.8342648 }]
  },
  "user_route_geo": {
    "type": "LineString",
    "coordinates": [[23.6851851, 52.093751], ...]
  },
  "user_route_nodes": [3291247709, 10196545185, ...],
  "min_percent": 50,
  "withRoutes": true,
  "stepMeters": 5000,
  "toleranceMeters": 20000
}
```

**Ответ:**
```json
{
  "ok": true,
  "data": {
    "ok": true,
    "count": 2,
    "items": [
      {
        "id_cargo": 37,
        "departure_point": "Брест, Брестская область, Беларусь",
        "arrival_point": "Жодино, Минская область, Беларусь",
        "match_percent": 75,
        "route": {
          "distance": 351309.8,
          "duration": 14858.2,
          "geometry": {
            "type": "LineString",
            "coordinates": [[23.6851851, 52.093751], ...]
          }
        },
        "company": { ... }
      }
    ]
  }
}
```

---

## Параметры запроса

### `min_percent` (0-100)
Минимальный процент совпадения маршрута груза с маршрутом пользователя. По умолчанию: 0%

### `stepMeters` (опционально)
Шаг выборки точек маршрута для сравнения. По умолчанию: 5000 м

### `toleranceMeters` (опционально)
Максимальное расстояние от точки маршрута груза до маршрута пользователя (для проверки по геометрии). По умолчанию: 20000 м (20 км)

### `withRoutes` (опционально)
Включать ли геометрию маршрутов грузов в ответ. По умолчанию: `false`

---

## Логирование

Система логирует:
- Построение маршрутов (OSRM запросы и ответы)
- Количество nodes в маршрутах
- Проверку по геометрии (расстояния до маршрута)
- Проверку по nodes (процент совпадения)
- Проверку направления
- Финальные результаты фильтрации

---

## Связанные файлы

### Backend
- `apps/backend/src/api/cargo/cargo.service.ts` - Создание/обновление грузов
- `apps/backend/src/api/companion_cargo/companion_cargo.router.ts` - Роутер API
- `apps/backend/src/api/companion_cargo/companion_cargo.controller.ts` - Контроллер
- `apps/backend/src/api/companion_cargo/companion_cargo.service.ts` - Бизнес-логика поиска
- `apps/backend/src/api/companion_cargo/companion_cargo.schema.ts` - Схемы валидации
- `apps/backend/src/api/companion_cargo/companion_cargo.repository.ts` - Работа с БД

### Frontend
- `apps/frontend/src/components/cargo-search/MapCanvas.tsx` - Прорисовка на карте
- `apps/frontend/src/app/company/[company_id]/cargo-search/page.tsx` - Страница поиска

### Database
- `apps/backend/src/db/schema/schema.ts` - Схема БД (поле `route_nodes` в таблице `cargo`)

---

## Восстановление работоспособности

Если система сломалась, проверьте в следующем порядке:

1. **Правильность сбора nodes из legs** - самая частая ошибка
2. **Учет промежуточных точек** при построении маршрута пользователя
3. **Фильтрация по `date_end`** в запросе к БД
4. **Формат координат** при конвертации между GeoJSON и Leaflet
5. **Проверка по геометрии** выполняется перед проверкой по nodes
6. **Проверка по 10% хвостам** выполняется перед основной проверкой по nodes

Все эти моменты подробно описаны в соответствующих разделах выше.
