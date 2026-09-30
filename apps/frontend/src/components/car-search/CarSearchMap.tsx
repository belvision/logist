'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/maps.css';

// Fix for Leaflet default icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

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

const PRIMARY_COLOR = 'hsl(var(--primary))';
const MUTED_COLOR = 'hsl(var(--muted-foreground))';

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
    if (mapRef.current || !mapEl.current || typeof window === 'undefined') return;
    
    // Ensure Leaflet is available
    if (!L || !L.map) {
      console.error('Leaflet is not available');
      return;
    }

    try {
      const map = L.map(mapEl.current, {
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
      });

      // Порядок pane'ов, чтобы круги не перекрывали маркеры/тултипы
      // (Leaflet дефолт: tiles(200) < overlay(400) < marker(600) < tooltip(650) < popup(700))
      const circlesPane = map.createPane('circlesPane');
      if (circlesPane) {
        circlesPane.style.zIndex = '350';
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map);

      // Минск по умолчанию
      map.setView([53.9, 27.56], 6);
      mapRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Перерисовка слоёв при изменениях
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof window === 'undefined') return;
    
    // Ensure Leaflet is available
    if (!L || !L.marker || !L.circle || !L.latLngBounds) {
      console.error('Leaflet methods are not available');
      return;
    }

    // Очистка старых слоёв

    layersRef.current.markers.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    layersRef.current.circles.forEach((c) => {
      try {
        map.removeLayer(c);
      } catch (e) {
        console.warn('Error removing circle:', e);
      }
    });
    layersRef.current.carMarkers.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch (e) {
        console.warn('Error removing car marker:', e);
      }
    });

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
      try {
        const searchMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: `lg-map-marker ${isSelected ? 'lg-map-marker--active' : ''}`,
            html: `
              <div class="lg-map-marker__content">
                <div class="lg-map-marker__number">${index + 1}</div>
                <div class="lg-map-marker__cars">${point.cars.length}</div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map);

        searchMarker.on('click', () => {
          if (onPointClick) {
            onPointClick(point.id);
          }
        });
        layersRef.current.markers.set(point.id, searchMarker);
      } catch (error) {
        console.error('Error creating search marker:', error);
      }

      // Круг радиуса — на отдельном pane, чтобы был под маркерами
      if (radius > 0) {
        try {
          const circle = L.circle([lat, lon], {
            pane: 'circlesPane',
            color: isSelected ? PRIMARY_COLOR : MUTED_COLOR,
            fillColor: isSelected ? PRIMARY_COLOR : MUTED_COLOR,
            fillOpacity: 0.1,
            radius: radius * 1000, // км → м
          }).addTo(map);
          layersRef.current.circles.set(point.id, circle);
        } catch (error) {
          console.error('Error creating circle:', error);
        }
      }

      // Индивидуальные маркеры для каждого автомобиля
      point.cars.forEach((car: Car) => {
        if (!car.closest_place || !car.closest_place.lat || !car.closest_place.lon) {
          return; // Пропускаем автомобили без координат
        }

        try {
          const carLat = car.closest_place.lat;
          const carLon = car.closest_place.lon;
          const isFocused = focusedCarId === car.id_cars;

          // Создаем индивидуальный маркер для автомобиля
          const carMarker = L.marker([carLat, carLon], {
            icon: L.divIcon({
              className: `car-individual-marker ${isFocused ? 'focused' : ''}`,
              html: `
                <div class="car-marker-content">
                  <div class="car-marker-icon">🚛</div>
                  ${isFocused ? '<div class="car-focus-ring"></div>' : ''}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
          }).addTo(map);

          // Обработчики событий для маркера
          carMarker
            .on('mouseover', function (this: L.Marker) {
              carMarker.setZIndexOffset(1000);
              const el = this.getElement();
              if (el) el.classList.add('hovered');
            })
            .on('mouseout', function (this: L.Marker) {
              carMarker.setZIndexOffset(0);
              const el = this.getElement();
              if (el) el.classList.remove('hovered');
            })
            .on('click', function () {
              if (onCarClick) onCarClick(car.id_cars);
            });

          // Тултип с информацией об автомобиле
          const carTitle = car['title'] || `Автомобиль #${car.id_cars}`;
          const carSpecs = `${car['tonn_min'] || 0}-${car['tonn_max'] || 0} т • ${car['m3_min'] || 0}-${car['m3_max'] || 0} м³`;
          const carType = car['car_type'] ? ` • ${car['car_type']}` : '';
          const carPrice = car['price'] ? `<div class="car-price">💰 ${car['price']} руб.</div>` : '';
          const carCompany = car['company_name'] ? `<div class="car-company">🏢 ${car['company_name']}</div>` : '';
          const carDistance = car['distance_km'] ? `<div class="car-distance">📍 ${car['distance_km']} км</div>` : '';

          carMarker.bindTooltip(
            `
            <div class="car-tooltip">
              <div class="car-tooltip-title">${carTitle}</div>
              <div class="car-tooltip-specs">${carSpecs}${carType}</div>
              ${carPrice}
              ${carCompany}
              ${carDistance}
              ${car.closest_place.name ? `<div class="car-location">📍 ${car.closest_place.name}</div>` : ''}
            </div>
          `,
            {
              direction: 'top',
              offset: [0, -10],
              className: 'car-tooltip-custom',
              permanent: false,
              interactive: true,
            } as L.TooltipOptions,
          );

          layersRef.current.carMarkers.set(`${point.id}-car-${car.id_cars}`, carMarker);
        } catch (error) {
          console.error(`Error creating marker for car ${car.id_cars}:`, error);
        }
      });

      // Групповой маркер автомобилей (в центре точки поиска) - только если много машин
      if (point.cars.length > 5) {
        try {
          const carLat = lat;
          const carLon = lon;
          const isFocused = point.cars.some((car) => focusedCarId === car.id_cars);

          const groupMarker = L.marker([carLat, carLon], {
            icon: L.divIcon({
              className: `lg-map-cluster ${isFocused ? 'lg-map-cluster--focused' : ''}`,
              html: `
                <div class="lg-map-cluster__content">
                  <div class="lg-map-cluster__icon">🚛</div>
                  <div class="lg-map-cluster__count">${point.cars.length}</div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            }),
          }).addTo(map);

          groupMarker
            .on('mouseover', function (this: L.Marker) {
              groupMarker.setZIndexOffset(1000);
              const el = this.getElement();
              if (el) el.classList.add('lg-map-cluster--hovered');
            })
            .on('mouseout', function (this: L.Marker) {
              groupMarker.setZIndexOffset(0);
              const el = this.getElement();
              if (el) el.classList.remove('lg-map-cluster--hovered');
            })
            .on('click', function () {
              if (onCarClick && point.cars.length > 0) onCarClick(point.cars[0]?.id_cars || 0);
            });

          // Тултип для группового маркера
          const carsInfo = point.cars
            .slice(0, 5) // Показываем только первые 5
            .map(
              (car: Car) => `
            <div class="lg-map-tooltip__item ${focusedCarId === car.id_cars ? 'highlighted' : ''}">
              <div class="lg-map-tooltip__item-title">${car['title'] || `Автомобиль #${car.id_cars}`}</div>
              <div class="lg-map-tooltip__item-spec">
                ${car['tonn_min']}-${car['tonn_max']} т • ${car['m3_min']}-${car['m3_max']} м³
                ${car['car_type'] ? ` • ${car['car_type']}` : ''}
              </div>
            </div>
          `,
            )
            .join('');

          groupMarker.bindTooltip(
            `
          <div class="lg-map-tooltip">
            <div class="lg-map-tooltip-header">
              <div class="lg-map-title">Найдено автомобилей: ${point.cars.length}</div>
              <div class="lg-map-tooltip__location">📍 ${point.location}</div>
            </div>
            <div class="lg-map-tooltip__list">
              ${carsInfo}
              ${point.cars.length > 5 ? `<div class="more-cars">... и еще ${point.cars.length - 5}</div>` : ''}
            </div>
            <div class="lg-map-tooltip__footer">
              Нажмите, чтобы перейти к деталям
            </div>
          </div>
        `,
          {
            direction: 'top',
            offset: [0, -20],
            className: 'lg-map-tooltip-container',
            permanent: false,
            interactive: true,
          } as L.TooltipOptions,
        );

          layersRef.current.carMarkers.set(`${point.id}-group`, groupMarker);
        } catch (error) {
          console.error('Error creating group marker:', error);
        }
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
      <div ref={mapEl} className="h-full w-full min-h-96 rounded-xl overflow-hidden border border-border/50 bg-card" />
    </div>
  );
}
