'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Car {
  id_cars: number;
  closest_place?: {
    lat: number;
    lon: number;
    place_id: number;
    name: string;
  } | undefined;
  [key: string]: unknown;
}

interface SearchPoint {
  id: string;
  location: string;
  lat: number;
  lon: number;
  radius: number; // в км
  cars: Car[];
}

interface CarSearchMapProps {
  searchPoints: SearchPoint[];
  selectedPointId: string | null;
  onPointClick: (pointId: string) => void;
  onCarClick?: (carId: number) => void;
  focusedCarId?: number | null;
}

export function CarSearchMap({
  searchPoints,
  selectedPointId,
  onPointClick,
  onCarClick,
  focusedCarId,
}: CarSearchMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markers: Map<string, L.Marker>;
    circles: Map<string, L.Circle>;
    carMarkers: Map<string, L.Marker>;
  }>({
    markers: new Map(),
    circles: new Map(),
    carMarkers: new Map(),
  });

  // Инициализация карты один раз
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;

    const map = L.map(mapEl.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    // Порядок pane'ов, чтобы круги не перекрывали маркеры/тултипы
    // (Leaflet дефолт: tiles(200) < overlay(400) < marker(600) < tooltip(650) < popup(700))
    const circlesPane = map.createPane('circlesPane');
    circlesPane.style.zIndex = '350';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    // Минск по умолчанию
    map.setView([53.9, 27.56], 6);
    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Перерисовка слоёв при изменениях
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Очистка старых слоёв
    layersRef.current.markers.forEach((m) => map.removeLayer(m));
    layersRef.current.circles.forEach((c) => map.removeLayer(c));
    layersRef.current.carMarkers.forEach((m) => map.removeLayer(m));
    layersRef.current.markers.clear();
    layersRef.current.circles.clear();
    layersRef.current.carMarkers.clear();

    // Добавляем точки
    searchPoints.forEach((point, index) => {
      const { lat, lon, radius } = point;

      // Корректная проверка координат (не выбрасываем 0)
      if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
        console.warn('Invalid coordinates for point:', point);
        return;
      }

      const isSelected = selectedPointId === point.id;

      // Маркер точки поиска
      const searchMarker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: `custom-marker ${isSelected ? 'selected' : ''}`,
          html: `
            <div class="marker-content">
              <div class="marker-number">${index + 1}</div>
              <div class="marker-cars">${point.cars.length}</div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(map);

      searchMarker.on('click', () => onPointClick(point.id));
      layersRef.current.markers.set(point.id, searchMarker);

      // Круг радиуса — на отдельном pane, чтобы был под маркерами
      if (radius > 0) {
        const circle = L.circle([lat, lon], {
          pane: 'circlesPane',
          color: isSelected ? '#3b82f6' : '#6b7280',
          fillColor: isSelected ? '#3b82f6' : '#6b7280',
          fillOpacity: 0.1,
          radius: radius * 1000, // км → м
        }).addTo(map);
        layersRef.current.circles.set(point.id, circle);
      }

      // Групповой маркер автомобилей (в центре точки поиска)
      if (point.cars.length > 0) {
        const carLat = lat;
        const carLon = lon;
        const isFocused = point.cars.some((car) => focusedCarId === car.id_cars);

        const groupMarker = L.marker([carLat, carLon], {
          icon: L.divIcon({
            className: `car-group-marker ${isFocused ? 'focused' : ''}`,
            html: `
              <div class="car-group-content">
                <div class="car-icon">🚛</div>
                <div class="car-count">${point.cars.length}</div>
                ${isFocused ? '<div class="focus-ring"></div>' : ''}
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        }).addTo(map);

        // ВАЖНО: не трогаем transform корневого элемента — иначе слетит translate3d Leaflet
        groupMarker
          .on('mouseover', function (this: L.Marker) {
            groupMarker.setZIndexOffset(1000); // поднять над остальными
            const el = this.getElement();
            if (el) el.classList.add('hovered');
          })
          .on('mouseout', function (this: L.Marker) {
            groupMarker.setZIndexOffset(0);
            const el = this.getElement();
            if (el) el.classList.remove('hovered');
          })
          .on('click', function () {
            if (onCarClick && point.cars.length > 0) onCarClick(point.cars[0]?.id_cars || 0);
          });

        // Тултип
        const carsInfo = point.cars
          .map(
            (car: Car) => `
            <div class="car-summary ${focusedCarId === car.id_cars ? 'highlighted' : ''}">
              <div class="car-title">${car['title'] || `Автомобиль #${car.id_cars}`}</div>
              <div class="car-specs">
                ${car['tonn_min']}-${car['tonn_max']} т • ${car['m3_min']}-${car['m3_max']} м³
                ${car['car_type'] ? ` • ${car['car_type']}` : ''}
              </div>
            </div>
          `,
          )
          .join('');

        groupMarker.bindTooltip(
          `
          <div class="group-tooltip">
            <div class="group-tooltip-header">
              <div class="group-title">Найдено автомобилей: ${point.cars.length}</div>
              <div class="location-info">📍 ${point.location}</div>
            </div>
            <div class="cars-list">
              ${carsInfo}
            </div>
            <div class="tooltip-footer">
              Кликните для просмотра деталей
            </div>
          </div>
        `,
          {
            direction: 'top',
            offset: [0, -20],
            className: 'group-tooltip-custom',
            permanent: false,
            interactive: true,
          } as L.TooltipOptions,
        );

        layersRef.current.carMarkers.set(`${point.id}-group`, groupMarker);
      }
    });

    // Подгоняем карту под точки
    if (searchPoints.length > 0) {
      const valid = searchPoints.filter(
        (p) =>
          p.lat != null &&
          p.lon != null &&
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lon) &&
          p.radius > 0,
      );

      if (valid.length > 0) {
        try {
          if (valid.length === 1) {
            const p = valid[0];
            if (p) {
              const zoom = p.radius > 100 ? 8 : p.radius > 50 ? 9 : 10;
              map.setView([p.lat, p.lon], zoom);
            }
          } else {
            const bounds = L.latLngBounds([]);
            valid.forEach((p) => {
              if (p) {
                const deg = p.radius / 111; // ~ км → градусы (упрощённо)
                bounds.extend([p.lat - deg, p.lon - deg]);
                bounds.extend([p.lat + deg, p.lon + deg]);
              }
            });
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
          }
        } catch (e) {
          console.warn('Error fitting map bounds:', e);
          const p = valid[0];
          if (p) map.setView([p.lat, p.lon], 10);
        }
      }
    }
  }, [searchPoints, selectedPointId, onPointClick, onCarClick, focusedCarId]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapEl}
        className="h-full w-full"
        style={{
          minHeight: '400px',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1,
        }}
      />
      <style jsx global>{`
        /* Маркер точки поиска */
        .custom-marker {
          background: white;
          border: 2px solid #6b7280;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .custom-marker.selected {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
        .marker-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 10px;
          font-weight: bold;
          user-select: none;
          pointer-events: none;
        }
        .marker-number {
          line-height: 1;
        }
        .marker-cars {
          font-size: 8px;
          opacity: 0.8;
        }

        /* Групповой маркер автомобилей — важное: НЕ масштабируем корень */
        .car-group-marker {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          position: relative;
          z-index: 100 !important;
          user-select: none;
        }
        .car-group-marker .car-group-content {
          transition: transform 0.2s ease;
          transform: scale(1);
          will-change: transform;
        }
        .car-group-marker.hovered .car-group-content {
          transform: scale(1.15);
        }
        .car-group-marker:hover {
          z-index: 1001 !important;
        }
        .car-group-marker.focused {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3);
          animation: pulse 2s infinite;
          z-index: 1002 !important;
        }
        .focus-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #f59e0b;
          border-radius: 50%;
          animation: ripple 1.5s infinite;
          pointer-events: none;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.15);
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .car-icon {
          font-size: 16px;
          margin-bottom: 2px;
        }
        .car-count {
          font-size: 12px;
          font-weight: bold;
          color: white;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* Тултип */
        .group-tooltip {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 350px;
          background: white;
          border: none;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        .group-tooltip-header {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 12px 16px;
        }
        .group-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .location-info {
          font-size: 12px;
          opacity: 0.9;
        }
        .cars-list {
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        .car-summary {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }
        .car-summary:last-child {
          border-bottom: none;
        }
        .car-summary.highlighted {
          background: #eff6ff;
          border-radius: 6px;
          padding: 8px;
          margin: 0 -4px;
        }
        .car-summary .car-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .car-summary .car-specs {
          font-size: 12px;
          color: #6b7280;
        }
        .tooltip-footer {
          background: #f9fafb;
          padding: 8px 12px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }

        .group-tooltip-custom {
          background: white !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          padding: 0 !important;
        }
        .leaflet-tooltip {
          pointer-events: auto !important;
        }
        .leaflet-tooltip-pane {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
