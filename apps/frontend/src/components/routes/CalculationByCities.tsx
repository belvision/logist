'use client';

import { useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { Plus, MapPin } from 'lucide-react';
// @ts-ignore - RouteMap dynamic import for Leaflet SSR handling
import { RouteMap } from './RouteMap';
import { buildRoute } from '@/shared/api/osrm';
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
      
      const data = await buildRoute({
        points: points.map(p => ({ lat: p.lat, lon: p.lon })),
      });
      
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
      <Card className="border-border">
        <CardContent className="p-6 space-y-6">
          {/* Заголовок */}
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            РАСЧЕТ ПО ГОРОДАМ
          </div>

          {/* Поля выбора городов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from-city" className="text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Откуда
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
              {startPlace && (
                <p className="text-xs text-muted-foreground mt-1">
                  Выбрано: {startPlace.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-city" className="text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-destructive" />
                Куда
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
              {endPlace && (
                <p className="text-xs text-muted-foreground mt-1">
                  Выбрано: {endPlace.name}
                </p>
              )}
            </div>
          </div>

          {/* Промежуточные точки */}
          {waypoints.length > 0 && (
            <div className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">
                      Через город №{index + 1}:
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWaypoint(index)}
                      className="text-destructive hover:text-destructive h-auto p-1"
                    >
                      Удалить
                    </Button>
                  </div>
                  <Input
                    value={waypoint.name}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления промежуточных точек */}
          {showWaypointInput && (
            <div className="space-y-3 p-4 bg-accent/10 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">
                  Промежуточные точки
                  {waypoints.length > 0 && (
                    <span className="ml-2 text-xs text-accent bg-accent/20 px-2 py-0.5 rounded-full">
                      {waypoints.length} {waypoints.length === 1 ? 'точка' : waypoints.length < 5 ? 'точки' : 'точек'}
                    </span>
                  )}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWaypointInput(false)}
                  className="text-muted-foreground hover:text-foreground h-auto p-1"
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
              <p className="text-xs text-muted-foreground">
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
              className="border-dashed w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить промежуточные точки
              {waypoints.length > 0 && (
                <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                  {waypoints.length}
                </span>
              )}
            </Button>
          )}

          {/* Поля расчета топлива */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fuel-consumption" className="text-foreground">
                Средний расход топлива
                <span className="text-muted-foreground ml-2">литров/100 км.</span>
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
              <Label htmlFor="fuel-price" className="text-foreground">
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
            className="w-full"
            size="lg"
          >
            {loading ? 'Загрузка...' : 'ПОКАЗАТЬ РЕЗУЛЬТАТ'}
          </Button>

          {/* Результаты расчета */}
          {totalDistance && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Расстояние:</span>
                <span className="font-semibold text-lg text-foreground">
                  {totalDistance.toFixed(1)} км
                </span>
              </div>
              {totalFuelCost && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Стоимость топлива:</span>
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