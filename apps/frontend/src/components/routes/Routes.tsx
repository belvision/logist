"use client";

import React, { useState, useEffect } from 'react';
import { Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, Popover, PopoverTrigger, PopoverContent } from '@/components/ui';
import { CalendarIcon, Plus, MapPin, Car, Trash2, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { handleApiError, showToast } from '@/lib/toast';
import { getCookie } from 'cookies-next';
import { API_BASE } from '@/lib/config';
import { getCompanyCars } from '@/shared/api/cars';
import { getCompanyRoutes } from '@/shared/api/routes';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { WaypointSearch } from '@/components/cargo/WaypointSearch';
import { DayPicker } from 'react-day-picker';
import '@/styles/calendar.css';

interface Car {
  id_cars: number;
  title: string;
  tonn_min: number;
  tonn_max: number;
  m3_min: number;
  m3_max: number;
  id_car_type: number;
  id_tip_zagryzki: number;
}

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteFormData {
  id_cars?: number;
  departure_point: string;
  arrival_point: string;
  date_start?: Date | undefined;
  opisanie?: string;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Place[] }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
}

interface Route {
  id_routes: number;
  id_cars?: number | null;
  id_company: string;
  created_by: string;
  departure_point: string;
  arrival_point: string;
  date_start?: string;
  opisanie?: string | null;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Place[] }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
  created_at: string;
  updated_at: string;
}

interface RoutesProps {
  companyId: string;
}

export const Routes = ({ companyId }: RoutesProps) => {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  // Состояния для локаций
  const [selectedDeparturePlace, setSelectedDeparturePlace] = useState<Place | null>(null);
  const [selectedArrivalPlace, setSelectedArrivalPlace] = useState<Place | null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);

  const [formData, setFormData] = useState<RouteFormData>({
    departure_point: '',
    arrival_point: '',
    opisanie: '',
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      const [carsResponse, routesResponse] = await Promise.all([
        getCompanyCars(companyId),
        getCompanyRoutes(companyId),
      ]);

      if (carsResponse.ok && Array.isArray(carsResponse.data)) {
        setCars(carsResponse.data);
      }
      
      if (routesResponse && Array.isArray(routesResponse.items)) {
        setRoutes(routesResponse.items);
      }

    } catch (error) {
      handleApiError(error, 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleDeparturePick = (place: Place) => {
    setSelectedDeparturePlace(place);
    setFormData(prev => ({
      ...prev,
      departure_point: place.name,
      places_departure: {
        [place.place_id]: {
          lat: place.lat,
          lon: place.lon,
          waypoints: waypoints.length > 0 ? waypoints : undefined
        }
      }
    }));
  };

  const handleArrivalPick = (place: Place) => {
    setSelectedArrivalPlace(place);
    setFormData(prev => ({
      ...prev,
      arrival_point: place.name,
      places_arrival: {
        [place.place_id]: {
          lat: place.lat,
          lon: place.lon
        }
      }
    }));
  };

  const handleAddWaypoint = (place: Place) => {
    setWaypoints(prev => {
      const newWaypoints = [...prev, place];
      // Обновляем formData с новыми waypoints
      if (selectedDeparturePlace) {
        setFormData(current => ({
          ...current,
          places_departure: {
            [selectedDeparturePlace.place_id]: {
              lat: selectedDeparturePlace.lat,
              lon: selectedDeparturePlace.lon,
              waypoints: newWaypoints
            }
          }
        }));
      }
      return newWaypoints;
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(prev => {
      const newWaypoints = prev.filter((_, i) => i !== index);
      // Обновляем formData
      if (selectedDeparturePlace) {
        setFormData(current => ({
          ...current,
          places_departure: {
            [selectedDeparturePlace.place_id]: {
              lat: selectedDeparturePlace.lat,
              lon: selectedDeparturePlace.lon,
              waypoints: newWaypoints.length > 0 ? newWaypoints : undefined
            }
          }
        }));
      }
      return newWaypoints;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar) {
      showToast.error('Выберите автомобиль');
      return;
    }

    if (!formData.departure_point || !formData.arrival_point) {
      showToast.error('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    
    try {
      const token = getCookie('access_token');
      const routeData = {
        id_cars: selectedCar?.id_cars,
        departure_point: formData.departure_point,
        arrival_point: formData.arrival_point,
        date_start: formData.date_start?.toISOString(),
        opisanie: formData.opisanie,
        places_departure: formData.places_departure,
        places_arrival: formData.places_arrival,
      };

      const response = await fetch(`${API_BASE}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(routeData),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.route) {
          setRoutes(prev => [responseData.route, ...prev]);
        }
        
        resetForm();
        setIsAddModalOpen(false);
        showToast.success('Маршрут успешно создан!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания маршрута');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка создания маршрута');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;

    setLoading(true);
    
    try {
      const token = getCookie('access_token');
      const response = await fetch(`${API_BASE}/api/routes/${routeToDelete.id_routes}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (response.ok) {
        setRoutes(prev => prev.filter(route => route.id_routes !== routeToDelete.id_routes));
        setIsDeleteModalOpen(false);
        setRouteToDelete(null);
        showToast.success('Маршрут успешно удален!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления маршрута');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления маршрута');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (route: Route) => {
    setRouteToDelete(route);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      departure_point: '',
      arrival_point: '',
      opisanie: '',
    });
    setSelectedDeparturePlace(null);
    setSelectedArrivalPlace(null);
    setWaypoints([]);
    setSelectedCar(null);
  };

  const getWaypointsFromRoute = (route: Route): Place[] => {
    if (!route.places_departure) return [];
    const firstKey = Object.keys(route.places_departure)[0];
    if (!firstKey) return [];
    const placeData = route.places_departure[firstKey];
    return placeData.waypoints || [];
  };

  return (
    <div className="space-y-6">
      {/* Список существующих маршрутов */}
      <Card className="p-6 bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <MapPin className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Маршруты
              </h2>
              {routes.length > 0 && (
                <p className="text-sm text-gray-400">Всего: {routes.length}</p>
              )}
            </div>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => resetForm()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить маршрут
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-blue-400" />
                  Создать новый маршрут
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Выбор автомобиля */}
                <div className="space-y-2">
                  <Label htmlFor="car" className="text-white font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-400" />
                    Автомобиль *
                  </Label>
                  {cars.length > 0 ? (
                    <>
                      <Select 
                        value={selectedCar?.id_cars.toString() || ''} 
                        onValueChange={(value) => {
                          const car = cars.find(c => c.id_cars.toString() === value);
                          setSelectedCar(car || null);
                        }}
                        required
                      >
                        <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700">
                          <SelectValue placeholder="Выберите автомобиль *" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {cars.map((car) => (
                            <SelectItem 
                              key={car.id_cars} 
                              value={car.id_cars.toString()}
                              className="text-white hover:bg-gray-700"
                            >
                              {car.title || `Автомобиль #${car.id_cars}`} 
                              ({car.tonn_min}-{car.tonn_max}т, {car.m3_min}-{car.m3_max}м³)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCar && (
                        <p className="text-xs text-gray-400 mt-1">
                          Вес: {selectedCar.tonn_min}-{selectedCar.tonn_max}т • Объем: {selectedCar.m3_min}-{selectedCar.m3_max}м³
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-400 text-sm">
                      ⚠️ Автомобили не найдены. Сначала добавьте автомобили в автопарк.
                    </div>
                  )}
                </div>

                {/* Остальные поля показываются только после выбора автомобиля */}
                {selectedCar ? (
                  <>
                    {/* Точка отправления */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-400" />
                    Точка отправления *
                  </Label>
                  <LocationSearchBox
                    id="departure"
                    onPick={handleDeparturePick}
                    placeholder="Введите город или адрес отправления"
                    value={formData.departure_point}
                  />
                </div>

                {/* Промежуточные точки */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-400" />
                    Промежуточные точки (необязательно)
                  </Label>
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <WaypointSearch
                      onAdd={handleAddWaypoint}
                      waypoints={waypoints}
                      onRemove={handleRemoveWaypoint}
                    />
                  </div>
                </div>

                {/* Точка прибытия */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400" />
                    Точка прибытия *
                  </Label>
                  <LocationSearchBox
                    id="arrival"
                    onPick={handleArrivalPick}
                    placeholder="Введите город или адрес прибытия"
                    value={formData.arrival_point}
                  />
                </div>

                {/* Дата отправления с Popover */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-purple-400" />
                    Дата отправления
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 hover:text-white",
                          !formData.date_start && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_start ? (
                          format(formData.date_start, "PPP", { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                      <DayPicker
                        mode="single"
                        selected={formData.date_start}
                        onSelect={(date) => setFormData(prev => ({ ...prev, date_start: date || undefined }))}
                        locale={ru}
                        className="!bg-transparent"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Описание */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white font-semibold">
                    Описание маршрута
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.opisanie || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, opisanie: e.target.value }))}
                    placeholder="Дополнительная информация о маршруте..."
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px] focus:border-blue-500"
                  />
                </div>

                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 bg-gray-700/30 rounded-full mb-4">
                      <Car className="h-12 w-12 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      Выберите автомобиль, для которого создаете маршрут
                    </p>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedCar || !formData.departure_point || !formData.arrival_point}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Создание...' : 'Создать маршрут'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {routes.length > 0 ? (
          <div className="space-y-4">
            {routes.map((route) => {
              const routeWaypoints = getWaypointsFromRoute(route);
              return (
                <div key={route.id_routes} className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition-all shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-red-500/20 rounded-lg border border-gray-600">
                          <MapPin className="h-4 w-4 text-green-400" />
                          <span className="text-white font-semibold text-lg">
                            {route.departure_point}
                          </span>
                          <span className="text-gray-400">→</span>
                          <MapPin className="h-4 w-4 text-red-400" />
                          <span className="text-white font-semibold text-lg">
                            {route.arrival_point}
                          </span>
                        </div>
                      </div>

                      {routeWaypoints.length > 0 && (
                        <div className="flex items-start gap-2 ml-4">
                          <Navigation className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-xs text-gray-400 font-medium">Промежуточные точки:</p>
                            <div className="flex flex-wrap gap-2">
                              {routeWaypoints.map((wp, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                                  {idx + 1}. {wp.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {route.opisanie && (
                        <p className="text-gray-300 text-sm ml-4 italic">{route.opisanie}</p>
                      )}

                      <div className="flex flex-wrap gap-4 ml-4 text-xs">
                        {route.date_start && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 rounded border border-purple-500/30">
                            <CalendarIcon className="h-3 w-3 text-purple-400" />
                            <span className="text-purple-300">
                              {format(new Date(route.date_start), 'dd MMMM yyyy', { locale: ru })}
                            </span>
                          </div>
                        )}
                        {route.id_cars && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30">
                            <Car className="h-3 w-3 text-blue-400" />
                            <span className="text-blue-300">
                              {cars.find(car => car.id_cars === route.id_cars)?.title || `Авто #${route.id_cars}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 text-gray-500 text-xs ml-4">
                        <span>Создан: {format(new Date(route.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                        {route.updated_at !== route.created_at && (
                          <span>Обновлен: {format(new Date(route.updated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(route)}
                      className="bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex p-6 bg-gray-700/30 rounded-full mb-4">
              <MapPin className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">Маршруты не найдены</p>
            <p className="text-gray-500 text-sm">Создайте первый маршрут, нажав кнопку "Добавить маршрут"</p>
          </div>
        )}
      </Card>

      {/* Модальное окно для удаления маршрута */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Удалить маршрут
            </DialogTitle>
          </DialogHeader>
          
          {routeToDelete && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <span className="text-white font-medium">
                    {routeToDelete.departure_point}
                  </span>
                  <span className="text-gray-400">→</span>
                  <MapPin className="h-4 w-4 text-red-400" />
                  <span className="text-white font-medium">
                    {routeToDelete.arrival_point}
                  </span>
                </div>
                {routeToDelete.opisanie && (
                  <p className="text-gray-300 text-sm mb-2 italic">{routeToDelete.opisanie}</p>
                )}
                {routeToDelete.date_start && (
                  <p className="text-gray-400 text-xs flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(routeToDelete.date_start), 'dd MMMM yyyy', { locale: ru })}
                  </p>
                )}
              </div>
              
              <p className="text-gray-300 text-sm">
                ⚠️ Вы уверены, что хотите удалить этот маршрут? Это действие нельзя отменить.
              </p>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Отмена
            </Button>
            <Button
              onClick={handleDeleteRoute}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
