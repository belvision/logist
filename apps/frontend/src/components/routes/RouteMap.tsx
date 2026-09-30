'use client';

import { useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map } from '@/components/map';

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
    type: string;
    coordinates: [number, number][];
  };
}

interface RouteMapProps {
  start: Place | null;
  end: Place | null;
  waypoints: Place[];
  route: RouteData | null;
}

const ROUTE_COLOR = 'hsl(var(--primary))';
const ROUTE_HALO_COLOR = 'hsl(var(--card))';
const START_FILL_COLOR = 'hsl(var(--chart-2))';
const START_BORDER_COLOR = 'hsl(var(--card))';
const END_FILL_COLOR = 'hsl(var(--destructive))';
const END_BORDER_COLOR = 'hsl(var(--card))';
const WAYPOINT_FILL_COLOR = 'hsl(var(--chart-4))';
const WAYPOINT_BORDER_COLOR = 'hsl(var(--card))';
const MAIN_WIDTH = 6;
const HALO_EXTRA = 3;

const RouteMapComponent = ({ start, end, waypoints, route }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    halo?: L.Polyline;
    line?: L.Polyline;
    start?: L.CircleMarker;
    end?: L.CircleMarker;
    waypoints?: L.CircleMarker[];
  }>({ waypoints: [] });

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Обновление маршрута и маркеров при изменениях
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Очистка старых слоев
    if (layersRef.current.halo) map.removeLayer(layersRef.current.halo);
    if (layersRef.current.line) map.removeLayer(layersRef.current.line);
    if (layersRef.current.start) map.removeLayer(layersRef.current.start);
    if (layersRef.current.end) map.removeLayer(layersRef.current.end);
    layersRef.current.waypoints?.forEach((marker) => map.removeLayer(marker));

    layersRef.current = { waypoints: [] };

    // Отрисовка маршрута (если есть)
    if (route?.geometry?.coordinates?.length) {
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );

      const halo = L.polyline(coordinates, {
        color: ROUTE_HALO_COLOR,
        weight: MAIN_WIDTH + HALO_EXTRA * 2,
        opacity: 0.9,
      });
      const line = L.polyline(coordinates, {
        color: ROUTE_COLOR,
        weight: MAIN_WIDTH,
        opacity: 1,
      });

      halo.addTo(map);
      line.addTo(map);

      layersRef.current.halo = halo;
      layersRef.current.line = line;
    }

    // Маркер начальной точки (показываем всегда, если есть)
    if (start) {
      const startMarker = L.circleMarker([start.lat, start.lon], {
        radius: 8,
        fillColor: START_FILL_COLOR,
        color: START_BORDER_COLOR,
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      startMarker.bindTooltip(`Начало: ${start.name}`, { direction: 'top' });
      layersRef.current.start = startMarker;
    }

    // Маркер конечной точки
    if (end) {
      const endMarker = L.circleMarker([end.lat, end.lon], {
        radius: 8,
        fillColor: END_FILL_COLOR,
        color: END_BORDER_COLOR,
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      endMarker.bindTooltip(`Конец: ${end.name}`, { direction: 'top' });
      layersRef.current.end = endMarker;
    }

    // Промежуточные точки
    waypoints.forEach((waypoint, index) => {
      const waypointMarker = L.circleMarker([waypoint.lat, waypoint.lon], {
        radius: 6,
        fillColor: WAYPOINT_FILL_COLOR,
        color: WAYPOINT_BORDER_COLOR,
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      waypointMarker.bindTooltip(`Промежуточная точка ${index + 1}: ${waypoint.name}`, {
        direction: 'top',
      });

      layersRef.current.waypoints?.push(waypointMarker);
    });

    // Подгонка карты под содержимое
    if (route?.geometry?.coordinates?.length) {
      // Если есть маршрут, подгоняем под весь маршрут
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start || end || waypoints.length > 0) {
      // Если нет маршрута, но есть точки - показываем их
      const points = [];
      if (start) points.push([start.lat, start.lon] as [number, number]);
      if (end) points.push([end.lat, end.lon] as [number, number]);
      waypoints.forEach(wp => points.push([wp.lat, wp.lon] as [number, number]));

      if (points.length === 1) {
        // Одна точка - центрируем на ней
        map.setView(points[0], 13);
      } else if (points.length > 1) {
        // Несколько точек - подгоняем границы
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [route, start, end, waypoints]);

  return (
    <Map height="100%" minHeight="500px" onMapReady={handleMapReady}>
      {/* Информация о маршруте */}
      {route && (
        <div className="absolute  top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-[1000] border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            Расстояние: {(route.distance / 1000).toFixed(1)} км
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Время в пути: {Math.round(route.duration / 60)} мин
          </div>
        </div>
      )}
    </Map>
  );
};

export { RouteMapComponent as RouteMap };
export default RouteMapComponent;

