"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, User, X, ArrowUpDown, Package, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { updateRoute } from '@/shared/api/routes';
import { companionCargoApi, CompanionCargo } from '@/shared/api/companion-cargo';
import { buildCompanionRoute } from '@/shared/api/osrm';
import { showToast, handleApiError } from '@/lib/toast';

interface Route {
  id_routes: number;
  id_cars?: number | null;
  id_company: string;
  created_by: string;
  id_driver?: string | null;
  departure_point: string;
  arrival_point: string;
  date_start?: string;
  opisanie?: string | null;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Array<{ place_id: number; name: string; lat: number; lon: number }> }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  id_user: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

interface CarRoutesProps {
  routes: Route[];
  companyUsers: CompanyUser[];
  onRouteUpdate?: () => void;
  onDragEnd: () => void;
}

type SortField = 'driver' | 'date' | 'route' | 'none';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export function CarRoutes({
  routes,
  companyUsers,
  onRouteUpdate,
  onDragEnd,
}: CarRoutesProps) {
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [dragOverRouteId, setDragOverRouteId] = useState<number | null>(null);
  const [updatingRouteId, setUpdatingRouteId] = useState<number | null>(null);
  const [searchingRouteId, setSearchingRouteId] = useState<number | null>(null);
  const [companionCargos, setCompanionCargos] = useState<CompanionCargo[]>([]);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [currentRouteForSearch, setCurrentRouteForSearch] = useState<Route | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Сортировка маршрутов
  const sortedRoutes = useMemo(() => {
    if (sortField === 'none') return routes;

    const sorted = [...routes].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'driver': {
          const driverA = a.id_driver 
            ? companyUsers.find(u => u.id_user === a.id_driver)
            : null;
          const driverB = b.id_driver 
            ? companyUsers.find(u => u.id_user === b.id_driver)
            : null;
          
          const nameA = driverA 
            ? `${driverA.firstName || ''} ${driverA.lastName || ''}`.trim() || driverA.email
            : '';
          const nameB = driverB 
            ? `${driverB.firstName || ''} ${driverB.lastName || ''}`.trim() || driverB.email
            : '';
          
          comparison = nameA.localeCompare(nameB, 'ru');
          break;
        }
        case 'date': {
          const dateA = a.date_start ? new Date(a.date_start).getTime() : 0;
          const dateB = b.date_start ? new Date(b.date_start).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'route': {
          const routeA = `${a.departure_point} → ${a.arrival_point}`;
          const routeB = `${b.departure_point} → ${b.arrival_point}`;
          comparison = routeA.localeCompare(routeB, 'ru');
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [routes, sortField, sortOrder, companyUsers]);

  // Пагинация
  const displayedRoutes = useMemo(() => {
    return sortedRoutes.slice(0, displayedCount);
  }, [sortedRoutes, displayedCount]);

  const hasMore = displayedCount < sortedRoutes.length;

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore]);

  // Сброс пагинации при изменении сортировки
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [sortField, sortOrder]);


  const handleDragOver = (e: React.DragEvent, routeId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRouteId(routeId);
  };

  const handleDragLeave = () => {
    setDragOverRouteId(null);
  };

  const handleDrop = async (e: React.DragEvent, routeId: number) => {
    e.preventDefault();
    const driverId = e.dataTransfer.getData('text/plain');
    setDragOverRouteId(null);

    if (!driverId) return;

    setUpdatingRouteId(routeId);
    try {
      const response = await updateRoute(routeId, { id_driver: driverId });
      if (response.ok !== false) {
        showToast.success('Водитель успешно назначен на маршрут');
        onRouteUpdate?.();
      } else {
        showToast.error(response.error || 'Ошибка назначения водителя');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка назначения водителя на маршрут');
    } finally {
      setUpdatingRouteId(null);
      onDragEnd();
    }
  };

  const handleRemoveDriverFromRoute = async (routeId: number) => {
    setUpdatingRouteId(routeId);
    try {
      const response = await updateRoute(routeId, { id_driver: null });
      if (response.ok !== false) {
        showToast.success('Водитель удален с маршрута');
        onRouteUpdate?.();
      } else {
        showToast.error(response.error || 'Ошибка удаления водителя');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления водителя с маршрута');
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const handleSearchCompanionCargos = async (route: Route) => {
    if (!route.places_departure || !route.places_arrival) {
      showToast.error('Недостаточно данных о маршруте для поиска попутных грузов');
      return;
    }

    setSearchingRouteId(route.id_routes);
    setCurrentRouteForSearch(route);
    setCompanionCargos([]);
    setIsCargoModalOpen(true);

    try {
      // Извлекаем place_id из places_departure и places_arrival
      const departureKeys = Object.keys(route.places_departure);
      const arrivalKeys = Object.keys(route.places_arrival);

      if (departureKeys.length === 0 || arrivalKeys.length === 0) {
        showToast.error('Недостаточно данных о точках маршрута');
        return;
      }

      const departureKey = departureKeys[0];
      const arrivalKey = arrivalKeys[0];

      if (!departureKey || !arrivalKey) {
        showToast.error('Недостаточно данных о точках маршрута');
        return;
      }

      const departurePlaceId = parseInt(departureKey);
      const arrivalPlaceId = parseInt(arrivalKey);

      if (isNaN(departurePlaceId) || isNaN(arrivalPlaceId)) {
        showToast.error('Некорректные данные о точках маршрута');
        return;
      }

      const departureData = route.places_departure[departureKey];
      const arrivalData = route.places_arrival[arrivalKey];

      if (!departureData || !arrivalData) {
        showToast.error('Недостаточно координат для поиска');
        return;
      }

      // Собираем все точки маршрута для построения
      const allPoints = [
        { lat: departureData.lat, lon: departureData.lon },
      ];

      // Добавляем промежуточные точки, если есть
      const waypoints: number[] = [];
      const waypointCoords: Array<{ lat: number; lon: number }> = [];
      
      if (departureData.waypoints && departureData.waypoints.length > 0) {
        departureData.waypoints.forEach((wp: { place_id: number; lat: number; lon: number; name: string }) => {
          waypoints.push(wp.place_id);
          waypointCoords.push({ lat: wp.lat, lon: wp.lon });
          allPoints.push({ lat: wp.lat, lon: wp.lon });
        });
      }

      allPoints.push({ lat: arrivalData.lat, lon: arrivalData.lon });

      // Строим маршрут для получения геометрии и nodes
      let routeGeometry: Record<string, unknown> | undefined;
      let routeNodes: number[] | undefined;

      try {
        const routeData = await buildCompanionRoute({ points: allPoints });
        if (routeData.geometry) {
          routeGeometry = routeData.geometry as any;
        }
        if (routeData.nodes) {
          routeNodes = routeData.nodes;
        }
      } catch (error) {
        console.warn('Ошибка построения маршрута, продолжаем без геометрии:', error);
      }

      // Формируем запрос для поиска попутных грузов
      const requestBody = {
        user_route: {
          departure_place_id: departurePlaceId,
          arrival_place_id: arrivalPlaceId,
          departure_coords: { lat: departureData.lat, lon: departureData.lon },
          arrival_coords: { lat: arrivalData.lat, lon: arrivalData.lon },
          ...(waypoints.length > 0 && { waypoints, waypoint_coords: waypointCoords }),
          ...(routeGeometry && { user_route_geo: routeGeometry }),
          ...(routeNodes && { user_route_nodes: routeNodes }),
        },
        min_percent: 50, // Минимальный процент совпадения маршрута
        withRoutes: true,
        stepMeters: 800,
        toleranceMeters: 2000,
      };

      const response = await companionCargoApi.findCompanionCargos(requestBody);
      setCompanionCargos(response.items || []);

      if (!response.items || response.items.length === 0) {
        showToast.info('Попутные грузы не найдены для этого маршрута');
      } else {
        showToast.success(`Найдено попутных грузов: ${response.items.length}`);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка поиска попутных грузов');
      setIsCargoModalOpen(false);
    } finally {
      setSearchingRouteId(null);
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '—';
    if (meters < 1000) return `${Math.round(meters)} м`;
    return `${(meters / 1000).toFixed(1)} км`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (routes.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground mb-2">Нет маршрутов для этого автомобиля</p>
        <p className="text-sm text-muted-foreground">Маршруты будут отображаться здесь после их создания</p>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок и сортировка */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Маршруты автомобиля
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {routes.length} {routes.length === 1 ? 'маршрут' : routes.length < 5 ? 'маршрута' : 'маршрутов'}
          </span>
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field as SortField);
              setSortOrder(order as SortOrder);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <SelectValue placeholder="Сортировка" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none-desc">Без сортировки</SelectItem>
              <SelectItem value="date-desc">
                По дате (новые сначала) ↓
              </SelectItem>
              <SelectItem value="date-asc">
                По дате (старые сначала) ↑
              </SelectItem>
              <SelectItem value="driver-asc">
                По водителю (А-Я) ↑
              </SelectItem>
              <SelectItem value="driver-desc">
                По водителю (Я-А) ↓
              </SelectItem>
              <SelectItem value="route-asc">
                По маршруту (А-Я) ↑
              </SelectItem>
              <SelectItem value="route-desc">
                По маршруту (Я-А) ↓
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Список маршрутов */}
      <div className="space-y-4">
        {displayedRoutes.map((route) => {
          const driver = route.id_driver ? companyUsers.find((u) => u.id_user === route.id_driver) : null;
          const isDragOver = dragOverRouteId === route.id_routes;
          const isUpdating = updatingRouteId === route.id_routes;

          return (
            <div
              key={route.id_routes}
              onDragOver={(e) => handleDragOver(e, route.id_routes)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, route.id_routes)}
              className={`border rounded-lg p-4 transition-all ${
                isDragOver
                  ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                  : 'border-border hover:shadow-md'
              } ${isUpdating ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">{route.departure_point}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">{route.arrival_point}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        {route.date_start && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(route.date_start)}</span>
                          </div>
                        )}

                        {driver ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-orange-500" />
                            <span className="text-foreground font-medium">
                              Водитель: {driver.firstName || driver.lastName
                                ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                                : driver.email}
                            </span>
                            <button
                              onClick={() => handleRemoveDriverFromRoute(route.id_routes)}
                              disabled={isUpdating}
                              className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                              title="Удалить водителя с маршрута"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Перетащите водителя сюда</span>
                          </div>
                        )}
                      </div>

                      {route.opisanie && (
                        <p className="text-sm text-muted-foreground mt-2">{route.opisanie}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Кнопка поиска попутных грузов */}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchCompanionCargos(route)}
                      disabled={searchingRouteId === route.id_routes || !route.places_departure || !route.places_arrival}
                      className="w-full sm:w-auto"
                    >
                      {searchingRouteId === route.id_routes ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Поиск...
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 mr-2" />
                          Найти попутные грузы
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Модальное окно с результатами поиска попутных грузов */}
      <Dialog open={isCargoModalOpen} onOpenChange={setIsCargoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Попутные грузы
            </DialogTitle>
            <DialogDescription>
              {currentRouteForSearch && (
                <span>
                  Для маршрута: <strong>{currentRouteForSearch.departure_point}</strong> → <strong>{currentRouteForSearch.arrival_point}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {searchingRouteId ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : companionCargos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Попутные грузы не найдены</p>
              <p className="text-sm text-muted-foreground mt-2">
                Попробуйте изменить параметры поиска или проверить маршрут
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {companionCargos.map((cargo) => (
                <div
                  key={cargo.id_cargo}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{cargo.departure_point}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">{cargo.arrival_point}</span>
                        {cargo.match_percent && (
                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            {Math.round(cargo.match_percent)}% совпадение
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {cargo.date_start && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(cargo.date_start)}</span>
                          </div>
                        )}
                        
                        {cargo.tonn && (
                          <span>Вес: {cargo.tonn} т</span>
                        )}
                        
                        {cargo.m3 && (
                          <span>Объем: {cargo.m3} м³</span>
                        )}
                        
                        {cargo.price && (
                          <span className="font-medium text-foreground">Цена: {cargo.price} ₽</span>
                        )}
                      </div>

                      {cargo.route && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span>Расстояние: {formatDistance(cargo.route.distance)}</span>
                          <span>Время: {formatDuration(cargo.route.duration)}</span>
                        </div>
                      )}

                      {cargo.opisanie && (
                        <p className="text-sm text-muted-foreground mt-2">{cargo.opisanie}</p>
                      )}

                      {cargo.company && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm font-medium text-foreground">{cargo.company.name}</p>
                          <p className="text-xs text-muted-foreground">{cargo.company.tel_1}</p>
                          {cargo.company.email && (
                            <p className="text-xs text-muted-foreground">{cargo.company.email}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Индикатор загрузки для infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

