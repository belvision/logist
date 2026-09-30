'use client';

import { useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { Plus } from 'lucide-react';
// @ts-ignore - RouteMap dynamic import for Leaflet SSR handling
import { RouteMap } from './RouteMap';
import { API_BASE } from '@/lib/config';
import { SelectCurrency } from './SelectCurrency';

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


const CalculationByCitiesComponent = () => {
  const [startPlace, setStartPlace] = useState<Place | null>(null);
  const [endPlace, setEndPlace] = useState<Place | null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Поля для расчета
  const [fuelConsumption, setFuelConsumption] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [currency, setCurrency] = useState('руб.');
  
  // Результаты расчета
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [totalFuelCost, setTotalFuelCost] = useState<number | null>(null);
  
  // Для добавления промежуточных точек
  const [showWaypointInput, setShowWaypointInput] = useState(false);
  const [waypointInputKey, setWaypointInputKey] = useState(0);

  // Получение маршрута от OSRM
  const fetchRoute = async () => {
    if (!startPlace || !endPlace) return;
    
    setLoading(true);
    try {
      const points = [startPlace, ...waypoints, endPlace];
      
      const url = `${API_BASE}/api/osrm/route`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          points: points.map(p => ({ lat: p.lat, lon: p.lon })),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch route');
      
      const data = await response.json();
      
      if (data.ok && data.data) {
        setRoute({
          distance: data.data.distance,
          duration: data.data.duration,
          geometry: data.data.geometry,
        });
        setTotalDistance(data.data.distance / 1000); // в км
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  };

  // Расчет стоимости
  const calculateCost = () => {
    if (!totalDistance || !fuelConsumption || !fuelPrice) return;
    
    const consumption = parseFloat(fuelConsumption);
    const price = parseFloat(fuelPrice);
    
    if (isNaN(consumption) || isNaN(price)) return;
    
    // Расход на 100 км -> общий расход
    const totalFuel = (totalDistance * consumption) / 100;
    const cost = totalFuel * price;
    
    setTotalFuelCost(cost);
  };

  useEffect(() => {
    if (startPlace && endPlace) {
      fetchRoute();
    }
  }, [startPlace, endPlace, waypoints]);

  useEffect(() => {
    calculateCost();
  }, [totalDistance, fuelConsumption, fuelPrice]);

  const handleAddWaypoint = (place: Place) => {
    setWaypoints([...waypoints, place]);
    // Очищаем инпут для следующего ввода
    setWaypointInputKey(prev => prev + 1);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 space-y-6">
          {/* Заголовок */}
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            РАСЧЕТ ПО ГОРОДАМ
          </div>

          {/* Поля выбора городов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from-city" className="text-gray-700 dark:text-gray-200">
                Откуда:
              </Label>
              <LocationSearchBox
                id="from-city"
                placeholder="Например: Минск, Беларусь"
                onPick={(place) => setStartPlace(place)}
                value={startPlace?.name || ''}
                onChange={(val) => {
                  if (!val) setStartPlace(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-city" className="text-gray-700 dark:text-gray-200">
                Куда:
              </Label>
              <LocationSearchBox
                id="to-city"
                placeholder="Например: Москва, Россия"
                onPick={(place) => setEndPlace(place)}
                value={endPlace?.name || ''}
                onChange={(val) => {
                  if (!val) setEndPlace(null);
                }}
              />
            </div>
          </div>

          {/* Промежуточные точки */}
          {waypoints.length > 0 && (
            <div className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 dark:text-gray-200">
                      Через город №{index + 1}:
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWaypoint(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-auto p-1"
                    >
                      Удалить
                    </Button>
                  </div>
                  <Input
                    value={waypoint.name}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления промежуточных точек */}
          {showWaypointInput && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 dark:text-gray-200">
                  Промежуточные точки
                  {waypoints.length > 0 && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                      {waypoints.length} {waypoints.length === 1 ? 'точка' : waypoints.length < 5 ? 'точки' : 'точек'}
                    </span>
                  )}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWaypointInput(false)}
                  className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 h-auto p-1"
                >
                  Свернуть
                </Button>
              </div>
              <LocationSearchBox
                key={waypointInputKey}
                placeholder={`Добавить ${waypoints.length > 0 ? 'еще одну' : ''} промежуточную точку`}
                onPick={handleAddWaypoint}
                value=""
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 После выбора точки форма останется открытой для добавления следующей
              </p>
            </div>
          )}

          {/* Кнопка добавления промежуточной точки */}
          {!showWaypointInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWaypointInput(true)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border-dashed w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить промежуточные точки
              {waypoints.length > 0 && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                  {waypoints.length}
                </span>
              )}
            </Button>
          )}

          {/* Поля расчета топлива */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fuel-consumption" className="text-gray-700 dark:text-gray-200">
                Средний расход топлива
                <span className="text-gray-500 dark:text-gray-400 ml-2">литров/100 км.</span>
              </Label>
              <Input
                id="fuel-consumption"
                type="number"
                step="0.1"
                placeholder=""
                value={fuelConsumption}
                onChange={(e) => setFuelConsumption(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-price" className="text-gray-700 dark:text-gray-200">
                Цена 1 литра топлива
              </Label>
              <div className="flex gap-2">
                <Input
                  id="fuel-price"
                  type="number"
                  step="0.01"
                  placeholder=""
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  className="flex-1"
                />
                <SelectCurrency currency={currency} setCurrency={setCurrency} />
              </div>
            </div>
          </div>

          {/* Кнопка показать результат */}
          <Button
            onClick={fetchRoute}
            disabled={!startPlace || !endPlace || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            size="lg"
          >
            {loading ? 'Загрузка...' : 'ПОКАЗАТЬ РЕЗУЛЬТАТ'}
          </Button>

          {/* Результаты расчета */}
          {totalDistance && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Расстояние:</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {totalDistance.toFixed(1)} км
                </span>
              </div>
              {totalFuelCost && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Стоимость топлива:</span>
                  <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {totalFuelCost.toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Карта - всегда видна */}
      <div className="w-full h-[600px]">
        <RouteMap
          start={startPlace}
          end={endPlace}
          waypoints={waypoints}
          route={route}
        />
      </div>
    </div>
  );
};

export const CalculationByCities = memo(CalculationByCitiesComponent);