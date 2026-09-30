"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarIcon, MapPin, Car, Trash2, Navigation, Route, User } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { handleApiError, showToast } from '@/lib/toast';
import { deleteRoute } from '@/shared/api/routes';
import { getCompanyCars } from '@/shared/api/cars';
import { getCompanyRoutes } from '@/shared/api/routes';
import { getCompanyUsers } from '@/shared/api/company';
import { useParams } from 'next/navigation';
import { AddRouteModal } from './AddRouteModal';

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
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Place[] }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
  created_at: string;
  updated_at: string;
}

interface RoutesProps {
  onRefreshReady?: (refreshFn: () => Promise<void>) => void;
}

export const Routes = ({ onRefreshReady }: RoutesProps = {}) => {
  const params = useParams();
  const companyId = params?.['company_id'] as string;
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  console.log(routes, 'routes');

  const fetchData = useCallback(async () => {
    console.log(routes, 'routes');
    // const companyId = params?.['company_id'] as string;

    ``

    if (!companyId) return;
    setLoading(true);
    try {
      const [carsResponse, routesResponse, usersResponse] = await Promise.all([
        getCompanyCars(companyId),
        getCompanyRoutes(companyId),
        getCompanyUsers(companyId),
      ]);

      if (carsResponse.ok && Array.isArray(carsResponse.data)) {
        setCars(carsResponse.data);
      }
      
      if (routesResponse && Array.isArray(routesResponse.items)) {
        setRoutes(routesResponse.items);
      }

      if (usersResponse?.data?.users && Array.isArray(usersResponse.data.users)) {
        setUsers(usersResponse.data.users);
      }

    } catch (error) {
      handleApiError(error, 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Передаем функцию обновления наверх
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(fetchData);
    }
  }, [onRefreshReady, fetchData]);

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;

    setLoading(true);
    
    try {
      await deleteRoute(routeToDelete.id_routes);
      setRoutes(prev => prev.filter(route => route.id_routes !== routeToDelete.id_routes));
      setIsDeleteModalOpen(false);
      setRouteToDelete(null);
      showToast.success('Маршрут успешно удален!');
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

  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const getWaypointsFromRoute = (route: Route): Place[] => {
    if (!route.places_departure) return [];
    const firstKey = Object.keys(route.places_departure)[0];
    if (!firstKey) return [];
    const placeData = route.places_departure[firstKey];
    if (!placeData) return [];
    return placeData.waypoints || [];
  };

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Route className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Нет маршрутов</h3>
            <p className="text-muted-foreground">Добавьте свой первый маршрут</p>
            <Button onClick={openAddModal} className="mt-4">
              Добавить маршрут
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => {
            const routeWaypoints = getWaypointsFromRoute(route);
            const car = cars.find(c => c.id_cars === route.id_cars);
            const driver = route.id_driver ? users.find((u: any) => u.id_user === route.id_driver) : null;
            
            return (
              <div key={route.id_routes} className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
                {/* Route Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{route.departure_point}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-destructive flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{route.arrival_point}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="space-y-3 border-t border-border pt-4">
                  {car && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Автомобиль
                      </span>
                      <span className="font-medium text-sm">{car.title}</span>
                    </div>
                  )}
                  {driver && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Водитель
                      </span>
                      <span className="font-medium text-sm">
                        {driver.firstName || driver.lastName 
                          ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                          : driver.email}
                      </span>
                    </div>
                  )}
                  {route.date_start && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Дата отправления
                      </span>
                      <span className="font-medium text-sm">
                        {format(new Date(route.date_start), 'dd.MM.yyyy', { locale: ru })}
                      </span>
                    </div>
                  )}
                  {route.opisanie && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Описание</p>
                      <p className="text-sm text-foreground">{route.opisanie}</p>
                    </div>
                  )}
                  {routeWaypoints.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Промежуточные точки</p>
                      <div className="flex flex-wrap gap-1">
                        {routeWaypoints.map((wp, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
                            {idx + 1}. {wp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => openDeleteModal(route)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно для добавления маршрута */}
      <AddRouteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        companyId={companyId}
      />

      {/* Модальное окно для удаления маршрута */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Удалить маршрут
            </DialogTitle>
          </DialogHeader>
          
          {routeToDelete && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-foreground">
                    {routeToDelete.departure_point}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <MapPin className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-foreground">
                    {routeToDelete.arrival_point}
                  </span>
                </div>
                {routeToDelete.opisanie && (
                  <p className="text-sm text-muted-foreground mb-2 italic">{routeToDelete.opisanie}</p>
                )}
                {routeToDelete.date_start && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(routeToDelete.date_start), 'dd MMMM yyyy', { locale: ru })}
                  </p>
                )}
              </div>
              
              <p className="text-sm text-foreground">
                ⚠️ Вы уверены, что хотите удалить этот маршрут? Это действие нельзя отменить.
              </p>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleDeleteRoute}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
