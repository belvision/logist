"use client";

import React, { useEffect, useState } from 'react';
import { X, Car, MapPin, Navigation, CalendarIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCompanyCars, getCarDrivers, CompanyDriver } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';
import { createRoute, CreateRouteRequest } from '@/shared/api/routes';
import { User } from 'lucide-react';
import { LocationSearchBox } from '@/components/car-search/LocationSearchBox';
import { WaypointSearch } from '@/components/cargo/WaypointSearch';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  id_driver?: string | null;
  departure_point: string;
  arrival_point: string;
  date_start?: Date | undefined;
  opisanie?: string;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Place[] }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
}

interface AddRouteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  companyId?: string;
}

export function AddRouteModal({ isOpen, onClose, onSuccess, companyId }: AddRouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [carDrivers, setCarDrivers] = useState<CompanyDriver[]>([]);
  const [selectedDeparturePlace, setSelectedDeparturePlace] = useState<Place | null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);
  
  const [formData, setFormData] = useState<RouteFormData>({
    departure_point: '',
    arrival_point: '',
    opisanie: '',
  });

  useEffect(() => {
    const fetchCars = async () => {
      if (!companyId) return;
      try {
        const carsResponse = await getCompanyCars(companyId);
        if (carsResponse.ok && Array.isArray(carsResponse.data)) {
          setCars(carsResponse.data);
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки автомобилей');
      }
    };
    if (isOpen) {
      fetchCars();
    }
  }, [isOpen, companyId]);

  const handleDeparturePick = (place: Place) => {
    setSelectedDeparturePlace(place);
    const departureData: { lat: number; lon: number; waypoints?: Place[] } = {
      lat: place.lat,
      lon: place.lon,
    };
    if (waypoints.length > 0) {
      departureData.waypoints = waypoints;
    }
    setFormData(prev => ({
      ...prev,
      departure_point: place.name,
      places_departure: {
        [String(place.place_id)]: departureData
      }
    }));
  };

  const handleArrivalPick = (place: Place) => {
    setFormData(prev => ({
      ...prev,
      arrival_point: place.name,
      places_arrival: {
        [String(place.place_id)]: {
          lat: place.lat,
          lon: place.lon
        }
      }
    }));
  };

  const handleAddWaypoint = (place: Place) => {
    setWaypoints(prev => {
      const newWaypoints = [...prev, place];
      if (selectedDeparturePlace) {
        setFormData(current => ({
          ...current,
          places_departure: {
            [String(selectedDeparturePlace.place_id)]: {
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
      if (selectedDeparturePlace) {
        const departureData: { lat: number; lon: number; waypoints?: Place[] } = {
          lat: selectedDeparturePlace.lat,
          lon: selectedDeparturePlace.lon,
        };
        if (newWaypoints.length > 0) {
          departureData.waypoints = newWaypoints;
        }
        setFormData(current => ({
          ...current,
          places_departure: {
            [String(selectedDeparturePlace.place_id)]: departureData
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
      const routeData: CreateRouteRequest = {
        ...(selectedCar?.id_cars ? { id_cars: selectedCar.id_cars } : {}),
        ...(formData.id_driver ? { id_driver: formData.id_driver } : { id_driver: null }),
        departure_point: formData.departure_point,
        arrival_point: formData.arrival_point,
        ...(formData.date_start ? { date_start: formData.date_start.toISOString() } : {}),
        ...(formData.opisanie ? { opisanie: formData.opisanie } : {}),
        ...(formData.places_departure ? { places_departure: formData.places_departure } : {}),
        ...(formData.places_arrival ? { places_arrival: formData.places_arrival } : {}),
      };

      await createRoute(routeData);
      showToast.success('Маршрут успешно создан!');
      resetForm();
      onSuccess?.();
      onClose?.();
    } catch (error) {
      handleApiError(error, 'Ошибка создания маршрута');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      departure_point: '',
      arrival_point: '',
      opisanie: '',
      id_driver: null,
    });
    setSelectedDeparturePlace(null);
    setWaypoints([]);
    setSelectedCar(null);
    setCarDrivers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Создать новый маршрут</h2>
            <p className="text-sm text-muted-foreground">Добавьте новый маршрут для автомобиля</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор автомобиля */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Автомобиль *
            </label>
            {cars.length > 0 ? (
              <>
                <Select 
                  value={selectedCar?.id_cars.toString() || ''} 
                  onValueChange={async (value) => {
                    const car = cars.find(c => c.id_cars.toString() === value);
                    setSelectedCar(car || null);
                    setFormData(prev => ({ ...prev, id_driver: null }));
                    
                    // Загружаем водителей для выбранного автомобиля
                    if (car) {
                      try {
                        const driversResponse = await getCarDrivers(car.id_cars);
                        if (driversResponse.ok && driversResponse.data) {
                          setCarDrivers(driversResponse.data);
                        } else {
                          setCarDrivers([]);
                        }
                      } catch (error) {
                        console.error('Ошибка загрузки водителей:', error);
                        setCarDrivers([]);
                      }
                    } else {
                      setCarDrivers([]);
                    }
                  }}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите автомобиль *" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem 
                        key={car.id_cars} 
                        value={car.id_cars.toString()}
                      >
                        {car.title || `Автомобиль #${car.id_cars}`} 
                        ({car.tonn_min}-{car.tonn_max}т, {car.m3_min}-{car.m3_max}м³)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCar && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Вес: {selectedCar.tonn_min}-{selectedCar.tonn_max}т • Объем: {selectedCar.m3_min}-{selectedCar.m3_max}м³
                  </p>
                )}
              </>
            ) : (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
                ⚠️ Автомобили не найдены. Сначала добавьте автомобили в автопарк.
              </div>
            )}
          </div>

          {/* Остальные поля показываются только после выбора автомобиля */}
          {selectedCar ? (
            <>
              {/* Выбор водителя */}
              {carDrivers.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Водитель (необязательно)
                  </Label>
                  <Select 
                    value={formData.id_driver || 'none'} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        id_driver: value === 'none' ? null : value 
                      }));
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите водителя" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не указан</SelectItem>
                      {carDrivers.map((driver) => (
                        <SelectItem 
                          key={driver.id_user} 
                          value={driver.id_user}
                        >
                          {driver.firstName || driver.lastName 
                            ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                            : driver.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Выберите водителя из списка прикрепленных к этому автомобилю
                  </p>
                </div>
              )}

              {/* Точка отправления */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
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
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Промежуточные точки (необязательно)
                </Label>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <WaypointSearch
                    onAdd={handleAddWaypoint}
                    waypoints={waypoints}
                    onRemove={handleRemoveWaypoint}
                  />
                </div>
              </div>

              {/* Точка прибытия */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-destructive" />
                  Точка прибытия *
                </Label>
                <LocationSearchBox
                  id="arrival"
                  onPick={handleArrivalPick}
                  placeholder="Введите город или адрес прибытия"
                  value={formData.arrival_point}
                />
              </div>

              {/* Дата отправления */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Дата отправления
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_start && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date_start ? (
                        format(formData.date_start, "PPP", { locale: ru })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      mode="single"
                      selected={formData.date_start}
                      onSelect={(date) => setFormData(prev => ({ ...prev, date_start: date || undefined }))}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Описание */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2">
                  Описание маршрута
                </Label>
                <Textarea
                  id="description"
                  value={formData.opisanie || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, opisanie: e.target.value }))}
                  placeholder="Дополнительная информация о маршруте..."
                  className="min-h-[100px]"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Car className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Выберите автомобиль, для которого создаете маршрут
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading || !selectedCar || !formData.departure_point || !formData.arrival_point}
            >
              {loading ? 'Создание...' : 'Создать маршрут'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

