'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { CarSearchMap } from '@/components/car-search/CarSearchMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Search,
  Truck,
  Building2,
  Phone,
  Mail,
  Map,
  Filter,
  X,
  Home,
  Package,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

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
  closest_place?: { lat: number; lon: number };
}

interface SearchPoint {
  id: string;
  location: string;
  lat: number;
  lon: number;
  radius: number;
  cars: CarItem[];
  searchLocation: { lat: number; lon: number; name: string; radius: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export default function CarSearchPage() {
  const router = useRouter();

  const [searchPoints, setSearchPoints] = useState<SearchPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState('');
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

      const response = await fetch(`${API_BASE}/api/car-search-public/search?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка поиска автомобилей');
      }

      const data = await response.json();

      // Обрабатываем ответ API
      const searchLoc = data.searchPoint || data.search_location;
      const cars = (data.items || []) as any[];

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

      // Добавляем closest_place для каждого автомобиля
      const processedCars: CarItem[] = cars.map((car: any) => {
        const places = car.places || {};
        const searchLat = Number(searchLoc.lat);
        const searchLon = Number(searchLoc.lon);

        let closestPlace: { lat: number; lon: number } | null = null;
        let minDistance = Infinity;

        Object.values(places).forEach((place: any) => {
          if (
            place &&
            place.active !== false &&
            place.lat != null &&
            place.lon != null &&
            !isNaN(place.lat) &&
            !isNaN(place.lon)
          ) {
            const R = 6371; // км
            const dLat = ((place.lat - searchLat) * Math.PI) / 180;
            const dLon = ((place.lon - searchLon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((searchLat * Math.PI) / 180) *
                Math.cos((place.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance < minDistance) {
              minDistance = distance;
              closestPlace = { lat: place.lat, lon: place.lon };
            }
          }
        });

        if (closestPlace !== null) {
          const { lat, lon } = closestPlace;
          console.log(
            `Car ${car.id_cars}: Selected closest place at ${lat}, ${lon} (distance: ${minDistance.toFixed(
              2
            )} km from search point)`
          );
          return { ...car, closest_place: closestPlace } as CarItem;
        }
        console.warn(`Car ${car.id_cars}: No valid places found`);
        return car as CarItem;
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

      setSearchPoints((prev) => [...prev, newPoint]);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6">
          {/* Заголовок и навигация */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Truck className="h-10 w-10 text-blue-600" />
                  Поиск автомобилей
                </h1>
                <p className="text-lg text-gray-600">
                  Найдите подходящие автомобили для ваших грузоперевозок
                </p>
              </div>

              {/* Кнопки навигации */}
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                >
                  <Home className="h-4 w-4" />
                  На главную
                </Button>
                <Button
                  onClick={() => router.push('/cargo-search')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="h-4 w-4" />
                  Поиск грузов
                </Button>
              </div>
            </div>
          </div>

          {/* Поисковый блок */}
          <Card className="mb-6 bg-white shadow-lg rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-6 w-6 text-blue-600" />
                Параметры поиска
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Место поиска</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="radius">Радиус поиска (км)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={currentRadius}
                    onChange={(e) => setCurrentRadius(Number(e.target.value))}
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              {/* Доп. фильтры */}
              {showAdvancedFilters && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700">Дополнительные фильтры</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tonnMin">Мин. грузоподъемность (т)</Label>
                      <Input
                        id="tonnMin"
                        type="number"
                        value={tonnMin ?? ''}
                        onChange={(e) =>
                          setTonnMin(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="Не указано"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tonnMax">Макс. грузоподъемность (т)</Label>
                      <Input
                        id="tonnMax"
                        type="number"
                        value={tonnMax ?? ''}
                        onChange={(e) =>
                          setTonnMax(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="Не указано"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="m3Min">Мин. объем (м³)</Label>
                      <Input
                        id="m3Min"
                        type="number"
                        value={m3Min ?? ''}
                        onChange={(e) =>
                          setM3Min(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="Не указано"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="m3Max">Макс. объем (м³)</Label>
                      <Input
                        id="m3Max"
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

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvancedFilters ? 'Скрыть фильтры' : 'Доп. фильтры'}
                </Button>

                <Button
                  onClick={searchLocation}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Truck className="h-4 w-4 animate-pulse" />
                      Поиск...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Найти
                    </>
                  )}
                </Button>

                {searchPoints.length > 0 && (
                  <Button
                    onClick={clearAll}
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Очистить все
                  </Button>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Точки поиска */}
          {searchPoints.length > 0 && (
            <Card className="mb-6 bg-white shadow-lg rounded-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Точки поиска ({searchPoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchPoints.map((point) => (
                    <div
                      key={point.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg ${
                        selectedPointId === point.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                      }`}
                      onClick={() => setSelectedPointId(point.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{point.location}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearchPoint(point.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Радиус: {point.radius} км</div>
                        <div>Найдено: {point.cars.length} автомобилей</div>
                        <div>
                          Координаты: {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Основной контент */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Карта */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] bg-white shadow-lg rounded-lg overflow-hidden">
                <CardContent
                  className="p-4 h-full"
                  style={{ minHeight: '500px', position: 'relative', overflow: 'hidden' }}
                >
                  <CarSearchMap
                    searchPoints={searchPoints}
                    selectedPointId={selectedPointId}
                    onPointClick={setSelectedPointId}
                    onCarClick={setFocusedCarId}
                    focusedCarId={focusedCarId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Список автомобилей */}
            <div className="lg:col-span-1">
              <Card className="h-[600px] bg-white shadow-lg rounded-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-600" />
                    Найденные автомобили ({selectedPoint?.cars.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full overflow-y-auto">
                  {selectedPoint ? (
                    selectedPoint.cars.length > 0 ? (
                      <div className="space-y-4 p-4">
                        {selectedPoint.cars.map((car) => (
                          <div
                            key={car.id_cars}
                            className={`p-4 border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
                              focusedCarId === car.id_cars
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                : 'border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                            }`}
                            onClick={() => setFocusedCarId(car.id_cars)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-lg">
                                {car.title || `Автомобиль #${car.id_cars}`}
                              </h3>
                              <Badge variant="secondary">{car.id_cars}</Badge>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Грузоподъемность:</span>
                                <span className="font-medium">
                                  {car.tonn_min}-{car.tonn_max} т
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Объем:</span>
                                <span className="font-medium">
                                  {car.m3_min}-{car.m3_max} м³
                                </span>
                              </div>
                              {car.car_type && (
                                <div className="flex justify-between">
                                  <span>Тип:</span>
                                  <span className="font-medium">{car.car_type}</span>
                                </div>
                              )}
                              {car.tip_zagryzki && (
                                <div className="flex justify-between">
                                  <span>Загрузка:</span>
                                  <span className="font-medium">{car.tip_zagryzki}</span>
                                </div>
                              )}
                              {car.price && car.price > 0 && (
                                <div className="flex justify-between">
                                  <span>Цена:</span>
                                  <span className="font-medium text-green-600">
                                    {car.price} руб.
                                  </span>
                                </div>
                              )}
                              {car.distance_km != null && (
                                <div className="flex justify-between">
                                  <span>Расстояние:</span>
                                  <span className="font-medium text-blue-600">
                                    {car.distance_km} км
                                  </span>
                                </div>
                              )}
                            </div>

                            {car.company_name && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium text-sm">{car.company_name}</span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>УНП: {car.company_unp}</div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {car.company_tel_1}
                                    {car.company_tel_2 ? `, ${car.company_tel_2}` : ''}
                                  </div>
                                  {car.company_email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {car.company_email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <Button
                              size="sm"
                              className="w-full mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: открыть модал с подробностями
                              }}
                            >
                              Подробнее
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Автомобили не найдены</p>
                          <p className="text-sm">Попробуйте изменить параметры поиска</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Map className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Выберите точку поиска</p>
                        <p className="text-sm">для просмотра найденных автомобилей</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
