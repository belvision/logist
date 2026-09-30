'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  nodes?: number[];
}

interface CargoRouteMapProps {
  start: Place | null;
  end: Place | null;
  waypoints: Place[];
  route: RouteData | null;
  onWaypointRemove?: (index: number) => void;
  height?: number | string;
}

// Стили для маршрута
const MAIN_COLOR = '#2563eb';
const MAIN_WIDTH = 6;
const HALO_EXTRA = 3;
const WAYPOINT_COLOR = '#f59e0b';

export function CargoRouteMap({
  start,
  end,
  waypoints,
  route,
  onWaypointRemove,
  height = 400,
}: CargoRouteMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    base?: L.LayerGroup;
    main?: { 
      halo?: L.Polyline; 
      line?: L.Polyline; 
      start?: L.CircleMarker; 
      end?: L.CircleMarker;
      waypoints?: L.CircleMarker[];
    };
  }>({
    main: { waypoints: [] },
  });

  // Инициализация карты
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

    mapRef.current = map;
    layersRef.current.base = base;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Отрисовка маршрута
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Пересчитываем размеры и отрисовываем маршрут в следующем кадре
    requestAnimationFrame(() => {
      try {
        map.invalidateSize();
      } catch {}

      // Очистка старых слоев
      if (layersRef.current.main?.halo) map.removeLayer(layersRef.current.main.halo);
      if (layersRef.current.main?.line) map.removeLayer(layersRef.current.main.line);
      if (layersRef.current.main?.start) map.removeLayer(layersRef.current.main.start);
      if (layersRef.current.main?.end) map.removeLayer(layersRef.current.main.end);
      layersRef.current.main?.waypoints?.forEach(marker => map.removeLayer(marker));
      
      layersRef.current.main = { waypoints: [] };

      if (!route?.geometry?.coordinates?.length) {
        return;
      }

      // Создание маршрута
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      const halo = L.polyline(coordinates as any, { 
        color: '#ffffff', 
        weight: MAIN_WIDTH + HALO_EXTRA * 2, 
        opacity: 0.9 
      });
      const line = L.polyline(coordinates as any, { 
        color: MAIN_COLOR, 
        weight: MAIN_WIDTH, 
        opacity: 1 
      });

      halo.addTo(map);
      line.addTo(map);

      // Маркеры начальной и конечной точек
      if (start) {
        const startMarker = L.circleMarker([start.lat, start.lon], {
          radius: 8,
          fillColor: '#22c55e',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        
        startMarker.bindTooltip(`Начало: ${start.name}`, { direction: 'top' });
        layersRef.current.main.start = startMarker;
      }

      if (end) {
        const endMarker = L.circleMarker([end.lat, end.lon], {
          radius: 8,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        
        endMarker.bindTooltip(`Конец: ${end.name}`, { direction: 'top' });
        layersRef.current.main.end = endMarker;
      }

      // Промежуточные точки
      waypoints.forEach((waypoint, index) => {
        const waypointMarker = L.circleMarker([waypoint.lat, waypoint.lon], {
          radius: 6,
          fillColor: WAYPOINT_COLOR,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);
        
        waypointMarker.bindTooltip(`Промежуточная точка ${index + 1}: ${waypoint.name}`, { direction: 'top' });
        
        // Добавляем обработчик клика для удаления
        if (onWaypointRemove) {
          waypointMarker.on('click', () => onWaypointRemove(index));
        }
        
        layersRef.current.main?.waypoints?.push(waypointMarker);
      });

      // Подгонка карты под маршрут
      if (coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates as any);
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      layersRef.current.main.halo = halo;
      layersRef.current.main.line = line;
    });
  }, [route, start, end, waypoints, onWaypointRemove]);


  const styleHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="relative w-full">
      <div
        ref={mapEl}
        style={{ 
          width: '100%', 
          height: styleHeight || 400, 
          borderRadius: 12, 
          overflow: 'hidden', 
          zIndex: 1 
        }}
      />
      
      {/* Информация о маршруте */}
      {route && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm font-medium text-gray-900">
            Расстояние: {(route.distance / 1000).toFixed(1)} км
          </div>
          <div className="text-sm text-gray-600">
            Время: {Math.round(route.duration / 60)} мин
          </div>
        </div>
      )}
      
    </div>
  );
}

export default CargoRouteMap;
