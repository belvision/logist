'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { CarSearchMap } from '@/components/car-search/CarSearchMap';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, Filter, Navigation, MapPin, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { searchCarsAuth } from '@/shared/api/car-search';
import { usePageHeader } from '@/shared/context/page-header-context';

interface CarItem {
  id_cars: number;
  title?: string;
  tonn_min: number;
  tonn_max: number;
  m3_min: number;
  m3_max: number;
  price?: number;
  car_type?: string;
  tip_zagryzki?: string;
  company_name?: string;
  company_unp?: string;
  company_entity_type?: string;
  company_address?: string;
  company_tel_1?: string;
  company_tel_2?: string;
  company_email?: string;
  distance_km?: number;
  closest_place?: {
    lat: number;
    lon: number;
    place_id: number;
    name: string;
  };
}

type PlacePoint = {
  lat: number;
  lon: number;
  /** Опциональный флаг активности — если отсутствует, считаем активным */
  active?: boolean;
};

type CarWithPlaces = CarItem & { places?: Record<string, PlacePoint> };

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
  radius: number;
  cars: Car[];
  searchLocation: { lat: number; lon: number; name: string; radius: number };
}


function CarSearchPageHeader() {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Поиск автомобилей',
      'Найдите подходящие автомобили для ваших грузоперевозок',
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, []);

  return null;
}

export default function CarSearchPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params['company_id'] as string;

  const [searchPoints, setSearchPoints] = useState<SearchPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState(searchParams?.get('location') || '');
  const [currentRadius, setCurrentRadius] = useState(50);

  const [tonnMin, setTonnMin] = useState<number | undefined>();
  const [tonnMax, setTonnMax] = useState<number | undefined>();
  const [m3Min, setM3Min] = useState<number | undefined>();
  const [m3Max, setM3Max] = useState<number | undefined>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [focusedCarId, setFocusedCarId] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const searchLocation = async () => {
    if (!currentLocation.trim()) {
      setError('Введите место поиска');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        location: currentLocation,
        radius: currentRadius.toString(),
      });

      if (tonnMin !== undefined) params.append('tonn_min', tonnMin.toString());
      if (tonnMax !== undefined) params.append('tonn_max', tonnMax.toString());
      if (m3Min !== undefined) params.append('m3_min', m3Min.toString());
      if (m3Max !== undefined) params.append('m3_max', m3Max.toString());

      const searchParams: Record<string, string> = {
        location: currentLocation,
        radius: currentRadius.toString(),
      };
      
      if (tonnMin !== undefined) searchParams['tonn_min'] = tonnMin.toString();
      if (tonnMax !== undefined) searchParams['tonn_max'] = tonnMax.toString();
      if (m3Min !== undefined) searchParams['m3_min'] = m3Min.toString();
      if (m3Max !== undefined) searchParams['m3_max'] = m3Max.toString();

      const data = await searchCarsAuth({
        radius: currentRadius,
        ...(tonnMin !== undefined ? { tonn_min: tonnMin } : {}),
        ...(tonnMax !== undefined ? { tonn_max: tonnMax } : {}),
        ...(m3Min !== undefined ? { m3_min: m3Min } : {}),
        ...(m3Max !== undefined ? { m3_max: m3Max } : {}),
      });

      // Обрабатываем ответ API
      const searchLoc = data.search_location;

      // ✅ Главное изменение: тип данных из API — это уже CarItem[],
      // просто у объектов может быть поле places с точками.
      const cars = (data.items || []) as CarWithPlaces[];

      // Валидация координат
      if (
        !searchLoc ||
        searchLoc.lat == null ||
        searchLoc.lon == null ||
        isNaN(searchLoc.lat) ||
        isNaN(searchLoc.lon)
      ) {
        throw new Error('Некорректные координаты места поиска');
      }

      // Используем closest_place из API, преобразуя формат
      const processedCars: Car[] = cars.map((car: CarWithPlaces): Car => {

        // Если API уже вернул closest_place, используем его
        if (car.closest_place && typeof car.closest_place === 'object') {
          const apiClosestPlace = car.closest_place as any;
          // Преобразуем placeId (строка) в place_id (число) и добавляем name из places
          const placeId = apiClosestPlace.placeId || apiClosestPlace.place_id;
          const places = car.places || {};
          const placeData = placeId && places[placeId] ? places[placeId] : null;

          const result = {
            ...car,
            closest_place: {
              lat: apiClosestPlace.lat,
              lon: apiClosestPlace.lon,
              place_id: placeId ? parseInt(String(placeId), 10) : 0,
              name: placeData && (placeData as any).label ? (placeData as any).label : (placeData && (placeData as any).name ? (placeData as any).name : '')
            }
          };

          return result;
        }

        // Fallback: ищем ближайшее место вручную (старая логика)
        const places = car.places || {};
        const searchLat = Number(searchLoc.lat);
        const searchLon = Number(searchLoc.lon);

        let closestPlace: { lat: number; lon: number; place_id: number; name: string } | null = null;
        let minDistance = Infinity;
        let closestPlaceId: string | null = null;

        Object.entries(places).forEach(([placeId, place]: [string, PlacePoint]) => {
          if (
            place &&
            place.active !== false &&
            place.lat != null &&
            place.lon != null &&
            !isNaN(Number(place.lat)) &&
            !isNaN(Number(place.lon))
          ) {
            const latNum = Number(place.lat);
            const lonNum = Number(place.lon);

            const R = 6371; // км
            const dLat = ((latNum - searchLat) * Math.PI) / 180;
            const dLon = ((lonNum - searchLon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((searchLat * Math.PI) / 180) *
                Math.cos((latNum * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance < minDistance) {
              minDistance = distance;
              closestPlaceId = placeId;
              const placeData = place as any;
              closestPlace = {
                lat: latNum,
                lon: lonNum,
                place_id: parseInt(placeId, 10) || 0,
                name: placeData?.label || placeData?.name || ''
              };
            }
          } else {
          }
        });

        if (closestPlace !== null) {
          return { 
            ...car,
            closest_place: closestPlace
          };
        }
        return {
          ...car,
          closest_place: undefined
        };
      });

      const newPoint: SearchPoint = {
        id: Date.now().toString(),
        location: currentLocation,
        lat: Number(searchLoc.lat),
        lon: Number(searchLoc.lon),
        radius: currentRadius,
        cars: processedCars,
        searchLocation: {
          lat: Number(searchLoc.lat),
          lon: Number(searchLoc.lon),
          name: searchLoc.name || currentLocation,
          radius: currentRadius,
        },
      };

      // Заменяем все точки поиска новой (чтобы не накапливались старые)
      setSearchPoints([newPoint]);
      setCurrentLocation('');
      setSelectedPointId(newPoint.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка поиска автомобилей');
    } finally {
      setLoading(false);
    }
  };

  const removeSearchPoint = (pointId: string) => {
    setSearchPoints((prev) => prev.filter((p) => p.id !== pointId));
    if (selectedPointId === pointId) setSelectedPointId(null);
  };

  const clearAll = () => {
    setSearchPoints([]);
    setSelectedPointId(null);
    setError('');
  };

  const selectedPoint = selectedPointId
    ? searchPoints.find((p) => p.id === selectedPointId) || null
    : null;

  return (
    <AppLayout>
      <CarSearchPageHeader />
      <div className="flex bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto flex space-x-4">
            {/* Left Panel - Search Parameters */}
            <div className="w-full space-y-8 lg:w-2/3">

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Параметры поиска
                </h2>

                <div className="space-y-6">
                  {/* Location Input */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Место поиска</label>
                    <LocationSearchBox
                      id="location"
                      value={currentLocation}
                      onChange={setCurrentLocation}
                      onPick={(place) => {
                        setCurrentLocation(place.name);
                        setTimeout(() => searchLocation(), 100);
                      }}
                      placeholder="Введите город или адрес"
                    />
                  </div>

                  {/* Radius Slider */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Радиус поиска (км)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={currentRadius}
                        onChange={(e) => setCurrentRadius(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium bg-muted px-3 py-1 rounded">{currentRadius}</span>
                    </div>
                  </div>

                  {/* Доп. фильтры */}
                  {showAdvancedFilters && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground">Дополнительные фильтры</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Мин. грузоподъемность (т)</label>
                          <Input
                            type="number"
                            value={tonnMin ?? ''}
                            onChange={(e) =>
                              setTonnMin(e.target.value ? Number(e.target.value) : undefined)
                            }
                            placeholder="Не указано"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Макс. грузоподъемность (т)</label>
                          <Input
                            type="number"
                            value={tonnMax ?? ''}
                            onChange={(e) =>
                              setTonnMax(e.target.value ? Number(e.target.value) : undefined)
                            }
                            placeholder="Не указано"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Мин. объем (м³)</label>
                          <Input
                            type="number"
                            value={m3Min ?? ''}
                            onChange={(e) =>
                              setM3Min(e.target.value ? Number(e.target.value) : undefined)
                            }
                            placeholder="Не указано"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Макс. объем (м³)</label>
                          <Input
                            type="number"
                            value={m3Max ?? ''}
                            onChange={(e) =>
                              setM3Max(e.target.value ? Number(e.target.value) : undefined)
                            }
                            placeholder="Не указано"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      {showAdvancedFilters ? 'Скрыть фильтры' : 'Доп. фильтры'}
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={searchLocation}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Truck className="w-4 h-4 mr-2 animate-pulse" />
                          Поиск...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Найти
                        </>
                      )}
                    </Button>
                  </div>

                  {searchPoints.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h3 className="text-md font-semibold text-foreground">
                            Сохранённые точки ({searchPoints.length})
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={clearAll}
                        >
                          Очистить всё
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {searchPoints.map((point) => {
                          const isSelected = selectedPointId === point.id;
                          return (
                            <div
                              key={point.id}
                              className={`p-4 border rounded-lg transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/40'
                              }`}
                              onClick={() => setSelectedPointId(point.id)}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{point.searchLocation.name}</span>
                                  <Badge variant="secondary">{point.radius} км</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Найдено автомобилей: {point.cars.length}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeSearchPoint(point.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Map Container */}
              <div className="bg-card border border-border rounded-lg overflow-hidden h-96">
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        'url(\'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40"%3E%3Cpath d="M0 0h40v40H0z" fill="%23ccc"/%3E%3C/svg%3E\')',
                    }}
                  />
                  <div className="w-full h-full relative z-10">
                    <CarSearchMap
                      searchPoints={searchPoints}
                      selectedPointId={selectedPointId}
                      onPointClick={setSelectedPointId}
                      onCarClick={setFocusedCarId}
                      focusedCarId={focusedCarId}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Panel - Found Vehicles */}
            <div className="hidden lg:flex flex-col w-1/3">
              <div className="bg-card border border-border rounded-lg p-6 h-fit flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Найденные автомобили ({selectedPoint?.cars.length || 0})</h3>
                </div>

                {selectedPoint ? (
                  selectedPoint.cars.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto flex-1">
                      {selectedPoint.cars.map((car) => (
                        <div
                          key={car.id_cars}
                          className={`p-4 border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
                            focusedCarId === car.id_cars
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => setFocusedCarId(car.id_cars)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-foreground">
                              {String(car['title'] || '') || `Автомобиль #${car.id_cars}`}
                            </h3>
                            <Badge variant="secondary">{car.id_cars}</Badge>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Грузоподъемность:</span>
                              <span className="font-medium text-foreground">
                                {String(car['tonn_min'] || '')}-{String(car['tonn_max'] || '')} т
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Объем:</span>
                              <span className="font-medium text-foreground">
                                {String(car['m3_min'] || '')}-{String(car['m3_max'] || '')} м³
                              </span>
                            </div>
                            {!!car['car_type'] && !!(car['car_type'] as string)?.trim() && (
                              <div className="flex justify-between">
                                <span>Тип:</span>
                                <span className="font-medium text-foreground">{String(car['car_type'] || '')}</span>
                              </div>
                            )}
                            {!!car['price'] && !isNaN(Number(car['price'] as number || 0)) && Number(car['price'] as number || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Цена:</span>
                                <span className="font-medium text-green-600">
                                  {String(car['price'] || '')} руб.
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/company/${companyId}/car-search/${car.id_cars}`);
                            }}
                          >
                            Подробнее
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-4">📍</div>
                      <p className="text-sm text-muted-foreground">
                        Автомобили не найдены. Попробуйте изменить параметры поиска
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">📍</div>
                    <p className="text-sm text-muted-foreground">
                      Выберите точку поиска для просмотра найденных автомобилей
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
