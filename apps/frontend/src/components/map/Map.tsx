'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  height?: string | number;
  minHeight?: string | number;
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  onMapReady?: (map: L.Map) => void;
  children?: React.ReactNode;
}

export const Map = ({
  height = '100%',
  minHeight = '400px',
  className = '',
  defaultCenter = [53.9, 27.56], // Минск по умолчанию
  defaultZoom = 6,
  onMapReady,
  children,
}: MapProps) => {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;

    const map = L.map(mapEl.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    map.setView(defaultCenter, defaultZoom);

    mapRef.current = map;

    // Вызываем callback когда карта готова
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [defaultCenter, defaultZoom, onMapReady]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;

  return (
    <div className={`relative w-full z-0 ${className}`}>
      <div
        ref={mapEl}
        className="w-full rounded-lg"
        style={{
          height: heightStyle,
          minHeight: minHeightStyle,
        }}
      />
      {children}
    </div>
  );
};

export default Map;

