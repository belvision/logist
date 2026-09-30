'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Search, X } from 'lucide-react';

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface WaypointSearchProps {
  onAdd: (place: Place) => void;
  waypoints: Place[];
  onRemove: (index: number) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555';

export function WaypointSearch({ onAdd, waypoints, onRemove }: WaypointSearchProps) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Поиск мест
  async function searchPlaces(q: string) {
    if (!q.trim() || q.trim().length < 3) {
      setPlaces([]);
      setOpen(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const url = `${API_BASE}/api/nominatim/places/search?q=${encodeURIComponent(q)}`;
      const resp = await fetch(url, { 
        headers: { accept: 'application/json' }, 
        credentials: 'include' 
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const transformed: Place[] = (data?.items ?? []).map((item: any) => {
        const key = Object.keys(item.place ?? {})[0];
        const coords = key ? item.place[key] : null;
        return {
          place_id: key ? parseInt(key, 10) : 0,
          name: String(item.label ?? '').trim(),
          lat: coords?.lat ?? NaN,
          lon: coords?.lon ?? NaN,
        };
      }).filter((p: Place) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.place_id > 0);

      setPlaces(transformed);
      setActiveIdx(transformed.length ? 0 : -1);
      setOpen(transformed.length > 0);
    } catch (e: any) {
      setError('Ошибка поиска мест');
      setPlaces([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(v: string) {
    setQuery(v);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length >= 3) {
      debounceRef.current = setTimeout(() => searchPlaces(v), 300);
    } else {
      setPlaces([]);
      setOpen(false);
    }
  }

  function onChoose(place: Place) {
    onAdd(place);
    setQuery('');
    setPlaces([]);
    setOpen(false);
    setActiveIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || places.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx(prev => (prev + 1) % places.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(prev => (prev - 1 + places.length) % places.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < places.length) {
          onChoose(places[activeIdx]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIdx(-1);
        break;
    }
  }

  // Закрытие при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Поиск промежуточных точек */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Введите промежуточную точку..."
              value={query}
              onChange={(e) => onInputChange(e.target.value)}
              onFocus={() => { if (places.length > 0) setOpen(true); }}
              onKeyDown={onKeyDown}
              className="pl-10 bg-white border-gray-300"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <Button
            onClick={() => searchPlaces(query)}
            disabled={!query.trim() || loading}
            variant="outline"
            size="icon"
            aria-label="Найти"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Дропдаун с результатами поиска */}
        {open && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
            {error ? (
              <Card className="bg-white"><CardContent className="p-4 text-sm text-red-600">{error}</CardContent></Card>
            ) : places.length === 0 && !loading ? (
              <Card className="bg-white"><CardContent className="p-4 text-center text-gray-500">Места не найдены</CardContent></Card>
            ) : (
              <Card className="max-h-72 overflow-y-auto shadow-lg border bg-white">
                <CardContent className="p-0">
                  {places.map((place, idx) => (
                    <button
                      key={`${place.place_id}-${idx}`}
                      onMouseDown={(e) => e.preventDefault()} // не давать blur сорвать клик
                      onClick={() => onChoose(place)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 ${idx === activeIdx ? 'bg-gray-50' : ''}`}
                      role="option"
                      aria-selected={idx === activeIdx}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{place.name}</div>
                        <div className="text-xs text-gray-500">
                          {place.lat.toFixed(5)}, {place.lon.toFixed(5)}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Список промежуточных точек */}
      {waypoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Промежуточные точки:</h4>
          <div className="space-y-2">
            {waypoints.map((waypoint, index) => (
              <div 
                key={`${waypoint.place_id}-${index}`} 
                className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{waypoint.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

export default WaypointSearch;
