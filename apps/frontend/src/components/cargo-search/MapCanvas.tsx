'use client';

import { useEffect, useRef } from 'react';
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
const MAIN_WIDTH = 4;
const HALO_EXTRA = 1;

const SIM_WIDTH = 2;
const SIM_OPACITY = 0.9;
const SIM_DASH = '6 4';

// Яркая палитра для похожих маршрутов (из старого проекта)
const PALETTE = [
  '#ef4444', '#f59e0b', '#22c55e', '#06b6d4',
  '#a855f7', '#ec4899', '#84cc16', '#0ea5e9',
  '#e11d48', '#10b981', '#fb923c', '#8b5cf6',
];

function colorFor(id: string | number) {
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
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

// смещение ломаной на offsetPx пикселей (в экранных координатах) - из старого проекта
function offsetLineStringPixels(map: L.Map, lineGeom: LineString, offsetPx: number): LineString {
  if (!map || !lineGeom || lineGeom.type !== 'LineString') return lineGeom;
  const coords = lineGeom.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return lineGeom;

  const pts = coords.map(([lon, lat]) => map.latLngToLayerPoint([lat, lon]));
  const segNormals: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = (pts[i + 1]?.x || 0) - (pts[i]?.x || 0);
    const dy = (pts[i + 1]?.y || 0) - (pts[i]?.y || 0);
    const len = Math.hypot(dx, dy) || 1;
    segNormals[i] = { x: -dy / len, y: dx / len };
  }

  const outPts = pts.map((p, i) => {
    let nx = 0, ny = 0;
    if (i === 0) { nx = segNormals[0]?.x || 0; ny = segNormals[0]?.y || 0; }
    else if (i === pts.length - 1) { nx = segNormals[i - 1]?.x || 0; ny = segNormals[i - 1]?.y || 0; }
    else {
      nx = (segNormals[i - 1]?.x || 0) + (segNormals[i]?.x || 0);
      ny = (segNormals[i - 1]?.y || 0) + (segNormals[i]?.y || 0);
      const nlen = Math.hypot(nx, ny) || 1;
      nx /= nlen; ny /= nlen;
    }
    return L.point(p.x + offsetPx * nx, p.y + offsetPx * ny);
  });

  const outCoords = outPts.map(pt => {
    const ll = map.layerPointToLatLng(pt);
    return [ll.lng, ll.lat] as [number, number];
  });

  return { type: 'LineString', coordinates: outCoords };
}

// создать polyline из GeoJSON LineString
function lineLayer(geom: LineString, opts: L.PolylineOptions) {
  const latlngs = geom.coordinates.map(([lon, lat]) => [lat, lon]) as [number, number][];
  return L.polyline(latlngs, opts);
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

  const layersRef = useRef<{
    base?: L.LayerGroup;
    main?: { halo?: L.Polyline; line?: L.Polyline; start?: L.CircleMarker; end?: L.CircleMarker };
    similars: Map<string, L.GeoJSON>;
    baseGeom: Map<string, LineString>;
    styles: Map<string, { color: string; weight: number; dashArray?: string; opacity?: number }>;
  }>({
    similars: new Map(),
    baseGeom: new Map(),
    styles: new Map(),
  });

  // init map
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;
    const map = L.map(mapEl.current, {
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    });
    const base = L.layerGroup().addTo(map);
    tiles.addTo(base);

    map.setView([53.9, 27.56], 6); // Минск по умолчанию

    // Обработчики для перерисовки при изменении масштаба/перемещении (из старого проекта)
    const rebuild = () => {
      for (const [id, layer] of layersRef.current.similars) {
        const base = layersRef.current.baseGeom.get(id);
        const style = (layersRef.current.styles.get(id) || {}) as { 
          color?: string; 
          weight?: number; 
          opacity?: number; 
          dashArray?: string; 
        };
        if (!base) continue;
        const px = offsetPxFor(id);
        const geom = offsetLineStringPixels(map, base, px);
        try {
          layer.clearLayers();
          layer.addData({ type: "Feature", geometry: geom } as any);
          layer.setStyle({
            weight: SIM_WIDTH,
            opacity: SIM_OPACITY,
            dashArray: SIM_DASH,
            color: style.color || "#06b6d4",
            lineCap: "butt",
            lineJoin: "round",
          });
        } catch {}
      }
    };
    map.on("zoomend", rebuild);
    map.on("moveend", rebuild);

    mapRef.current = map;
    layersRef.current.base = base;

    return () => {
      map.off("zoomend", rebuild);
      map.off("moveend", rebuild);
    };
  }, []);

  // основной маршрут
  useEffect(() => {
    try {
      console.log('MapCanvas: Rendering main route', { mainRoute, mainStart, mainEnd });
      
      const map = mapRef.current;
      if (!map) {
        console.log('MapCanvas: No map instance');
        return;
      }

      // очистка старого
      if (layersRef.current.main?.halo) map.removeLayer(layersRef.current.main.halo);
      if (layersRef.current.main?.line) map.removeLayer(layersRef.current.main.line);
      if (layersRef.current.main?.start) map.removeLayer(layersRef.current.main.start);
      if (layersRef.current.main?.end) map.removeLayer(layersRef.current.main.end);
      layersRef.current.main = {};

      if (!mainRoute?.geometry?.coordinates?.length) {
        console.log('MapCanvas: No main route geometry');
        return;
      }

      console.log('MapCanvas: Creating route layers', {
        coordinatesCount: mainRoute.geometry.coordinates.length,
        firstCoord: mainRoute.geometry.coordinates[0],
        lastCoord: mainRoute.geometry.coordinates[mainRoute.geometry.coordinates.length - 1]
      });

      const baseGeom = mainRoute.geometry;
      const halo = lineLayer(baseGeom, { color: '#ffffff', weight: MAIN_WIDTH + HALO_EXTRA * 2, opacity: 0.9 });
      const line = lineLayer(baseGeom, { color: MAIN_COLOR, weight: MAIN_WIDTH, opacity: 1 });

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

      // fit
      const b = line.getBounds();
      if (b && b.isValid()) {
        map.fitBounds(b, { padding: [30, 30] });
      }
      
      console.log('MapCanvas: Main route rendered successfully');
    } catch (error) {
      console.error('MapCanvas: Error rendering main route:', error);
    }
  }, [mainRoute?.geometry, mainStart?.lat, mainEnd?.lat]);

  // похожие маршруты (из старого проекта)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const visSet = new Set(
      Array.isArray(visibleIds) ? visibleIds.map(String) : [...(visibleIds || [])].map(String)
    );

    for (const sim of companionCargos) {
      const id = String(sim.id_cargo);
      const has = layersRef.current.similars.get(id);
      const baseGeom = sim?.route?.geometry?.type === "LineString" ? sim.route.geometry : null;

      if (!baseGeom) {
        if (has) { try { map.removeLayer(has); } catch {} layersRef.current.similars.delete(id); }
        layersRef.current.baseGeom.delete(id);
        layersRef.current.styles.delete(id);
        continue;
      }

      layersRef.current.baseGeom.set(id, baseGeom);
      const px = offsetPxFor(id);
      const shifted = offsetLineStringPixels(map, baseGeom, px);
      const feat = { type: "Feature" as const, geometry: shifted as any };

      const color = colorFor(id);
      layersRef.current.styles.set(id, { 
        color: color || '', 
        weight: SIM_WIDTH, 
        opacity: SIM_OPACITY, 
        dashArray: SIM_DASH 
      });

      if (!has) {
        const layer = L.geoJSON(feat, {
          style: {
            weight: SIM_WIDTH,
            opacity: SIM_OPACITY,
            dashArray: SIM_DASH,
            color,
            lineCap: "butt",
            lineJoin: "round",
          },
        }).addTo(map);

        const title = (sim?.departure_point && sim?.arrival_point)
          ? `Маршрут ${sim.departure_point} → ${sim.arrival_point}`
          : `Маршрут #${id}`;
        layer.bindTooltip(`${title}\nСходство: ${sim?.match_percent ?? "?"}%`, { sticky: true, opacity: 0.9 });

        layersRef.current.similars.set(id, layer);
      } else {
        const layer = layersRef.current.similars.get(id);
        try {
          layer?.clearLayers();
          layer?.addData(feat);
          layer?.setStyle({
            weight: SIM_WIDTH,
            opacity: SIM_OPACITY,
            dashArray: SIM_DASH,
            color,
            lineCap: "butt",
            lineJoin: "round",
          });
        } catch {}
      }

      const layer = layersRef.current.similars.get(id);
      if (layer) {
        const shouldShow = visSet.size === 0 || visSet.has(id);
        const onMap = map.hasLayer(layer);
        if (shouldShow && !onMap) layer.addTo(map);
        if (!shouldShow && onMap) map.removeLayer(layer);
      }
    }

    // чистка
    for (const [id, layer] of layersRef.current.similars) {
      const exists = companionCargos.some(s => String(s.id_cargo) === id);
      if (!exists) {
        try { map.removeLayer(layer); } catch {}
        layersRef.current.similars.delete(id);
        layersRef.current.baseGeom.delete(id);
        layersRef.current.styles.delete(id);
      }
    }
  }, [companionCargos, visibleIds]);

  // фокус (из старого проекта)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const layer = layersRef.current.similars.get(String(focusId));
    if (layer) {
      const b = layer.getBounds?.();
      if (b?.isValid()) {
        layer.bringToFront?.();
        map.fitBounds(b, { padding: [30, 30] });
      }
    }
  }, [focusId]);

  const styleHeight = typeof height === 'number' ? `${height}px` : height;

  return <div ref={mapEl} style={{ width: '100%', height: styleHeight || 520, borderRadius: 12, overflow: 'hidden', zIndex: 1 }} />;
}

export default MapCanvas;
