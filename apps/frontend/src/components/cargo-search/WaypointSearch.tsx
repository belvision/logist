'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Search } from 'lucide-react';
import { searchPlaces } from '@/shared/api/nominatim';

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface WaypointSearchProps {
  onPick: (place: Place) => Promise<void>;
}


export function WaypointSearch({ onPick }: WaypointSearchProps) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- helper: поиск мест ----
  async function searchPlacesHandler(q: string) {
    if (!q.trim() || q.trim().length < 3) {
      setPlaces([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await searchPlaces(q, true);

      // ожидаем формат: { items: [{ place: { [id]: {lat,lon}}, label: string }, ...] }
      const transformed: Place[] = (data?.items ?? []).map((item: { place?: Record<string, { lat: number; lon: number }>; label?: string }) => {
        const key = Object.keys(item.place ?? {})[0];
        const coords = key ? item.place?.[key] : null;
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
    } catch {
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
    onPick(place).then(() => {
      // Очистить поле и закрыть меню
      setQuery('');
      setPlaces([]);
      setOpen(false);
      setActiveIdx(-1);
      // Фокус вернём
      setTimeout(() => inputRef.current?.focus(), 0);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, places.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < places.length && places[activeIdx]) onChoose(places[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Клик вне — закрыть
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Очистка таймера
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="space-y-3">
      {/* Обёртка relative — дропдаун будет привязан сюда */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Введите промежуточную точку чтобы изменить маршрут"
              value={query}
              onChange={(e) => onInputChange(e.target.value)}
              onFocus={() => { if (places.length > 0) setOpen(true); }}
              onKeyDown={onKeyDown}
              className="pl-10"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <Button
            onClick={() => searchPlacesHandler(query)}
            disabled={!query.trim() || loading}
            variant="outline"
            size="icon"
            aria-label="Найти"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Дропдаун — ТЕПЕРЬ внутри relative-обёртки */}
        {open && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
            {error ? (
              <Card className="bg-white"><CardContent className="p-4 text-sm text-red-600">{error}</CardContent></Card>
            ) : places.length === 0 && !loading ? (
              <Card className="bg-white"><CardContent className="p-4 text-center text-gray-500">Места не найдены</CardContent></Card>
            ) : (
              <Card className="max-h-72 overflow-y-auto shadow-lg border bg-white">
                <CardContent className="p-0">
                  {places.map((p, idx) => (
                    <button
                      key={`${p.place_id}-${idx}`}
                      onMouseDown={(e) => e.preventDefault()} // не давать blur сорвать клик
                      onClick={() => onChoose(p)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 ${idx === activeIdx ? 'bg-gray-50' : ''}`}
                      role="option"
                      aria-selected={idx === activeIdx}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
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
    </div>
  );
}
