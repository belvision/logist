"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Car, CarType, LoadType, getCarById, getCarTypes, getLoadTypes } from '@/shared/api/cars';
import { getCompanyRoutes } from '@/shared/api/routes';
import { handleApiError } from '@/lib/toast';
import { Truck, ArrowLeft, Edit2, Trash2, User, UserPlus, X } from 'lucide-react';
import { usePageHeader } from '@/shared/context/page-header-context';
import { EditCarModal } from '@/components/cars/EditCarModal';
import { DeleteCarModal } from '@/components/cars/DeleteCarModal';
import { getCarDrivers, getCompanyDrivers, addDriverToCar, removeDriverFromCar, CarDriver, CompanyDriver } from '@/shared/api/cars';
import { getCompanyUsers } from '@/shared/api/company';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showToast } from '@/lib/toast';
import { CarRoutes } from '@/components/cars/CarRoutes';

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

function CarDetailsPageHeader({
  car,
  carType,
  loadType,
  companyId,
  onBack,
  onEdit,
  onDelete,
}: {
  car: Car | null;
  carType: string;
  loadType: string;
  companyId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    if (car) {
      const description = carType && loadType 
        ? `${carType} • ${loadType}` 
        : carType || loadType || 'Детали автомобиля';
      
      setHeader(
        car.title,
        description,
        undefined,
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к автопарку
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        </div>
      );
    } else {
      setHeader(
        'Загрузка...',
        'Загрузка данных об автомобиле',
        undefined,
        undefined
      );
    }

    return () => {
      setHeader('Автопарк', 'Найдите подходящие автомобили для ваших грузоперевозок');
    };
  }, [car, carType, loadType, companyId, onBack, onEdit, onDelete, setHeader]);

  return null;
}

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params['company_id'] as string;
  const carId = params['car_id'] as string;

  const [car, setCar] = useState<Car | null>(null);
  const [carType, setCarType] = useState<string>('');
  const [loadType, setLoadType] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [carDrivers, setCarDrivers] = useState<CarDriver[]>([]);
  const [companyDrivers, setCompanyDrivers] = useState<CompanyDriver[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverToAdd, setSelectedDriverToAdd] = useState<string>('');
  const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = async () => {
    if (!companyId || !carId) return;
    
    setLoading(true);
    try {
      const [carResponse, carTypesResponse, loadTypesResponse, usersResponse] = await Promise.all([
        getCarById(carId),
        getCarTypes(),
        getLoadTypes(),
        getCompanyUsers(companyId)
      ]);

      if (carResponse.ok && carResponse.data) {
        const carData = carResponse.data;
        setCar(carData);
        
        // Находим типы
        if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
          const type = carTypesResponse.data.find((t: CarType) => t.id_car_type === carData.id_car_type);
          if (type) setCarType(type.car_type);
        }
        
        if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
          const type = loadTypesResponse.data.find((t: LoadType) => t.id_tip_zagryzki === carData.id_tip_zagryzki);
          if (type) setLoadType(type.tip_zagryzki);
        }

        // Загружаем пользователей компании для отображения имен водителей
        if (usersResponse?.data?.users && Array.isArray(usersResponse.data.users)) {
          setCompanyUsers(usersResponse.data.users);
        }

        // Загружаем водителей автомобиля и компании
        await loadDrivers(carData.id_cars);
        
        // Загружаем маршруты отдельно
        await loadRoutes(carData.id_cars);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Отдельная функция для загрузки маршрутов
  const loadRoutes = async (carId: number) => {
    if (!companyId) return;
    
    try {
      const routesResponse = await getCompanyRoutes(companyId);
      if (routesResponse && Array.isArray(routesResponse.items)) {
        const carRoutes = routesResponse.items.filter((route: Route) => route.id_cars === carId);
        setRoutes(carRoutes);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки маршрутов');
    }
  };

  const loadDrivers = async (carId: number) => {
    setDriversLoading(true);
    try {
      const [carDriversResponse, companyDriversResponse] = await Promise.all([
        getCarDrivers(carId),
        getCompanyDrivers(companyId)
      ]);

      if (carDriversResponse.ok && carDriversResponse.data) {
        setCarDrivers(carDriversResponse.data);
      }

      if (companyDriversResponse.ok && companyDriversResponse.data) {
        setCompanyDrivers(companyDriversResponse.data);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки водителей');
    } finally {
      setDriversLoading(false);
    }
  };

  const handleAddDriver = async (userId: string) => {
    if (!car || !userId) return;
    
    setDriversLoading(true);
    try {
      const response = await addDriverToCar(car.id_cars, userId);
      if (response.ok) {
        showToast.success('Водитель успешно добавлен к автомобилю');
        setSelectedDriverToAdd(''); // Сбрасываем выбор
        await loadDrivers(car.id_cars);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка добавления водителя');
    } finally {
      setDriversLoading(false);
    }
  };

  const handleRemoveDriver = async (userId: string) => {
    if (!car) return;
    
    setDriversLoading(true);
    try {
      const response = await removeDriverFromCar(car.id_cars, userId);
      if (response.ok) {
        showToast.success('Водитель успешно удален из автомобиля');
        await loadDrivers(car.id_cars);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления водителя');
    } finally {
      setDriversLoading(false);
    }
  };

  // Получаем водителей, которые еще не прикреплены к автомобилю
  const availableDrivers = companyDrivers.filter(
    driver => !carDrivers.some(cd => cd.id_user === driver.id_user)
  );

  const handleDragStart = (e: React.DragEvent, driverId: string) => {
    setDraggedDriverId(driverId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', driverId);
  };

  const handleDragEnd = () => {
    setDraggedDriverId(null);
  };

  useEffect(() => {
    fetchData();
  }, [companyId, carId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!car) {
    return (
      <AppLayout>
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Автомобиль не найден</h3>
            <p className="text-muted-foreground">Автомобиль с таким ID не существует или был удален</p>
            <Button
              variant="outline"
              onClick={() => router.push(`/company/${companyId}/fleet`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к автопарку
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CarDetailsPageHeader
        car={car}
        carType={carType}
        loadType={loadType}
        companyId={companyId}
        onBack={() => router.push(`/company/${companyId}/fleet`)}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />
      <div className="flex flex-col space-y-6">
        {/* Основная информация об автомобиле */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Truck className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{car.title}</h2>
                <p className="text-muted-foreground">{carType} • {loadType}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Грузоподъемность</span>
                  <span className="font-semibold text-foreground">{car.tonn_max} т</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Объем</span>
                  <span className="font-semibold text-foreground">{car.m3_max} м³</span>
                </div>
                {car.price !== undefined && car.price !== null && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Цена</span>
                    <span className="font-semibold text-foreground">{car.price} ₽</span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Год выпуска</span>
                  <span className="font-semibold text-foreground">{car.year ?? '—'}</span>
                </div>
              </div>

              {/* Города доступности */}
              {car.places && Object.keys(car.places).length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Города доступности</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(car.places).map(([pid, p]) => (
                      <span 
                        key={pid} 
                        className={`text-sm px-3 py-1 rounded-full ${
                          p.active !== false 
                            ? 'bg-accent/10 text-accent border border-accent/20' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.label || pid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Контактная информация */}
              {car.phone && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Телефон</p>
                  <p className="font-medium text-foreground">{car.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Водители автомобиля */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5" />
                Водители автомобиля
              </h3>
              {carDrivers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Перетащите водителя на маршрут для назначения
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {carDrivers.length} {carDrivers.length === 1 ? 'водитель' : carDrivers.length < 5 ? 'водителя' : 'водителей'}
            </span>
          </div>

          {driversLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Добавление нового водителя */}
              {availableDrivers.length > 0 && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Добавить водителя
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedDriverToAdd}
                      onValueChange={setSelectedDriverToAdd}
                      disabled={driversLoading}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Выберите водителя для добавления" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id_user} value={driver.id_user}>
                            {driver.firstName || driver.lastName 
                              ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                              : driver.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (selectedDriverToAdd) {
                          handleAddDriver(selectedDriverToAdd);
                        }
                      }}
                      disabled={!selectedDriverToAdd || driversLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Выберите водителя из списка водителей компании и нажмите "Добавить"
                  </p>
                </div>
              )}

              {/* Список водителей */}
              {carDrivers.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">Нет водителей для этого автомобиля</p>
                  {companyDrivers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">В компании нет водителей. Добавьте водителей в команду компании.</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Добавьте водителей из списка выше</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {carDrivers.map((driver) => (
                    <div
                      key={driver.id_user}
                      draggable
                      onDragStart={(e) => handleDragStart(e, driver.id_user)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-move ${
                        draggedDriverId === driver.id_user ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {driver.firstName || driver.lastName 
                              ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                              : driver.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{driver.email}</p>
                          {driver.phone && (
                            <p className="text-xs text-muted-foreground">{driver.phone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDriver(driver.id_user)}
                        disabled={driversLoading}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                        title="Удалить водителя из автомобиля"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Маршруты автомобиля */}
        {car && (
          <CarRoutes
            routes={routes}
            companyUsers={companyUsers}
            onRouteUpdate={() => loadRoutes(car.id_cars)}
            onDragEnd={handleDragEnd}
          />
        )}
      </div>

      {/* Модальные окна */}
      {car && (
        <>
          <EditCarModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={fetchData}
            car={car}
          />

          <DeleteCarModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onSuccess={() => {
              router.push(`/company/${companyId}/fleet`);
            }}
            carId={car.id_cars}
            carTitle={car.title}
          />
        </>
      )}
    </AppLayout>
  );
}
