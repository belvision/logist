'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LineString = { type: 'LineString'; coordinates: [number, number][] };

export type CompanionCargo = {
  id_cargo: number | string;
  match_percent?: number;
  departure_point?: string;
  arrival_point?: string;
  route?: {
    distance: number;
    duration: number;
    geometry: LineString;
  };
  company?: {
    name: string;
    unp: string;
    entity_type: string;
    ur_address: string;
    tel_1: string;
    tel_2?: string;
    email?: string;
  };
};

type Props = {
  mainRoute: { geometry: LineString } | null;
  mainStart: { lat: number; lon: number } | null;
  mainEnd: { lat: number; lon: number } | null;
  companionCargos: CompanionCargo[];
  visibleIds: Set<string> | Set<number | string>;
  focusId: string | number | null;
  height?: number | string;
};

// === стили (из старого проекта)
const MAIN_COLOR = '#2563eb';
const MAIN_WIDTH = 8; // Увеличили до 8px
const HALO_EXTRA = 1;

// Линии грузов: базовая толщина 6px, при наложении второй и последующие 4px
const SIM_WIDTH = 6;
const SIM_WIDTH_OVERLAP = 4; // Толщина для второго и последующих грузов в месте наложения
const SIM_OPACITY = 0.9;
// Убрали SIM_DASH - линии будут прямыми


// Контрастная палитра для грузов (контрастные к синему маршруту)
// Порядок: красный, зелёный, жёлтый, оранжевый, фиолетовый, розовый, бирюзовый, лайм
const CARGO_PALETTE = [
  '#ef4444', // красный - первый груз
  '#22c55e', // зелёный - второй груз
  '#fbbf24', // жёлтый - третий груз
  '#f97316', // оранжевый - четвёртый груз
  '#a855f7', // фиолетовый - пятый груз
  '#ec4899', // розовый - шестой груз
  '#06b6d4', // бирюзовый - седьмой груз
  '#84cc16', // лайм - восьмой груз
  '#dc2626', // тёмно-красный
  '#16a34a', // тёмно-зелёный
  '#eab308', // ярко-жёлтый
  '#ea580c', // тёмно-оранжевый
];

// Функция для получения цвета по порядковому номеру груза
function colorForIndex(index: number): string {
  return CARGO_PALETTE[index % CARGO_PALETTE.length];
}

// Параметры «раздвижки» (из старого проекта)
const OFFSET_STEP_PX = 4;
const OFFSET_LEVELS = 3;

function offsetPxFor(id: string | number) {
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  const total = OFFSET_LEVELS * 2;
  let k = (h % total) - OFFSET_LEVELS;
  if (k >= 0) k += 1; // исключаем 0
  return k * OFFSET_STEP_PX;
}

// Смещение линии на заданное расстояние в метрах перпендикулярно направлению
function offsetLineStringMeters(lineGeom: LineString, offsetMeters: number): LineString {
  if (!lineGeom || lineGeom.type !== 'LineString' || Math.abs(offsetMeters) < 0.1) return lineGeom;
  const coords = lineGeom.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return lineGeom;

  const R = 6371000; // Радиус Земли в метрах
  
  // Функция для вычисления точки на заданном расстоянии и азимуте от исходной точки
  const destinationPoint = (lat: number, lon: number, distance: number, bearing: number): [number, number] => {
    const lat1 = lat * Math.PI / 180;
    const lon1 = lon * Math.PI / 180;
    const brng = bearing * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI];
  };

  // Функция для вычисления азимута между двумя точками
  const bearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360;
  };

  const outCoords: [number, number][] = [];

  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    
    let bearingToUse: number;
    
    if (i === 0) {
      // Для первой точки используем направление к следующей точке
      if (coords.length > 1) {
        const [nextLon, nextLat] = coords[i + 1];
        bearingToUse = bearing(lat, lon, nextLat, nextLon);
      } else {
        outCoords.push([lon, lat]);
        continue;
      }
    } else if (i === coords.length - 1) {
      // Для последней точки используем направление от предыдущей точки
      const [prevLon, prevLat] = coords[i - 1];
      bearingToUse = bearing(prevLat, prevLon, lat, lon);
    } else {
      // Для промежуточных точек используем среднее направление между сегментами
      const [prevLon, prevLat] = coords[i - 1];
      const [nextLon, nextLat] = coords[i + 1];
      const bearing1 = bearing(prevLat, prevLon, lat, lon);
      const bearing2 = bearing(lat, lon, nextLat, nextLon);
      // Средний азимут
      bearingToUse = (bearing1 + bearing2) / 2;
    }
    
    // Перпендикулярное направление (поворачиваем на 90 градусов)
    const perpendicularBearing = (bearingToUse + 90) % 360;
    
    // Смещаем точку
    const [newLon, newLat] = destinationPoint(lat, lon, Math.abs(offsetMeters), perpendicularBearing);
    outCoords.push([newLon, newLat]);
  }

  return { type: 'LineString', coordinates: outCoords };
}

// создать polyline из GeoJSON LineString
function lineLayer(geom: LineString, opts: L.PolylineOptions) {
  const latlngs = geom.coordinates.map(([lon, lat]) => [lat, lon]) as [number, number][];
  return L.polyline(latlngs, opts);
}

// Вычисление расстояния между двумя точками в метрах (формула Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Найти минимальное расстояние от точки до линии (сегмента)
function pointToLineDistance(
  pointLat: number, 
  pointLon: number, 
  lineStartLat: number, 
  lineStartLon: number, 
  lineEndLat: number, 
  lineEndLon: number
): number {
  // Проекция точки на сегмент
  const A = pointLat - lineStartLat;
  const B = pointLon - lineStartLon;
  const C = lineEndLat - lineStartLat;
  const D = lineEndLon - lineStartLon;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStartLat;
    yy = lineStartLon;
  } else if (param > 1) {
    xx = lineEndLat;
    yy = lineEndLon;
  } else {
    xx = lineStartLat + param * C;
    yy = lineStartLon + param * D;
  }

  return haversineDistance(pointLat, pointLon, xx, yy);
}

export function MapCanvas({
  mainRoute,
  mainStart,
  mainEnd,
  companionCargos,
  visibleIds,
  focusId,
  height = 520,
}: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const layersRef = useRef<{
    base?: L.LayerGroup;
    main?: { 
      halo?: L.Polyline; 
      line?: L.Polyline; 
      start?: L.CircleMarker; 
      end?: L.CircleMarker 
    };
    similars: Map<string, L.LayerGroup>; // LayerGroup для хранения всех сегментов груза
    similarMarkers: Map<string, { start?: L.CircleMarker; end?: L.CircleMarker }>;
    baseGeom: Map<string, LineString>;
    styles: Map<string, { color: string; weight: number; dashArray?: string; opacity?: number }>;
  }>({
    similars: new Map(),
    similarMarkers: new Map(),
    baseGeom: new Map(),
    styles: new Map(),
  });

  // init map
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;
    const map = L.map(mapEl.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: false,
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    });
    const base = L.layerGroup().addTo(map);
    tiles.addTo(base);

    map.setView([53.9, 27.56], 6); // Минск по умолчанию

    // Убрали обработчики перерисовки - линии грузов теперь прямые без смещения

    mapRef.current = map;
    layersRef.current.base = base;

    // Ждём готовности карты и пересчитываем размеры
    map.whenReady(() => {
      requestAnimationFrame(() => {
        try {
          map.invalidateSize();
          setMapReady(true);
        } catch {}
      });
    });

    return () => {
      // Обработчики больше не нужны
    };
  }, []);

  // пересчитываем размеры при изменении контейнера
  useEffect(() => {
    const map = mapRef.current;
    const node = mapEl.current;
    if (!map || !node || !mapReady) return;

    const invalidate = () => {
      requestAnimationFrame(() => {
        try {
          map.invalidateSize();
        } catch {}
      });
    };

    const resizeObserver = new ResizeObserver(() => invalidate());
    resizeObserver.observe(node);
    window.addEventListener('resize', invalidate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [mapReady]);

  // основной маршрут
  useEffect(() => {
    try {
      
      const map = mapRef.current;
      if (!map) {
        return;
      }

      // Пересчитываем размеры и отрисовываем маршрут в следующем кадре
      requestAnimationFrame(() => {
        try {
          map.invalidateSize();
        } catch {}

        // очистка старого
        if (layersRef.current.main?.halo) map.removeLayer(layersRef.current.main.halo);
        if (layersRef.current.main?.line) map.removeLayer(layersRef.current.main.line);
        if (layersRef.current.main?.start) map.removeLayer(layersRef.current.main.start);
        if (layersRef.current.main?.end) map.removeLayer(layersRef.current.main.end);
        layersRef.current.main = {};

        if (!mainRoute?.geometry?.coordinates?.length) {
          return;
        }

        const baseGeom = mainRoute.geometry;
        const halo = lineLayer(baseGeom, { color: '#ffffff', weight: MAIN_WIDTH + HALO_EXTRA * 2, opacity: 0.9 });
        const line = lineLayer(baseGeom, { color: MAIN_COLOR, weight: MAIN_WIDTH, opacity: 1 });

        // Добавляем основной маршрут (после карты, но перед грузами)
        halo.addTo(map);
        line.addTo(map);

        let startMarker: L.CircleMarker | undefined;
        let endMarker: L.CircleMarker | undefined;
        if (mainStart) {
          startMarker = L.circleMarker([mainStart.lat, mainStart.lon], { radius: 6, color: '#059669', weight: 2, fillColor: '#10b981', fillOpacity: 0.9 }).addTo(map);
        }
        if (mainEnd) {
          endMarker = L.circleMarker([mainEnd.lat, mainEnd.lon], { radius: 6, color: '#dc2626', weight: 2, fillColor: '#ef4444', fillOpacity: 0.9 }).addTo(map);
        }

        layersRef.current.main = {
          halo,
          line,
          ...(startMarker ? { start: startMarker } : {}),
          ...(endMarker ? { end: endMarker } : {})
        };

        // После добавления основного маршрута поднимаем все грузы на передний план
        // Это гарантирует, что грузы всегда будут поверх маршрута
        setTimeout(() => {
          layersRef.current.similars.forEach((cargoLayerGroup) => {
            if (cargoLayerGroup && map.hasLayer(cargoLayerGroup)) {
              // Поднимаем все сегменты на верхний слой
              cargoLayerGroup.eachLayer((layer) => {
                if (layer instanceof L.GeoJSON) {
                  layer.bringToFront();
                }
              });
            }
          });
        }, 0);

        // fit
        const b = line.getBounds();
        if (b && b.isValid()) {
          map.fitBounds(b, { padding: [30, 30] });
        }

      });
    } catch (error) {
      console.error('MapCanvas: Error rendering main route:', error);
    }
  }, [mainRoute?.geometry, mainStart?.lat, mainEnd?.lat]);

  // похожие маршруты (из старого проекта)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let frameId: number;
    // Используем requestAnimationFrame для неблокирующей отрисовки
    frameId = requestAnimationFrame(() => {
      const visSet = new Set(
        Array.isArray(visibleIds) ? visibleIds.map(String) : [...(visibleIds || [])].map(String)
      );

      // Сначала собираем все геометрии грузов для определения совпадений
      const cargoGeometries = new Map<string, LineString>();
      for (const sim of companionCargos) {
        const id = String(sim.id_cargo);
        const baseGeom = sim?.route?.geometry?.type === "LineString" ? sim.route.geometry : null;
        if (baseGeom) {
          cargoGeometries.set(id, baseGeom);
        }
      }

    // Функция для определения, проходит ли точка близко к маршруту другого груза
    // Оптимизирована: проверяет не все сегменты, а только каждую N-ю точку для ускорения
    const isPointNearCargoRoute = (point: [number, number], cargoGeom: LineString, toleranceMeters: number = 50): boolean => {
      const cargoCoords = cargoGeom.coordinates;
      const [pointLon, pointLat] = point;

      // Быстрая проверка: сначала проверяем расстояние до ближайших точек маршрута
      // Если даже ближайшая точка далеко, не проверяем сегменты
      let minPointDist = Infinity;
      const CHECK_STEP = Math.max(1, Math.floor(cargoCoords.length / 50)); // Проверяем максимум 50 точек

      for (let i = 0; i < cargoCoords.length; i += CHECK_STEP) {
        const [lon, lat] = cargoCoords[i];
        const dist = haversineDistance(pointLat, pointLon, lat, lon);
        if (dist < minPointDist) {
          minPointDist = dist;
        }
        // Если даже ближайшая точка близко, проверяем сегменты
        if (minPointDist <= toleranceMeters * 1.5) {
          // Проверяем сегменты вокруг этой точки
          const startIdx = Math.max(0, i - CHECK_STEP);
          const endIdx = Math.min(cargoCoords.length - 1, i + CHECK_STEP);
          for (let j = startIdx; j < endIdx; j++) {
            if (j >= cargoCoords.length - 1) break;
            const [lon1, lat1] = cargoCoords[j];
            const [lon2, lat2] = cargoCoords[j + 1];
            const dist = pointToLineDistance(pointLat, pointLon, lat1, lon1, lat2, lon2);
            if (dist <= toleranceMeters) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Функция для определения, накладывается ли текущий груз на другие грузы в данной точке
    // Возвращает true, если есть другие грузы, которые проходят близко к этой точке
    const hasOverlapWithOtherCargos = (point: [number, number], currentCargoId: string, toleranceMeters: number = 50): boolean => {
      for (const [cargoId, cargoGeom] of cargoGeometries) {
        if (cargoId === currentCargoId) continue; // Пропускаем текущий груз
        if (isPointNearCargoRoute(point, cargoGeom, toleranceMeters)) {
          return true;
        }
      }
      return false;
    };

    // Сортируем грузы по ID для определения порядка (первый, второй и т.д.)
    const sortedCargoIds = Array.from(cargoGeometries.keys()).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      if (numA !== 0 || numB !== 0) return numA - numB;
      return a.localeCompare(b);
    });

    for (const sim of companionCargos) {
      const id = String(sim.id_cargo);
      const has = layersRef.current.similars.get(id);
      const baseGeom = sim?.route?.geometry?.type === "LineString" ? sim.route.geometry : null;

      if (!baseGeom) {
        if (has) { try { map.removeLayer(has); } catch {} layersRef.current.similars.delete(id); }
        layersRef.current.baseGeom.delete(id);
        layersRef.current.styles.delete(id);
        // Удаляем маркеры
        const oldMarkers = layersRef.current.similarMarkers.get(id);
        if (oldMarkers) {
          if (oldMarkers.start) map.removeLayer(oldMarkers.start);
          if (oldMarkers.end) map.removeLayer(oldMarkers.end);
          layersRef.current.similarMarkers.delete(id);
        }
        continue;
      }

      layersRef.current.baseGeom.set(id, baseGeom);
      const feat = { type: "Feature" as const, geometry: baseGeom as any };

      // Получаем порядковый номер груза для выбора контрастного цвета
      const cargoIndex = sortedCargoIds.indexOf(id);
      const color = colorForIndex(cargoIndex);

      // Сохраняем стиль с правильным цветом
      layersRef.current.styles.set(id, { 
        color: color,
        weight: SIM_WIDTH, 
        opacity: SIM_OPACITY
      });

      // Получаем координаты начальной и конечной точки из геометрии
      const coords = baseGeom.coordinates;
      const startCoord = coords[0]; // [lon, lat]
      const endCoord = coords[coords.length - 1]; // [lon, lat]

      // Удаляем старые маркеры, если они есть
      const oldMarkers = layersRef.current.similarMarkers.get(id);
      if (oldMarkers) {
        if (oldMarkers.start) map.removeLayer(oldMarkers.start);
        if (oldMarkers.end) map.removeLayer(oldMarkers.end);
      }

      if (!has) {
        // Определяем порядок текущего груза (первый, второй и т.д.)
        const currentIndex = sortedCargoIds.indexOf(id);
        const isFirstCargo = currentIndex === 0;
        
        // Упрощенная проверка: для ускорения проверяем только каждую N-ю точку
        // и используем её значение для всего сегмента до следующей проверенной точки
        const coords = baseGeom.coordinates;
        const CHECK_STEP = Math.max(1, Math.floor(coords.length / 50)); // Проверяем максимум 50 точек для ускорения
        const overlapFlags: boolean[] = [];

        // Проверяем ключевые точки с шагом
        for (let i = 0; i < coords.length; i++) {
          if (i % CHECK_STEP === 0 || i === coords.length - 1) {
            const point = coords[i] as [number, number];
            overlapFlags[i] = hasOverlapWithOtherCargos(point, id, 50);
          } else {
            // Для промежуточных точек используем значение предыдущей проверенной точки
            const prevChecked = Math.floor(i / CHECK_STEP) * CHECK_STEP;
            overlapFlags[i] = overlapFlags[prevChecked] ?? false;
          }
        }

        // Разбиваем маршрут на сегменты: накладывающиеся и не накладывающиеся
        const segments: Array<{ coords: [number, number][], isOverlap: boolean }> = [];
        let currentOverlap = overlapFlags[0];
        let segmentStart = 0;

        for (let i = 1; i < overlapFlags.length; i++) {
          if (overlapFlags[i] !== currentOverlap) {
            segments.push({
              coords: coords.slice(segmentStart, i + 1) as [number, number][],
              isOverlap: currentOverlap
            });
            segmentStart = i;
            currentOverlap = overlapFlags[i];
          }
        }
        if (segmentStart < coords.length) {
          segments.push({
            coords: coords.slice(segmentStart) as [number, number][],
            isOverlap: currentOverlap
          });
        }

        // Создаем LayerGroup для хранения всех сегментов
        const layerGroup = L.layerGroup();
        
        // Создаем слои для каждого сегмента с соответствующей толщиной
        for (const seg of segments) {
          if (seg.coords.length < 2) continue;
          
          const segGeom: LineString = { type: 'LineString', coordinates: seg.coords };
          const segFeat = { type: "Feature" as const, geometry: segGeom as any };
          
          // Определяем толщину: если наложение и не первый груз - 4px, иначе 6px
          const weight = (seg.isOverlap && !isFirstCargo) ? SIM_WIDTH_OVERLAP : SIM_WIDTH;
          
          const segLayer = L.geoJSON(segFeat, {
            style: {
              weight,
              opacity: SIM_OPACITY,
              color,
              lineCap: "round",
              lineJoin: "round",
            },
          });
          
          layerGroup.addLayer(segLayer);
        }

        layerGroup.addTo(map);
        
        // Поднимаем все сегменты на верхний слой
        layerGroup.eachLayer((layer) => {
          if (layer instanceof L.GeoJSON) {
            layer.bringToFront();
          }
        });

        const title = (sim?.departure_point && sim?.arrival_point)
          ? `Маршрут ${sim.departure_point} → ${sim.arrival_point}`
          : `Маршрут #${id}`;
        // Привязываем tooltip к первому слою в группе
        const firstLayer = layerGroup.getLayers()[0] as L.GeoJSON;
        if (firstLayer) {
          firstLayer.bindTooltip(`${title}\nСходство: ${sim?.match_percent ?? "?"}%`, { sticky: true, opacity: 0.9 });
        }

        layersRef.current.similars.set(id, layerGroup);
        
        // Создаем маркеры начальной и конечной точки
        const startMarker = L.circleMarker([startCoord[1], startCoord[0]], {
          radius: 5, // Немного меньше, чем у основного маршрута (6px)
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });
        startMarker.bindTooltip(`Начало: ${sim?.departure_point || 'Груз #' + id}`, { direction: 'top' });

        const endMarker = L.circleMarker([endCoord[1], endCoord[0]], {
          radius: 5,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });
        endMarker.bindTooltip(`Конец: ${sim?.arrival_point || 'Груз #' + id}`, { direction: 'top' });

        // Добавляем маркеры на карту
        startMarker.addTo(map);
        endMarker.addTo(map);
        
        layersRef.current.similarMarkers.set(id, { 
          start: startMarker, 
          end: endMarker
        });
      } else {
        // Удаляем старую группу слоев
        const oldLayerGroup = layersRef.current.similars.get(id);
        if (oldLayerGroup) {
          try { map.removeLayer(oldLayerGroup); } catch {}
        }

        // Определяем порядок текущего груза и получаем цвет
        const currentIndex = sortedCargoIds.indexOf(id);
        const isFirstCargo = currentIndex === 0;
        const color = colorForIndex(currentIndex);

        // Упрощенная проверка: для ускорения проверяем только каждую N-ю точку
        // и используем её значение для всего сегмента до следующей проверенной точки
        const coords = baseGeom.coordinates;
        const CHECK_STEP = Math.max(1, Math.floor(coords.length / 50)); // Проверяем максимум 50 точек для ускорения
        const overlapFlags: boolean[] = [];

        // Проверяем ключевые точки с шагом
        for (let i = 0; i < coords.length; i++) {
          if (i % CHECK_STEP === 0 || i === coords.length - 1) {
            const point = coords[i] as [number, number];
            overlapFlags[i] = hasOverlapWithOtherCargos(point, id, 50);
          } else {
            // Для промежуточных точек используем значение предыдущей проверенной точки
            const prevChecked = Math.floor(i / CHECK_STEP) * CHECK_STEP;
            overlapFlags[i] = overlapFlags[prevChecked] ?? false;
          }
        }

        // Разбиваем маршрут на сегменты
        const segments: Array<{ coords: [number, number][], isOverlap: boolean }> = [];
        let currentOverlap = overlapFlags[0];
        let segmentStart = 0;

        for (let i = 1; i < overlapFlags.length; i++) {
          if (overlapFlags[i] !== currentOverlap) {
            segments.push({
              coords: coords.slice(segmentStart, i + 1) as [number, number][],
              isOverlap: currentOverlap
            });
            segmentStart = i;
            currentOverlap = overlapFlags[i];
          }
        }
        if (segmentStart < coords.length) {
          segments.push({
            coords: coords.slice(segmentStart) as [number, number][],
            isOverlap: currentOverlap
          });
        }

        // Создаем LayerGroup для хранения всех сегментов
        const layerGroup = L.layerGroup();
        
        // Создаем слои для каждого сегмента с соответствующей толщиной
        for (const seg of segments) {
          if (seg.coords.length < 2) continue;
          
          const segGeom: LineString = { type: 'LineString', coordinates: seg.coords };
          const segFeat = { type: "Feature" as const, geometry: segGeom as any };
          
          // Определяем толщину: если наложение и не первый груз - 4px, иначе 6px
          const weight = (seg.isOverlap && !isFirstCargo) ? SIM_WIDTH_OVERLAP : SIM_WIDTH;
          
          const segLayer = L.geoJSON(segFeat, {
            style: {
              weight,
              opacity: SIM_OPACITY,
              color,
              lineCap: "round",
              lineJoin: "round",
            },
          });
          
          layerGroup.addLayer(segLayer);
        }

        layerGroup.addTo(map);
        
        // Поднимаем все сегменты на верхний слой
        layerGroup.eachLayer((layer) => {
          if (layer instanceof L.GeoJSON) {
            layer.bringToFront();
          }
        });
        
        // Привязываем tooltip к первому слою в группе
        const firstLayer = layerGroup.getLayers()[0] as L.GeoJSON;
        if (firstLayer) {
          const title = (sim?.departure_point && sim?.arrival_point)
            ? `Маршрут ${sim.departure_point} → ${sim.arrival_point}`
            : `Маршрут #${id}`;
          firstLayer.bindTooltip(`${title}\nСходство: ${sim?.match_percent ?? "?"}%`, { sticky: true, opacity: 0.9 });
        }

        layersRef.current.similars.set(id, layerGroup);

        // Обновляем маркеры
        const existingMarkers = layersRef.current.similarMarkers.get(id);
        if (existingMarkers) {
          // Обновляем маркер начала
          if (existingMarkers.start) {
            existingMarkers.start.setLatLng([startCoord[1], startCoord[0]]);
            existingMarkers.start.setStyle({ fillColor: color });
          } else {
            const startMarker = L.circleMarker([startCoord[1], startCoord[0]], {
              radius: 5,
              fillColor: color,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9,
            });
            startMarker.bindTooltip(`Начало: ${sim?.departure_point || 'Груз #' + id}`, { direction: 'top' });
            startMarker.addTo(map);
            existingMarkers.start = startMarker;
          }

          // Обновляем маркер конца
          if (existingMarkers.end) {
            existingMarkers.end.setLatLng([endCoord[1], endCoord[0]]);
            existingMarkers.end.setStyle({ fillColor: color });
          } else {
            const endMarker = L.circleMarker([endCoord[1], endCoord[0]], {
              radius: 5,
              fillColor: color,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9,
            });
            endMarker.bindTooltip(`Конец: ${sim?.arrival_point || 'Груз #' + id}`, { direction: 'top' });
            endMarker.addTo(map);
            existingMarkers.end = endMarker;
          }

        } else {
          // Создаем новые маркеры
          const startMarker = L.circleMarker([startCoord[1], startCoord[0]], {
            radius: 5,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          });
          startMarker.bindTooltip(`Начало: ${sim?.departure_point || 'Груз #' + id}`, { direction: 'top' });
          startMarker.addTo(map);

          const endMarker = L.circleMarker([endCoord[1], endCoord[0]], {
            radius: 5,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          });
          endMarker.bindTooltip(`Конец: ${sim?.arrival_point || 'Груз #' + id}`, { direction: 'top' });
          endMarker.addTo(map);

          layersRef.current.similarMarkers.set(id, { 
            start: startMarker, 
            end: endMarker
          });
        }
      }

      const layerGroup = layersRef.current.similars.get(id);
      const markers = layersRef.current.similarMarkers.get(id);
      if (layerGroup && markers) {
        const shouldShow = visSet.size === 0 || visSet.has(id);
        
        // Показываем/скрываем группу слоев
        const onMap = map.hasLayer(layerGroup);
        if (shouldShow && !onMap) {
          layerGroup.addTo(map);
          // Поднимаем все сегменты на верхний слой
          layerGroup.eachLayer((layer) => {
            if (layer instanceof L.GeoJSON) {
              layer.bringToFront();
            }
          });
          if (markers.start) markers.start.addTo(map);
          if (markers.end) markers.end.addTo(map);
        }
        if (!shouldShow && onMap) {
          map.removeLayer(layerGroup);
          if (markers.start) map.removeLayer(markers.start);
          if (markers.end) map.removeLayer(markers.end);
        }
      }
    }

      // чистка
      for (const [id, layerGroup] of layersRef.current.similars) {
        const exists = companionCargos.some(s => String(s.id_cargo) === id);
        if (!exists) {
          try { if (layerGroup) map.removeLayer(layerGroup); } catch {}
          const markers = layersRef.current.similarMarkers.get(id);
          if (markers) {
            if (markers.start) try { map.removeLayer(markers.start); } catch {}
            if (markers.end) try { map.removeLayer(markers.end); } catch {}
          }
          layersRef.current.similars.delete(id);
          layersRef.current.similarMarkers.delete(id);
          layersRef.current.baseGeom.delete(id);
          layersRef.current.styles.delete(id);
        }
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [companionCargos, visibleIds, mapReady]);

  // фокус (из старого проекта)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId || !mapReady) return;
    const layerGroup = layersRef.current.similars.get(String(focusId));
    if (layerGroup) {
      // Получаем границы из первого слоя в группе
      const firstLayer = layerGroup.getLayers()[0] as L.GeoJSON;
      if (firstLayer) {
        const b = firstLayer.getBounds?.();
        if (b?.isValid()) {
          // Поднимаем все сегменты на верхний слой
          layerGroup.eachLayer((layer) => {
            if (layer instanceof L.GeoJSON) {
              layer.bringToFront();
            }
          });
          map.fitBounds(b, { padding: [30, 30] });
        }
      }
    }
  }, [focusId, mapReady]);

  const styleHeight = typeof height === 'number' ? `${height}px` : height;

  return <div ref={mapEl} style={{ width: '100%', height: styleHeight || 520, borderRadius: 12, overflow: 'hidden', zIndex: 1 }} />;
}

export default MapCanvas;
