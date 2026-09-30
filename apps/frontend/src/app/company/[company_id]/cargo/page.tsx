// 'use client' directive to allow client-side state and effects
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCargos, deleteCargo } from '../../../../components/cargo/cargoService';
import type { Cargo } from '../../../../components/cargo/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getCookie } from 'cookies-next';
import { CargoRouteMap } from '../../../../components/cargo/CargoRouteMap';
import { WaypointSearch } from '../../../../components/cargo/WaypointSearch';

/**
 * Схема данных формы создания груза.  Полностью отражает схему
 * CreateCargoSchema на сервере. Используем zod для валидации.
 */
const CreateCargoSchema = z.object({
  departure_point: z.string().min(1, { message: 'Пункт отправления обязателен' }),
  arrival_point: z.string().min(1, { message: 'Пункт назначения обязателен' }),
  id_car_type: z.number().int({ message: 'Тип автомобиля обязателен' }),
  id_tip_zagryzki: z.number().int({ message: 'Тип загрузки обязателен' }),
  opisanie: z.string().optional(),
  tonn: z.number().min(0.1, { message: 'Вес (тонн) обязателен' }),
  m3: z.number().min(0.1, { message: 'Объём (м³) обязателен' }),
  price: z.string().optional(),
  payment: z.enum(['Наличный', 'Безналичный', 'Карта', 'Перевод']),
  // Принимаем значение из input[type="datetime-local"], без таймзоны/секунд
  date_start: z.string().min(1, { message: 'Дата начала обязателена' }),
  date_end: z.string().min(1, { message: 'Дата окончания обязателена' }),
});
type CreateCargoFormValues = z.infer<typeof CreateCargoSchema>;

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: any;
  nodes?: number[];
}

export default function CompanyCargoPage() {
  const router = useRouter();
  // Параметр company_id берётся из динамического сегмента [company_id]
  const params = useParams();
  const id_company = params?.company_id as string;
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);

  // react-hook-form setup with zod validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCargoFormValues>({
    resolver: zodResolver(CreateCargoSchema as unknown as any),
    defaultValues: {
      departure_point: '',
      arrival_point: '',
      id_car_type: 0,
      id_tip_zagryzki: 0,
      opisanie: '',
      tonn: 0,
      m3: 0,
      price: '',
      payment: 'Наличный',
      date_start: '',
      date_end: '',
    },
  });

  // Справочники типов автомобилей и типов загрузки
  const [carTypes, setCarTypes] = useState<any[]>([]);
  const [loadTypes, setLoadTypes] = useState<any[]>([]);
  // Подсказки для пунктов отправления/назначения
  const [departureSuggestions, setDepartureSuggestions] = useState<any[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<any[]>([]);
  // Выбранные данные для пунктов отправления/назначения (place_id: {lat, lon})
  const [selectedDeparturePlace, setSelectedDeparturePlace] = useState<Record<string, { lat: number; lon: number }> | null>(null);
  const [selectedArrivalPlace, setSelectedArrivalPlace] = useState<Record<string, { lat: number; lon: number }> | null>(null);
  
  // Состояние для карты маршрута
  const [startPlace, setStartPlace] = useState<Place | null>(null);
  const [endPlace, setEndPlace] = useState<Place | null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const [formStep, setFormStep] = useState<'route' | 'details'>('route');

  // Загрузка списка грузов при монтировании и изменении id_company
  useEffect(() => {
    async function load() {
      if (!id_company) return;
      try {
        const list = await getCargos(id_company);
        setCargos(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id_company]);

  // Загрузка справочников при открытии формы
  useEffect(() => {
    if (!showForm) return;
    async function fetchDicts() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const token = getCookie('access_token');
        const authHeaders: HeadersInit = {};
        if (token) {
          (authHeaders as any).Authorization = `Bearer ${token}`;
        }

        const resTypes = await fetch(`${API_BASE}/api/cars/types`, { 
          credentials: 'include',
          headers: {
            ...authHeaders,
          },
        });
        if (resTypes.ok) {
          const data = await resTypes.json();
          setCarTypes(Array.isArray(data.items) ? data.items : []);
        }
        const resLoadTypes = await fetch(`${API_BASE}/api/cars/load-types`, {
          credentials: 'include',
          headers: {
            ...authHeaders,
          },
        });
        if (resLoadTypes.ok) {
          const data = await resLoadTypes.json();
          setLoadTypes(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDicts();
  }, [showForm]);

  // Поиск населённых пунктов через Nominatim. Вызывается при вводе в поле.
  const searchPlaces = async (value: string, setter: (items: any[]) => void) => {
    const q = value.trim();
    if (q.length < 3) {
      setter([]);
      return;
    }
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const token = getCookie('access_token');
      const authHeaders: HeadersInit = {};
      if (token) {
        (authHeaders as any).Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/nominatim/places/search?q=${encodeURIComponent(q)}`, {
        credentials: 'include',
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        setter([]);
        return;
      }
      const data = await res.json();
      setter(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setter([]);
    }
  };

  // Функции для работы с картой маршрута

  // Функция для построения маршрута с промежуточными точками
  const buildRouteWithWaypoints = useCallback(async (waypointsToUse: Place[]) => {
    if (!startPlace || !endPlace) {
      console.error('Start or end place is missing');
      return;
    }

    setRouteLoading(true);
    try {
      const allPoints = [startPlace, ...waypointsToUse, endPlace];
      const requestBody = {
        points: allPoints.map(p => ({ lat: p.lat, lon: p.lon })),
        avoidMotorwayToll: false,
        preferShortest: false,
      };
      
      console.log('BuildRoute request body:', requestBody);
      
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const token = getCookie('access_token');
      const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        (authHeaders as any).Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/api/companion-cargo/build-route`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('BuildRoute error response:', errorData);
        throw new Error(errorData.error || 'Ошибка построения маршрута');
      }

      const routeData = await response.json();
      console.log('BuildRoute response data:', routeData);
      
      if (!routeData.distance || !routeData.geometry) {
        console.error('BuildRoute error in response:', routeData);
        throw new Error(routeData.error || 'Ошибка построения маршрута');
      }

      const route: RouteData = {
        distance: routeData.distance,
        duration: routeData.duration,
        geometry: routeData.geometry,
        nodes: routeData.nodes,
      };
      
      console.log('Setting route...');
      setRoute(route);
      console.log('Route building completed successfully');
    } catch (error) {
      console.error('Error building route:', error);
      alert('Ошибка построения маршрута');
    } finally {
      setRouteLoading(false);
    }
  }, [startPlace, endPlace, waypoints]);

  const handleWaypointAdd = async (place: Place) => {
    const newWaypoints = [...waypoints, place];
    setWaypoints(newWaypoints);
    setRouteConfirmed(false); // Сбрасываем подтверждение при добавлении точки
    
    // Автоматически перестраиваем маршрут с новой промежуточной точкой
    if (startPlace && endPlace) {
      console.log('Auto-rebuilding route with new waypoint...');
      await buildRouteWithWaypoints(newWaypoints);
    }
  };

  const handleRouteConfirm = () => {
    setRouteConfirmed(true);
    setFormStep('details');
    
    // Обновляем форму с данными маршрута
    setValue('departure_point', startPlace?.name || '');
    setValue('arrival_point', endPlace?.name || '');
  };

  const handleBackToRoute = () => {
    setFormStep('route');
    setRouteConfirmed(false);
  };


  const handleWaypointRemove = async (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    setRouteConfirmed(false); // Сбрасываем подтверждение при удалении точки
    
    // Автоматически перестраиваем маршрут без удаленной точки
    if (startPlace && endPlace) {
      console.log('Auto-rebuilding route after waypoint removal...');
      await buildRouteWithWaypoints(newWaypoints);
    }
  };

  const handlePlaceSelect = (place: any, type: 'start' | 'end') => {
    const placeData: Place = {
      place_id: Object.keys(place.place)[0],
      name: place.label,
      lat: place.place[Object.keys(place.place)[0]].lat,
      lon: place.place[Object.keys(place.place)[0]].lon,
    };

    if (type === 'start') {
      setStartPlace(placeData);
    } else {
      setEndPlace(placeData);
    }
  };

  // Автоматическое построение маршрута при выборе обеих точек
  useEffect(() => {
    if (startPlace && endPlace && !routeConfirmed) {
      buildRouteWithWaypoints(waypoints);
    }
  }, [startPlace, endPlace, routeConfirmed, buildRouteWithWaypoints]);

  // Сброс подтверждения маршрута при изменении точек
  useEffect(() => {
    if (startPlace || endPlace) {
      setRouteConfirmed(false);
    }
  }, [startPlace, endPlace]);

  // Обработчик удаления груза
  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы действительно хотите удалить этот груз?')) return;
    try {
      await deleteCargo(id);
      setCargos(prev => prev.filter(c => (c as any).id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // Обработчик перехода на страницу подбора автомобилей для груза
  const handleSearchCars = (cargoId: number, tonn?: number, m3?: number) => {
    // Используем новый URL с query-параметрами tonn и m3
    const url = new URL(window.location.origin + `/company/${id_company}/cargo/${cargoId}/car-search`);
    if (tonn) url.searchParams.set('tonn', String(tonn));
    if (m3) url.searchParams.set('m3', String(m3));
    router.push(url.pathname + (url.search || ''));
  };

  // Обработчик включения режима редактирования (заполняем форму данными груза)
  const handleEdit = (cargoId: number) => {
    const existing = cargos.find((c: any) => (c.id ?? c.id_cargo) === cargoId) as any;
    if (!existing) return;
    
    // Сбрасываем состояние карты и формы
    setStartPlace(null);
    setEndPlace(null);
    setWaypoints([]);
    setRoute(null);
    setRouteConfirmed(false);
    setFormStep('route');
    
    setEditingCargoId(cargoId);
    setShowForm(true);
    setValue('departure_point', existing.departure_point ?? '');
    setValue('arrival_point', existing.arrival_point ?? '');
    setValue('id_car_type', Number(existing.id_car_type) || 0);
    setValue('id_tip_zagryzki', Number(existing.id_tip_zagryzki) || 0);
    setValue('opisanie', existing.opisanie ?? '');
    setValue('tonn', Number(existing.tonn) || 0);
    setValue('m3', Number(existing.m3) || 0);
    setValue('price', existing.price ?? '');
    setValue('payment', existing.payment ?? 'Наличный');
    const toLocal = (val?: string) => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };
    setValue('date_start', toLocal(existing.date_start));
    setValue('date_end', toLocal(existing.date_end));
  };

  // Обработчик отправки формы создания груза
  const onSubmit = async (values: CreateCargoFormValues) => {
    if (!id_company) return;
    try {
      // Конвертируем local datetime (YYYY-MM-DDTHH:mm) в ISO для бэкенда
      const dateStartIso = new Date(values.date_start).toISOString();
      const dateEndIso = new Date(values.date_end).toISOString();
      // Создаем JSON с промежуточными точками для departure_point
      const departureData = selectedDeparturePlace ? {
        ...selectedDeparturePlace,
        waypoints: waypoints.map(wp => ({
          place_id: wp.place_id,
          lat: wp.lat,
          lon: wp.lon,
          name: wp.name
        }))
      } : null;

      const payload = {
        ...values,
        date_start: dateStartIso,
        date_end: dateEndIso,
        id_company,
        ...(departureData ? { departure_place_id: departureData } : {}),
        ...(selectedArrivalPlace ? { arrival_place_id: selectedArrivalPlace } : {}),
      };
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const token = getCookie('access_token');
      const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        (authHeaders as any).Authorization = `Bearer ${token}`;
      }
      
      // Создаем новый груз
      const url = editingCargoId ? `${API_BASE}/api/cargo/${editingCargoId}` : `${API_BASE}/api/cargo`;
      const method = editingCargoId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error || (editingCargoId ? 'Не удалось обновить груз' : 'Не удалось создать груз'));
      }
      reset();
      setShowForm(false);
      setEditingCargoId(null);
      // Сброс состояния карты
      setStartPlace(null);
      setEndPlace(null);
      setWaypoints([]);
      setRoute(null);
      setRouteConfirmed(false);
      setFormStep('route');
      // перезагрузить список после добавления
      const list = await getCargos(id_company);
      setCargos(list);
    } catch (err) {
      console.error(err);
      alert((err as any)?.message || (editingCargoId ? 'Ошибка при обновлении груза' : 'Ошибка при создании груза'));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Загрузка грузов...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Грузы компании</h1>
          <Button 
            onClick={() => {
              if (showForm) {
                // При закрытии формы сбрасываем все состояния
                reset();
                setStartPlace(null);
                setEndPlace(null);
                setWaypoints([]);
                setRoute(null);
                setRouteConfirmed(false);
                setFormStep('route');
                setEditingCargoId(null);
              }
              setShowForm(prev => !prev);
            }} 
            size="sm" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showForm ? 'Отменить' : 'Добавить груз'}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCargoId ? 'Редактировать груз' : 'Добавить новый груз'}
              </CardTitle>
              
              {/* Индикатор этапов */}
              <div className="flex items-center space-x-4 mt-4">
                <div className={`flex items-center space-x-2 ${formStep === 'route' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    formStep === 'route' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Выбор маршрута</span>
                </div>
                <div className={`w-8 h-0.5 ${formStep === 'details' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center space-x-2 ${formStep === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    formStep === 'details' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Данные груза</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Этап 1: Выбор маршрута */}
                {formStep === 'route' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Пункт отправления</label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('departure_point')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Введите пункт отправления"
                        onChange={e => {
                          register('departure_point').onChange(e);
                          searchPlaces(e.target.value, setDepartureSuggestions);
                        }}
                      />
                      {errors.departure_point && (
                        <span className="text-red-500 text-sm">{errors.departure_point.message}</span>
                      )}
                      {departureSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                          {departureSuggestions.map((item: any, idx: number) => (
                            <li
                              key={idx}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white"
                              onClick={() => {
                                setValue('departure_point', item.label);
                                setSelectedDeparturePlace(item.place);
                                setDepartureSuggestions([]);
                                handlePlaceSelect(item, 'start');
                              }}
                            >
                              {item.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Пункт назначения</label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('arrival_point')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Введите пункт назначения"
                        onChange={e => {
                          register('arrival_point').onChange(e);
                          searchPlaces(e.target.value, setArrivalSuggestions);
                        }}
                      />
                      {errors.arrival_point && (
                        <span className="text-red-500 text-sm">{errors.arrival_point.message}</span>
                      )}
                      {arrivalSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                          {arrivalSuggestions.map((item: any, idx: number) => (
                            <li
                              key={idx}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white"
                              onClick={() => {
                                setValue('arrival_point', item.label);
                                setSelectedArrivalPlace(item.place);
                                setArrivalSuggestions([]);
                                handlePlaceSelect(item, 'end');
                              }}
                            >
                              {item.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                    </div>
                    
                    {/* Карта маршрута */}
                    {startPlace && endPlace && !routeConfirmed && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Маршрут груза
                          </h3>
                          {routeLoading && (
                            <div className="text-sm text-gray-600">
                              Построение маршрута...
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <CargoRouteMap
                            start={startPlace}
                            end={endPlace}
                            waypoints={waypoints}
                            route={route}
                            onWaypointRemove={handleWaypointRemove}
                            height={400}
                          />
                          
                          <WaypointSearch
                            onAdd={handleWaypointAdd}
                            waypoints={waypoints}
                            onRemove={handleWaypointRemove}
                          />
                          
                          <div className="flex gap-3 justify-end">
                            <Button
                              type="button"
                              onClick={handleRouteConfirm}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Подтвердить маршрут
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Индикатор подтвержденного маршрута */}
                    {routeConfirmed && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Маршрут подтвержден: {startPlace?.name} → {endPlace?.name}
                            {waypoints.length > 0 && ` (${waypoints.length} промежуточных точек)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Этап 2: Данные груза */}
                {formStep === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Тип автомобиля</label>
                    <select
                      {...register('id_car_type', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Выберите тип</option>
                      {carTypes.map((item: any) => (
                        <option key={item.id_car_type} value={item.id_car_type}>
                          {item.car_type ?? item.name ?? item.label ?? ''}
                        </option>
                      ))}
                    </select>
                    {errors.id_car_type && (
                      <span className="text-red-500 text-sm">{errors.id_car_type.message}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Тип загрузки</label>
                    <select
                      {...register('id_tip_zagryzki', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Выберите тип</option>
                      {loadTypes.map((item: any) => (
                        <option key={item.id_tip_zagryzki} value={item.id_tip_zagryzki}>
                          {item.tip_zagryzki ?? item.name ?? ''}
                        </option>
                      ))}
                    </select>
                    {errors.id_tip_zagryzki && (
                      <span className="text-red-500 text-sm">{errors.id_tip_zagryzki.message}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Описание (опционально)</label>
                  <textarea
                    {...register('opisanie')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Дополнительная информация о грузе"
                  />
                  {errors.opisanie && (
                    <span className="text-red-500 text-sm">{errors.opisanie.message}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Вес, тонн</label>
                    <input
                      type="number"
                      step="any"
                      {...register('tonn', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                    {errors.tonn && (
                      <span className="text-red-500 text-sm">{errors.tonn.message}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Объём, м³</label>
                    <input
                      type="number"
                      step="any"
                      {...register('m3', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                    {errors.m3 && (
                      <span className="text-red-500 text-sm">{errors.m3.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Цена (опционально)</label>
                    <input
                      type="text"
                      {...register('price')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите цену"
                    />
                    {errors.price && (
                      <span className="text-red-500 text-sm">{errors.price.message}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Тип оплаты</label>
                    <select 
                      {...register('payment')} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Наличный">Наличный</option>
                      <option value="Безналичный">Безналичный</option>
                      <option value="Карта">Карта</option>
                      <option value="Перевод">Перевод</option>
                    </select>
                    {errors.payment && (
                      <span className="text-red-500 text-sm">{errors.payment.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Дата начала</label>
                    <input
                      type="datetime-local"
                      {...register('date_start')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.date_start && (
                      <span className="text-red-500 text-sm">{errors.date_start.message}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Дата окончания</label>
                    <input
                      type="datetime-local"
                      {...register('date_end')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.date_end && (
                      <span className="text-red-500 text-sm">{errors.date_end.message}</span>
                    )}
                  </div>
                    </div>
                    
                    {/* Кнопки навигации для второго этапа */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToRoute}
                        className="flex items-center gap-2"
                      >
                        ← Назад к маршруту
                      </Button>
                      
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            reset();
                            setShowForm(false);
                            setEditingCargoId(null);
                            // Сброс состояния карты
                            setStartPlace(null);
                            setEndPlace(null);
                            setWaypoints([]);
                            setRoute(null);
                            setRouteConfirmed(false);
                            setFormStep('route');
                          }}
                        >
                          Отменить
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isSubmitting ? 'Сохранение...' : (editingCargoId ? 'Обновить груз' : 'Создать груз')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
              </form>
            </CardContent>
          </Card>
        )}

        {cargos.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400">
              Список грузов пуст
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cargos.map((cargo, index) => {
              const cargoId = (cargo as any).id ?? (cargo as any).id_cargo ?? index;
              const isActive = new Date((cargo as any).date_end) > new Date();
              
              return (
                <Card key={cargoId} className="hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Груз #{cargoId}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {isActive ? 'Активный' : 'Завершён'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Маршрут:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(cargo as any).departure_point ?? '-'} → {(cargo as any).arrival_point ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Описание:</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(cargo as any).opisanie ?? (cargo as any).name ?? 'Не указано'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{cargo.tonn}т</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Вес</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{cargo.m3}м³</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Объём</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-nowrap flex-wrap gap-2 px-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(cargoId)}
                        className="w-full sm:flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(cargoId)}
                        className="w-full sm:flex-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-600"
                      >
                        Удалить
                      </Button>
                      <div className="basis-full h-0" />
                   
                    </div>
                  </CardContent>
                  <Button
                        size="sm"
                        onClick={() => handleSearchCars(cargoId, cargo.tonn, cargo.m3)}
                        className="w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        Подобрать машину
                      </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}