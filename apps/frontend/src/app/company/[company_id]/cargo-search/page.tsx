'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchBox } from '@/components/cargo-search/SearchBox';
import { WaypointSearch } from '@/components/cargo-search/WaypointSearch';
import { MapCanvas } from '@/components/cargo-search/MapCanvas';
import { SimilarList } from '@/components/cargo-search/SimilarList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Route, Package, X, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { companionCargoApi } from '@/shared/api/companion-cargo';
import { buildRouteAuth } from '@/shared/api/osrm';
import { usePageHeader } from '@/shared/context/page-header-context';
import { useAuth } from '@/shared/context/auth-context';

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: { coordinates: number[][] };
  departure_point: string;
  arrival_point: string;
  nodes?: number[];
}

interface CompanionCargo {
  id_cargo: number;
  departure_place_id: number;
  arrival_place_id: number;
  departure_point: string;
  arrival_point: string;
  tonn?: number;
  m3?: number;
  car_type?: string;
  price?: string;
  opisanie?: string;
  download?: string;
  period?: string;
  payment?: string;
  date_start?: string;
  date_end?: string;
  statuse: number;
  match_percent: number;
  route?: {
    distance: number;
    duration: number;
    geometry: { coordinates: number[][] };
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
}


function CargoSearchPageHeader() {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Поиск попутных грузов',
      'Найдите грузы, которые можно взять попутно по вашему маршруту',
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, [setHeader]);

  return null;
}

export default function CargoSearchPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'start' | 'end' | 'waypoint'>('start');
  const [start, setStart] = useState<Place | null>(null);
  const [end, setEnd] = useState<Place | null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);

  const [mainRoute, setMainRoute] = useState<RouteData | null>(null);
  const [isRouteBuilt, setIsRouteBuilt] = useState(false);
  const [threshold, setThreshold] = useState(50);
  const [companionCargos, setCompanionCargos] = useState<CompanionCargo[]>([]);

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [soloId, setSoloId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [savedRoutes, setSavedRoutes] = useState<Array<{
    id: number;
    departure_point: Record<string, { lat: number; lon: number; name: string }>;
    arrival_point: Record<string, { lat: number; lon: number; name: string }>;
    places_departure?: Array<Record<string, { lat: number; lon: number; name: string }>>;
  }>>([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [loadingFromSaved, setLoadingFromSaved] = useState(false);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pickPoint = async (place: Place) => {
    if (isRouteBuilt) {
      // После построения маршрута все точки добавляются как промежуточные
      const newWaypoints = [...waypoints, place];
      setWaypoints(newWaypoints);
      
      // Автоматически перестраиваем маршрут с новой промежуточной точкой
      if (start && end) {
        // console.log('Auto-rebuilding route with new waypoint...');
        await buildMainRouteWithWaypoints(newWaypoints);
      }
    } else {
      // До построения маршрута работаем с начальной и конечной точками
      if (mode === 'start') {
        setStart(place);
        setMode('end');
      } else if (mode === 'end') {
        setEnd(place);
      }
    }
  };

  const buildMainRoute = async () => {
    await buildMainRouteWithWaypoints(waypoints);
  };

  const startProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setSearchLoading(true);
    setSearchProgress(1);
    progressTimerRef.current = setInterval(() => {
      setSearchProgress((prev) => {
        const aim = 90;
        if (prev >= aim) return prev;
        return Math.min(aim, prev + Math.max(0.4, (aim - prev) * 0.1));
      });
    }, 120);
  };

  const finishProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setSearchProgress(100);
    setTimeout(() => {
      setSearchLoading(false);
      setSearchProgress(0);
    }, 350);
  };

  const failProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setSearchLoading(false);
    setSearchProgress(0);
  };

  const findCompanionCargos = async () => {
    if (!start || !end) {
      setError('Сначала укажите точки и постройте маршрут');
      return;
    }
    if (!mainRoute) {
      setError('Маршрут не построен. Нажмите «Построить».');
      return;
    }

    setLoading(true);
    setError('');
    setCompanionCargos([]);
    setOpenId(null);

    startProgress();

    try {
      // Определяем, есть ли промежуточные точки
      const hasWaypoints = waypoints.length > 0;
      
      const requestBody: {
        user_route: {
          departure_place_id: number;
          arrival_place_id: number;
          departure_coords?: { lat: number; lon: number };
          arrival_coords?: { lat: number; lon: number };
          waypoints?: number[];
          waypoint_coords?: Array<{ lat: number; lon: number }>;
          user_route_geo?: Record<string, unknown>;
          user_route_nodes?: number[];
        };
        min_percent: number;
        withRoutes?: boolean;
        stepMeters?: number;
        toleranceMeters?: number;
      } = {
        user_route: {
          departure_place_id: start.place_id,
          arrival_place_id: end.place_id,
          departure_coords: { lat: start.lat, lon: start.lon },
          arrival_coords: { lat: end.lat, lon: end.lon },
        },
        min_percent: threshold,
        withRoutes: true,
        stepMeters: 800,
        toleranceMeters: 2000,
      };

            // Всегда передаём геометрию маршрута для более точного поиска
            requestBody.user_route.user_route_geo = mainRoute.geometry;
            requestBody.user_route.user_route_nodes = mainRoute.nodes || [];

            // Если есть промежуточные точки, добавляем их
            if (hasWaypoints) {
              requestBody.user_route.waypoints = waypoints.map(wp => wp.place_id);
              requestBody.user_route.waypoint_coords = waypoints.map(wp => ({ lat: wp.lat, lon: wp.lon }));
            }
      
      const data = await companionCargoApi.findCompanionCargos(requestBody);
      setCompanionCargos(data.items || []);

      const allIds = new Set<string>((data.items || []).map((item: CompanionCargo) => String(item.id_cargo)));
      setVisibleIds(allIds);
      setSoloId(null);

      if (!data.items || data.items.length === 0) {
        setError('Попутные грузы не найдены — попробуйте другой процент или маршрут.');
      }

      finishProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка поиска попутных грузов');
      failProgress();
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательная функция для построения маршрута с явно переданными точками
  const buildRouteWithPoints = async (
    startPoint: Place,
    endPoint: Place,
    waypointsToUse: Place[]
  ) => {
    setLoading(true);
    setError('');

    try {
      // Строим маршрут с промежуточными точками
      const allPoints = [startPoint, ...waypointsToUse, endPoint];
            const requestBody = {
              points: allPoints.map(p => ({ lat: p.lat, lon: p.lon })),
            };

      const routeData = await buildRouteAuth(requestBody);
      
      // OSRM API возвращает данные в формате {ok: true, data: {...}}
      if (!routeData.ok || !routeData.data) {
        console.error('BuildRoute error in response:', routeData);
        throw new Error(routeData.error || 'Ошибка построения маршрута');
      }

      const data = routeData.data;
      if (!data.distance || !data.geometry) {
        console.error('BuildRoute error in data:', data);
        throw new Error('Ошибка построения маршрута');
      }

      const route: RouteData = {
        distance: data.distance,
        duration: data.duration,
        geometry: data.geometry,
        departure_point: startPoint.name,
        arrival_point: endPoint.name,
        nodes: data.nodes,
      };

      setMainRoute(route);
      setIsRouteBuilt(true);
      setCompanionCargos([]);
      setVisibleIds(new Set());
      setFocusId(null);
      setSoloId(null);
    } catch (err) {
      console.error('Error building main route:', err);
      setError(err instanceof Error ? err.message : 'Ошибка построения маршрута');
    } finally {
      setLoading(false);
    }
  };

  const buildMainRouteWithWaypoints = async (waypointsToUse: Place[], skipValidation = false) => {
    if (!skipValidation && (!start || !end)) {
      setError('Укажите начальную и конечную точки.');
      return;
    }

    // Если точки не установлены, но это загрузка из сохранённого маршрута, не продолжаем
    if (!start || !end) {
      return;
    }

    // Используем вспомогательную функцию с точками из состояния
    await buildRouteWithPoints(start, end, waypointsToUse);
  };

  const clearAll = () => {
    setMode('start');
    setStart(null);
    setEnd(null);
    setWaypoints([]);
    setThreshold(50);
    setMainRoute(null);
    setIsRouteBuilt(false);
    setCompanionCargos([]);
    setVisibleIds(new Set());
    setOpenId(null);
    setFocusId(null);
    setSoloId(null);
    setError('');
    failProgress();
  };

  const handleSoloToggle = (id: string) => {
    if (soloId && soloId === id) {
      setSoloId(null);
      const allIds = new Set(companionCargos.map((item) => String(item.id_cargo)));
      setVisibleIds(allIds);
    } else {
      setSoloId(id);
      setVisibleIds(new Set([id]));
    }
  };

  // Загрузка сохранённых маршрутов
  const loadSavedRoutes = async () => {
    try {
      const data = await companionCargoApi.getSavedRoutes();
      setSavedRoutes(data.routes || []);
    } catch (err) {
      console.error('Error loading saved routes:', err);
    }
  };

  // Сохранение текущего маршрута
  const saveCurrentRoute = async () => {
    if (!user) {
      setError('Необходима авторизация для сохранения маршрута');
      return;
    }

    if (!mainRoute || !start || !end) {
      setError('Нет маршрута для сохранения');
      return;
    }

    setSavingRoute(true);
    setError('');

    try {
      // Сохраняем в формате JSON, как в cargo.departure_place_id и cargo.arrival_place_id
      const departure_point: Record<string, { lat: number; lon: number; name: string }> = {
        [String(start.place_id)]: {
          lat: start.lat,
          lon: start.lon,
          name: start.name,
        },
      };

      const arrival_point: Record<string, { lat: number; lon: number; name: string }> = {
        [String(end.place_id)]: {
          lat: end.lat,
          lon: end.lon,
          name: end.name,
        },
      };

      // Сохраняем промежуточные точки в порядке следования
      const places_departure: Array<Record<string, { lat: number; lon: number; name: string }>> =
        waypoints.map(waypoint => ({
          [String(waypoint.place_id)]: {
            lat: waypoint.lat,
            lon: waypoint.lon,
            name: waypoint.name,
          },
        }));

      await companionCargoApi.saveRoute({
        departure_point,
        arrival_point,
        places_departure: places_departure.length > 0 ? places_departure : undefined,
      });

      // Перезагружаем список сохранённых маршрутов
      await loadSavedRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения маршрута');
    } finally {
      setSavingRoute(false);
    }
  };

  // Загрузка выбранного маршрута
  const loadSavedRoute = async (routeId: string) => {
    if (!user) {
      setError('Необходима авторизация для загрузки сохранённого маршрута');
      return;
    }

    const route = savedRoutes.find(r => r.id === parseInt(routeId));
    if (!route) return;

    // Загружаем точки из JSON формата (как в cargo.departure_place_id и cargo.arrival_place_id)
    try {
      // Сначала устанавливаем флаг загрузки из сохранённого, чтобы скрыть кнопку "Построить маршрут"
      setLoadingFromSaved(true);
      setLoading(true);
      setError('');

      // Очищаем предыдущий маршрут перед загрузкой нового
      setMainRoute(null);
      setIsRouteBuilt(false); // Сбрасываем флаг построения, но кнопка не покажется из-за loadingFromSaved
      setCompanionCargos([]);
      setVisibleIds(new Set());

      // Извлекаем данные начальной точки из JSON
      const depKeys = Object.keys(route.departure_point);
      if (depKeys.length === 0) {
        throw new Error('Не удалось найти точку отправления');
      }
      const depKey = depKeys[0];
      const depData = route.departure_point[depKey];
      const startPlace: Place = {
        place_id: parseInt(depKey),
        name: depData.name,
        lat: depData.lat,
        lon: depData.lon,
      };

      // Извлекаем данные конечной точки из JSON
      const arrKeys = Object.keys(route.arrival_point);
      if (arrKeys.length === 0) {
        throw new Error('Не удалось найти точку прибытия');
      }
      const arrKey = arrKeys[0];
      const arrData = route.arrival_point[arrKey];
      const endPlace: Place = {
        place_id: parseInt(arrKey),
        name: arrData.name,
        lat: arrData.lat,
        lon: arrData.lon,
      };

      // Загружаем промежуточные точки, если они есть
      const loadedWaypoints: Place[] = [];
      if (route.places_departure && route.places_departure.length > 0) {
        for (const waypointData of route.places_departure) {
          const waypointKeys = Object.keys(waypointData);
          if (waypointKeys.length > 0) {
            const waypointKey = waypointKeys[0];
            const waypointInfo = waypointData[waypointKey];
            loadedWaypoints.push({
              place_id: parseInt(waypointKey),
              name: waypointInfo.name,
              lat: waypointInfo.lat,
              lon: waypointInfo.lon,
            });
          }
        }
      }

      // Устанавливаем точки
      setStart(startPlace);
      setEnd(endPlace);
      setWaypoints(loadedWaypoints);
      setMode('start');

      // Строим маршрут сразу с переданными точками (не ждём обновления состояния React)
      // Это гарантирует, что маршрут будет построен даже если состояние ещё не обновилось
      await buildRouteWithPoints(startPlace, endPlace, loadedWaypoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки маршрута');
    } finally {
      setLoading(false);
      setLoadingFromSaved(false);
    }
  };

  // Загружаем сохранённые маршруты при монтировании компонента (только для авторизованных)
  useEffect(() => {
    if (user) {
      loadSavedRoutes();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Быстрые кнопки процентов (вместо слайдера)
  const percents = [10, 25, 50, 75, 90, 100];

  return (
    <AppLayout>
      <CargoSearchPageHeader />
      <div className="flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto py-8">
          <div className="space-y-6">
          {/* Поисковый блок */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Построение маршрута
              </CardTitle>
              {/* Информация о построенном маршруте */}
              {isRouteBuilt && mainRoute && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Откуда:</span>
                      <span className="font-medium text-foreground truncate" title={mainRoute.departure_point}>
                        {mainRoute.departure_point}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Куда:</span>
                      <span className="font-medium text-foreground truncate" title={mainRoute.arrival_point}>
                        {mainRoute.arrival_point}
                      </span>
                    </div>
                    {(mainRoute.distance || mainRoute.duration) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                        {mainRoute.distance && (
                          <span>{(mainRoute.distance / 1000).toFixed(1)} км</span>
                        )}
                        {mainRoute.distance && mainRoute.duration && <span>•</span>}
                        {mainRoute.duration && (
                          <span>{Math.round(mainRoute.duration / 60)} мин</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
          <CardContent className="space-y-4">
            {/* Выпадающий список с сохранёнными маршрутами - только для авторизованных */}
            {user && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select onValueChange={loadSavedRoute} disabled={loading}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder={savedRoutes.length === 0 ? "Нет сохранённых маршрутов" : "Выберите сохранённый маршрут"} />
                  </SelectTrigger>
                  <SelectContent>
                  {savedRoutes.length === 0 ? (
                    <SelectItem value="empty" disabled>Нет сохранённых маршрутов</SelectItem>
                  ) : (
                    savedRoutes.map((route) => {
                      // Извлекаем названия точек из JSON
                      const depKeys = Object.keys(route.departure_point);
                      const arrKeys = Object.keys(route.arrival_point);
                      const depName = depKeys.length > 0 ? route.departure_point[depKeys[0]].name : 'Неизвестно';
                      const arrName = arrKeys.length > 0 ? route.arrival_point[arrKeys[0]].name : 'Неизвестно';
                      return (
                        <SelectItem key={route.id} value={String(route.id)}>
                          {depName} → {arrName}
                        </SelectItem>
                      );
                    })
                  )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {/* Кнопки начальной и конечной точек - показываются только до построения маршрута */}
              {!isRouteBuilt && (
                <>
                  <Button
                    variant={mode === 'start' ? 'default' : 'outline'}
                    onClick={() => setMode('start')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Начальная точка
                  </Button>
                  <Button
                    variant={mode === 'end' ? 'default' : 'outline'}
                    onClick={() => setMode('end')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Конечная точка
                  </Button>
                </>
              )}
              {!isRouteBuilt && !loadingFromSaved && (
                <Button 
                  onClick={buildMainRoute} 
                  disabled={!start || !end || loading} 
                  className="flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Построить маршрут
                </Button>
              )}
              {/* Кнопка сохранения маршрута - видна только если маршрут построен и пользователь авторизован */}
              {isRouteBuilt && user && (
                <Button
                  onClick={saveCurrentRoute}
                  disabled={savingRoute || !mainRoute}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {savingRoute && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!savingRoute && <Save className="h-4 w-4" />}
                  Сохранить маршрут
                </Button>
              )}
              <Button 
                onClick={findCompanionCargos} 
                disabled={!mainRoute || loading} 
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Найти попутные грузы
              </Button>
              <Button 
                onClick={clearAll} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Очистить все
              </Button>
            </div>

            {/* Кнопки процентов совпадения */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
              <span className="text-sm font-medium text-foreground">Совпадение маршрута:</span>
              {percents.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={threshold === p ? 'default' : 'outline'}
                  onClick={() => setThreshold(p)}
                >
                  {p}%
                </Button>
              ))}
              <span className="text-xs text-muted-foreground">Текущий: {threshold}%</span>
            </div>

            {/* Поисковый блок */}
            {isRouteBuilt ? (
              // После построения маршрута показываем WaypointSearch для промежуточных точек
              <WaypointSearch onPick={pickPoint} />
            ) : (
              // До построения маршрута показываем SearchBox для начальной и конечной точек
              <div className="space-y-3">
                <SearchBox 
                  mode={mode as 'start' | 'end'} 
                  onPick={pickPoint} 
                  selectedStart={start} 
                  selectedEnd={end}
                  hideInput={start && end ? true : false} // Скрываем поле ввода если обе точки введены
                />
                {/* Информационное сообщение когда обе точки введены */}
                {start && end && !isRouteBuilt && (
                  <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Обе точки введены</p>
                      <p className="text-xs text-muted-foreground">Нажмите &quot;Построить маршрут&quot; для продолжения</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Промежуточные точки - показываются только после построения маршрута */}
            {isRouteBuilt && waypoints.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground">Промежуточные точки:</h4>
                <div className="space-y-2">
                  {waypoints.map((waypoint, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg border border-border">
                      <span className="text-sm font-medium text-foreground">{waypoint.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setWaypoints(prev => prev.filter((_, i) => i !== index))}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

          {/* Основной контент */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Карта */}
            <div className="lg:col-span-2">
              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="relative h-full">
                    {searchLoading && (
                      <div
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-150 z-50"
                        style={{ width: `${searchProgress}%` }}
                      />
                    )}
                    <MapCanvas
                      mainRoute={mainRoute ? {
                        ...mainRoute,
                        geometry: {
                          ...mainRoute.geometry,
                          type: 'LineString' as const,
                          coordinates: mainRoute.geometry.coordinates as [number, number][]
                        }
                      } : null}
                      mainStart={start}
                      mainEnd={end}
                      companionCargos={companionCargos.map(cargo => ({
                        ...cargo,
                        route: cargo.route ? {
                          distance: cargo.route.distance,
                          duration: cargo.route.duration,
                          geometry: {
                            type: 'LineString' as const,
                            coordinates: cargo.route.geometry.coordinates as [number, number][]
                          }
                        } : {
                          distance: 0,
                          duration: 0,
                          geometry: {
                            type: 'LineString' as const,
                            coordinates: [] as [number, number][]
                          }
                        }
                      }))}
                      visibleIds={visibleIds}
                      focusId={focusId}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Список похожих маршрутов */}
            <div className="lg:col-span-1">
              <Card className="h-[600px] bg-card border-border overflow-hidden pb-20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Найденные грузы ({companionCargos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full overflow-y-auto">
                  <SimilarList
                    items={companionCargos}
                    openId={openId}
                    onOpenChange={setOpenId}
                    visibleIds={visibleIds}
                    soloId={soloId}
                    onSoloToggle={handleSoloToggle}
                    onFocus={(id) => setFocusId(String(id))}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
