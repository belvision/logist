'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useApiAuth } from '@/shared/hooks/useApiAuth';

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface LocationSearchBoxProps {
  id?: string;
  onPick: (place: Place) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555';

export function LocationSearchBox({ id, onPick, placeholder = "Введите город или адрес", value = "", onChange }: LocationSearchBoxProps) {
  const [query, setQuery] = useState(value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { fetchWithAuth } = useApiAuth();

  // Синхронизируем внутреннее состояние с внешним значением
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // ---- helper: поиск мест ----
  async function searchPlaces(q: string) {
    if (q.trim().length < 3) {
      setPlaces([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `${API_BASE}/api/nominatim/places/search-auth?q=${encodeURIComponent(q)}`;
      const resp = await fetchWithAuth(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      // ожидаем формат: { items: [{ place: { [id]: {lat,lon}}, label: string }, ...] }
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
    onChange?.(v);
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
    onPick(place);
    setQuery(place.name);
    onChange?.(place.name);
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
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id={id}
          ref={inputRef}
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoComplete="address-level2"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}

      {open && places.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {places.map((place, idx) => (
              <div
                key={place.place_id}
                className={`px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                  idx === activeIdx ? 'bg-blue-50' : ''
                }`}
                onClick={() => onChoose(place)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{place.name}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
