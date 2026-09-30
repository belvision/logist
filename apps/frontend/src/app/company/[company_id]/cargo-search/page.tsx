'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SearchBox } from '@/components/cargo-search/SearchBox';
import { WaypointSearch } from '@/components/cargo-search/WaypointSearch';
import { MapCanvas } from '@/components/cargo-search/MapCanvas';
import { SimilarList } from '@/components/cargo-search/SimilarList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Route, Home, Truck, Package, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApiAuth } from '@/shared/hooks/useApiAuth';

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

import { API_BASE } from '@/lib/config';

export default function CargoSearchPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.['company_id'] as string;
  const { fetchWithAuth } = useApiAuth();
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
          waypoints?: number[];
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
        },
        min_percent: threshold,
        withRoutes: true,
        stepMeters: 800,
        toleranceMeters: 2000,
      };

            // Если есть промежуточные точки, добавляем их и геометрию
            if (hasWaypoints) {
              requestBody.user_route.waypoints = waypoints.map(wp => wp.place_id);
              requestBody.user_route.user_route_geo = mainRoute.geometry;
              requestBody.user_route.user_route_nodes = mainRoute.nodes || []; // Передаем nodes для точного сравнения
              // console.log('Searching with waypoints:', waypoints.length, 'and nodes:', mainRoute.nodes?.length || 0);
              // console.log('Main route nodes (first 10):', mainRoute.nodes?.slice(0, 10));
              // console.log('Main route nodes (last 10):', mainRoute.nodes?.slice(-10));
            } else {
              // console.log('Searching without waypoints - using original logic');
            }
      
      const response = await fetchWithAuth(`${API_BASE}/api/companion-cargo/companion-cargos`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка поиска попутных грузов');
      }

      const data = await response.json();
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

  const buildMainRouteWithWaypoints = async (waypointsToUse: Place[]) => {
    if (!start || !end) {
      setError('Укажите начальную и конечную точки.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Строим маршрут с промежуточными точками
      const allPoints = [start, ...waypointsToUse, end];
            const requestBody = {
              points: allPoints.map(p => ({ lat: p.lat, lon: p.lon })),
            };
      
      console.log('BuildRoute request body:', requestBody);
      
      const response = await fetchWithAuth(`${API_BASE}/api/osrm/route-auth`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('BuildRoute error response:', errorData);
        throw new Error(errorData.error || 'Ошибка построения маршрута');
      }

      const routeData = await response.json();
      console.log('BuildRoute response data:', routeData);
      
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

      console.log('Building route object...');
      const route: RouteData = {
        distance: data.distance,
        duration: data.duration,
        geometry: data.geometry,
        departure_point: start.name,
        arrival_point: end.name,
        nodes: data.nodes,
      };
      console.log('Route object created:', route);

      console.log('Setting main route...');
      setMainRoute(route);
      setIsRouteBuilt(true);
      setCompanionCargos([]);
      setVisibleIds(new Set());
      setFocusId(null);
      setSoloId(null);
      console.log('Route building completed successfully');
    } catch (err) {
      console.error('Error building main route:', err);
      setError(err instanceof Error ? err.message : 'Ошибка построения маршрута');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Быстрые кнопки процентов (вместо слайдера)
  const percents = [10, 25, 50, 75, 90, 100];

  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Заголовок и навигация */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <Package className="h-10 w-10 text-green-600" />
                  Поиск попутных грузов
                </h1>
                <p className="text-lg text-gray-600">
                  Найдите грузы, которые можно взять попутно по вашему маршруту
                </p>
              </div>

              {/* Кнопки навигации */}
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push(`/company/${companyId}/main`)}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                >
                  <Home className="h-4 w-4" />
                  На главную
                </Button>
                <Button
                  onClick={() => router.push(`/company/${companyId}/car-search`)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Truck className="h-4 w-4" />
                  Поиск автомобилей
                </Button>
              </div>
            </div>
          </div>

          {/* Поисковый блок */}
          <Card className="mb-6 bg-white shadow-lg rounded-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Route className="h-6 w-6 text-green-600" />
                Построение маршрута
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Кнопки начальной и конечной точек - показываются только до построения маршрута */}
              {!isRouteBuilt && (
                <>
                  <Button
                    variant={mode === 'start' ? 'default' : 'outline'}
                    onClick={() => setMode('start')}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <MapPin className="h-4 w-4" />
                    Начальная точка
                  </Button>
                  <Button
                    variant={mode === 'end' ? 'default' : 'outline'}
                    onClick={() => setMode('end')}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <MapPin className="h-4 w-4" />
                    Конечная точка
                  </Button>
                </>
              )}
              {!isRouteBuilt && (
                <Button 
                  onClick={buildMainRoute} 
                  disabled={!start || !end || loading} 
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Построить маршрут
                </Button>
              )}
              <Button 
                onClick={findCompanionCargos} 
                disabled={!mainRoute || loading} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Найти попутные грузы
              </Button>
              <Button 
                onClick={clearAll} 
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Очистить все
              </Button>
            </div>

            {/* Кнопки процентов совпадения */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
              <span className="text-sm font-medium text-gray-700">Совпадение маршрута:</span>
              {percents.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={threshold === p ? 'default' : 'outline'}
                  onClick={() => setThreshold(p)}
                  className={threshold === p 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                    : 'bg-white hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200'
                  }
                >
                  {p}%
                </Button>
              ))}
              <span className="text-xs text-gray-500">Текущий: {threshold}%</span>
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
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Обе точки введены</p>
                      <p className="text-xs text-blue-600">Нажмите "Построить маршрут" для продолжения</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Промежуточные точки - показываются только после построения маршрута */}
            {isRouteBuilt && waypoints.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700">Промежуточные точки:</h4>
                <div className="space-y-2">
                  {waypoints.map((waypoint, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-sm font-medium">{waypoint.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setWaypoints(prev => prev.filter((_, i) => i !== index))}
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
              <Card className="h-[600px] bg-white shadow-lg rounded-lg overflow-hidden">
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
              <Card className="h-[600px] bg-white shadow-lg rounded-lg overflow-hidden pb-20">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
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
    </AppLayout>
  );
}
