// 'use client' directive to allow client-side state and effects
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCargos, deleteCargo } from '@/shared/api/cargo';
import { getCarTypes, getLoadTypes } from '@/shared/api/cars';
import { clientAuth } from '@/shared/api';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Plus, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/shared/context/page-header-context';
import { handleApiError } from '@/lib/toast';
import { DeleteCargoModal } from '@/components/cargo/DeleteCargoModal';

// --- Compatibility resolver for Zod v4 with react-hook-form ---
// Avoids version conflicts with @hookform/resolvers by using Zod directly.
import type { Resolver } from 'react-hook-form';
import { searchPlaces } from '@/shared/api/nominatim';
import { buildCompanionRoute } from '@/shared/api/osrm';
import { CargoRouteMap } from '../../../../components/cargo/CargoRouteMap';
import { WaypointSearch } from '../../../../components/cargo/WaypointSearch';
import { DateTimePicker } from '@/components/ui/date-time-picker';

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
  // Размеры груза в см (опциональные)
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  price: z.string().optional(),
  payment: z.enum(['Наличный', 'Безналичный', 'Карта', 'Перевод']),
  // Принимаем значение из input[type="datetime-local"], без таймзоны/секунд
  date_start: z.string().min(1, { message: 'Дата начала обязателена' }),
  date_end: z.string().min(1, { message: 'Дата окончания обязателена' }),
});
type CreateCargoFormValues = z.infer<typeof CreateCargoSchema>;

const zodV4Resolver: Resolver<CreateCargoFormValues> = async (values) => {
  // Обрабатываем пустые значения для числовых полей (NaN или пустые строки преобразуем в 0)
  const processedValues = {
    ...values,
    id_car_type: (values.id_car_type !== undefined && values.id_car_type !== null && !isNaN(Number(values.id_car_type))) ? Number(values.id_car_type) : 0,
    id_tip_zagryzki: (values.id_tip_zagryzki !== undefined && values.id_tip_zagryzki !== null && !isNaN(Number(values.id_tip_zagryzki))) ? Number(values.id_tip_zagryzki) : 0,
  };

  const result = CreateCargoSchema.safeParse(processedValues);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  // Map Zod issues to RHF error shape
  const fieldErrors: Record<string, any> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    fieldErrors[path] = {
      type: issue.code || 'validation',
      message: issue.message,
    };
  }
  return { values: {}, errors: fieldErrors };
};

interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: Record<string, unknown>;
  nodes?: number[];
}

function CargoPageHeader({ onAdd }: { onAdd: () => void }) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Грузы компании',
      'Управляйте грузами и находите подходящие автомобили для перевозки',
      undefined,
      <Button
        onClick={onAdd}
        variant="default"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить груз
      </Button>
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, [onAdd, setHeader]);

  return null;
}

export default function CompanyCargoPage() {
  const router = useRouter();
  // Параметр company_id берётся из динамического сегмента [company_id]
  const params = useParams();
  const id_company = params?.['company_id'] as string;
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCargoId, setSelectedCargoId] = useState<number | null>(null);
  const [selectedCargoRoute, setSelectedCargoRoute] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // react-hook-form setup with zod validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCargoFormValues>({
    resolver: zodV4Resolver,
    defaultValues: {
      departure_point: '',
      arrival_point: '',
      id_car_type: 0 as any,
      id_tip_zagryzki: 0 as any,
      opisanie: '',
      tonn: 0,
      m3: 0,
      length: undefined,
      width: undefined,
      height: undefined,
      price: '',
      payment: 'Наличный',
      date_start: '',
      date_end: '',
    },
  });

  // Регистрация полей для react-hook-form
  const departurePointRegister = register('departure_point');
  const arrivalPointRegister = register('arrival_point');

  // Справочники типов автомобилей и типов загрузки
  const [carTypes, setCarTypes] = useState<Record<string, unknown>[]>([]);
  const [loadTypes, setLoadTypes] = useState<Record<string, unknown>[]>([]);
  // Подсказки для пунктов отправления/назначения
  const [departureSuggestions, setDepartureSuggestions] = useState<Record<string, unknown>[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<Record<string, unknown>[]>([]);
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
        setCargos(list as any[]);
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
        const [carTypesResponse, loadTypesResponse] = await Promise.all([
          getCarTypes(),
          getLoadTypes()
        ]);

        if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
          setCarTypes(carTypesResponse.data as any[]);
        } else {
          console.error('Failed to load car types:', carTypesResponse.error);
        }

        if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
          setLoadTypes(loadTypesResponse.data as any[]);
        } else {
          console.error('Failed to load load types:', loadTypesResponse.error);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDicts();
  }, [showForm]);

  // Поиск населённых пунктов через Nominatim. Вызывается при вводе в поле.
  const searchPlacesHandler = async (value: string, setter: (items: Record<string, unknown>[]) => void) => {
    const q = value.trim();
    
    if (q.length < 3) {
      setter([]);
      return;
    }
    try {
      const data = await searchPlaces(q, true);
      setter(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('[NOMINATIM] Error:', err);
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

      const routeData = await buildCompanionRoute(requestBody);
      
      if (!routeData.distance || !routeData.geometry) {
        console.error('BuildRoute error in response:', routeData);
        throw new Error('Ошибка построения маршрута');
      }

      const route: RouteData = {
        distance: routeData.distance,
        duration: routeData.duration,
        geometry: routeData.geometry,
        nodes: routeData.nodes,
      };

      setRoute(route);
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
      await buildRouteWithWaypoints(newWaypoints);
    }
  };

  const handlePlaceSelect = (place: Record<string, unknown>, type: 'start' | 'end') => {
    const placeKeys = Object.keys(place['place'] as Record<string, unknown>);
    const firstKey = placeKeys[0];
    if (!firstKey) return;
    
    const placeData: Place = {
      place_id: parseInt(firstKey),
      name: place['label'] as string,
      lat: ((place['place'] as Record<string, unknown>)[firstKey] as { lat: number; lon: number })?.lat || 0,
      lon: ((place['place'] as Record<string, unknown>)[firstKey] as { lat: number; lon: number })?.lon || 0,
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
  const handleDelete = (id: number) => {
    const cargo = cargos.find(c => c.id_cargo === id);
    const route = cargo
      ? `${cargo.departure_point ?? '-'} → ${cargo.arrival_point ?? '-'}`
      : null;
    setSelectedCargoId(id);
    setSelectedCargoRoute(route);
    setShowDeleteModal(true);
  };

  // Подтверждение удаления груза
  const confirmDelete = async () => {
    if (!selectedCargoId) return;

    setDeleteLoading(true);
    try {
      await deleteCargo(selectedCargoId);
      setCargos(prev => prev.filter(c => c.id_cargo !== selectedCargoId));
      setShowDeleteModal(false);
      setSelectedCargoId(null);
      setSelectedCargoRoute(null);
    } catch (error) {
      handleApiError(error, 'Ошибка удаления груза');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddForm = useCallback(() => {
    setShowForm(true);
    setEditingCargoId(null);
    reset();
    setStartPlace(null);
    setEndPlace(null);
    setWaypoints([]);
    setRoute(null);
    setRouteConfirmed(false);
    setFormStep('route');
  }, [reset]);

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
    const existing = cargos.find(c => c.id_cargo === cargoId);
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
    setValue('length', existing.length ? Number(existing.length) : undefined);
    setValue('width', existing.width ? Number(existing.width) : undefined);
    setValue('height', existing.height ? Number(existing.height) : undefined);
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

    // Проверяем, что обязательные поля заполнены
    if (!values.id_car_type || values.id_car_type === 0) {
      alert('Пожалуйста, выберите тип автомобиля');
      return;
    }
    if (!values.id_tip_zagryzki || values.id_tip_zagryzki === 0) {
      alert('Пожалуйста, выберите тип загрузки');
      return;
    }

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

      // Используем clientAuth для создания/обновления груза
      let res;
      if (editingCargoId) {
        res = await (clientAuth as any)['cargo'][editingCargoId].$patch({ json: payload });
      } else {
        res = await (clientAuth as any)['cargo'].$post({ json: payload });
      }

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
      setCargos(list as any[]);
    } catch (err) {
      console.error('Error creating/updating cargo:', err);
      const errorMessage = err instanceof Error ? err.message : (editingCargoId ? 'Ошибка при обновлении груза' : 'Ошибка при создании груза');
      alert(errorMessage);
      handleApiError(err, editingCargoId ? 'Ошибка при обновлении груза' : 'Ошибка при создании груза');
    }
  };

  return (
    <AppLayout>
      <CargoPageHeader onAdd={openAddForm} />
      <div className="flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {showForm && (
                <div className="bg-card border border-border rounded-lg p-6 w-full shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingCargoId ? 'Редактировать груз' : 'Добавить новый груз'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formStep === 'route' ? 'Выберите маршрут для груза' : 'Заполните данные о грузе'}
                </p>
              </div>
              <button
                onClick={() => {
                  reset();
                  setShowForm(false);
                  setEditingCargoId(null);
                  setStartPlace(null);
                  setEndPlace(null);
                  setWaypoints([]);
                  setRoute(null);
                  setRouteConfirmed(false);
                  setFormStep('route');
                }}
                className="text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Индикатор этапов */}
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 ${formStep === 'route' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  formStep === 'route' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Выбор маршрута</span>
              </div>
              <div className={`w-8 h-0.5 ${formStep === 'details' ? 'bg-primary' : 'bg-border'}`}></div>
              <div className={`flex items-center space-x-2 ${formStep === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  formStep === 'details' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Данные груза</span>
              </div>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Этап 1: Выбор маршрута */}
              {formStep === 'route' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Пункт отправления</label>
                      <div className="relative">
                        <Input
                          type="text"
                          {...departurePointRegister}
                          placeholder="Введите пункт отправления"
                          className={cn(errors['departure_point'] && 'border-red-500')}
                          onChange={e => {
                            departurePointRegister.onChange(e);
                            searchPlacesHandler(e.target.value, setDepartureSuggestions);
                          }}
                        />
                        {errors['departure_point'] && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['departure_point']?.message || '')}</p>
                        )}
                        {departureSuggestions.length > 0 && (
                          <ul className="absolute z-10 w-full border border-border bg-card rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                            {departureSuggestions.map((item: Record<string, unknown>, idx: number) => (
                              <li
                                key={idx}
                                className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground"
                                onClick={() => {
                                  setValue('departure_point', item['label'] as string);
                                  setSelectedDeparturePlace(item['place'] as Record<string, { lat: number; lon: number }>);
                                  setDepartureSuggestions([]);
                                  handlePlaceSelect(item, 'start');
                                }}
                              >
                                {item['label'] as string}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Пункт назначения</label>
                      <div className="relative">
                        <Input
                          type="text"
                          {...arrivalPointRegister}
                          placeholder="Введите пункт назначения"
                          className={cn(errors['arrival_point'] && 'border-red-500')}
                          onChange={e => {
                            arrivalPointRegister.onChange(e);
                            searchPlacesHandler(e.target.value, setArrivalSuggestions);
                          }}
                        />
                        {errors['arrival_point'] && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['arrival_point']?.message || '')}</p>
                        )}
                        {arrivalSuggestions.length > 0 && (
                          <ul className="absolute z-10 w-full border border-border bg-card rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                            {arrivalSuggestions.map((item: Record<string, unknown>, idx: number) => (
                              <li
                                key={idx}
                                className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground"
                                onClick={() => {
                                  setValue('arrival_point', item['label'] as string);
                                  setSelectedArrivalPlace(item['place'] as Record<string, { lat: number; lon: number }>);
                                  setArrivalSuggestions([]);
                                  handlePlaceSelect(item, 'end');
                                }}
                              >
                                {item['label'] as string}
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
                        <h3 className="text-lg font-semibold text-foreground">
                          Маршрут груза
                        </h3>
                        {routeLoading && (
                          <div className="text-sm text-muted-foreground">
                            Построение маршрута...
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <CargoRouteMap
                          start={startPlace}
                          end={endPlace}
                          waypoints={waypoints}
                          route={route as any}
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
                          >
                            Подтвердить маршрут
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Индикатор подтвержденного маршрута */}
                  {routeConfirmed && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Тип автомобиля</label>
                      <Select
                        {...(watch('id_car_type') !== 0 && { value: String(watch('id_car_type') || '') })}
                        onValueChange={(value) => setValue('id_car_type', parseInt(value))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={cn(errors['id_car_type'] && 'border-red-500')}>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {carTypes.map((item: Record<string, unknown>, index: number) => (
                            <SelectItem key={item['id_car_type'] as string || index} value={String(item['id_car_type'] || '')}>
                              {String(item['car_type'] ?? item['name'] ?? item['label'] ?? '')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors['id_car_type'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['id_car_type']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Тип загрузки</label>
                      <Select
                        {...(watch('id_tip_zagryzki') !== 0 && { value: String(watch('id_tip_zagryzki') || '') })}
                        onValueChange={(value) => setValue('id_tip_zagryzki', parseInt(value))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={cn(errors['id_tip_zagryzki'] && 'border-red-500')}>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadTypes.map((item: Record<string, unknown>, index: number) => (
                            <SelectItem key={item['id_tip_zagryzki'] as string || index} value={String(item['id_tip_zagryzki'] || '')}>
                              {String(item['tip_zagryzki'] ?? item['name'] ?? '')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors['id_tip_zagryzki'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['id_tip_zagryzki']?.message || '')}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Описание (опционально)</label>
                    <textarea
                      {...register('opisanie')}
                      className={cn(
                        "w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none",
                        errors['opisanie'] && 'border-red-500'
                      )}
                      rows={3}
                      placeholder="Дополнительная информация о грузе"
                      disabled={isSubmitting}
                    />
                    {errors['opisanie'] && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['opisanie']?.message || '')}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Вес, тонн</label>
                      <Input
                        type="number"
                        step="any"
                        {...register('tonn', { valueAsNumber: true })}
                        placeholder="0.0"
                        className={cn(errors['tonn'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['tonn'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['tonn']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Объём, м³</label>
                      <Input
                        type="number"
                        step="any"
                        {...register('m3', { valueAsNumber: true })}
                        placeholder="0.0"
                        className={cn(errors['m3'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['m3'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['m3']?.message || '')}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Длина, см</label>
                      <Input
                        type="number"
                        step="any"
                        {...register('length', { valueAsNumber: true })}
                        placeholder="0"
                        className={cn(errors['length'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['length'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['length']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Ширина, см</label>
                      <Input
                        type="number"
                        step="any"
                        {...register('width', { valueAsNumber: true })}
                        placeholder="0"
                        className={cn(errors['width'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['width'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['width']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Высота, см</label>
                      <Input
                        type="number"
                        step="any"
                        {...register('height', { valueAsNumber: true })}
                        placeholder="0"
                        className={cn(errors['height'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['height'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['height']?.message || '')}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Цена (опционально)</label>
                      <Input
                        type="text"
                        {...register('price')}
                        placeholder="Введите цену"
                        className={cn(errors['price'] && 'border-red-500')}
                        disabled={isSubmitting}
                      />
                      {errors['price'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['price']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Тип оплаты</label>
                      <Select
                        value={watch('payment')}
                        onValueChange={(value) => setValue('payment', value as 'Наличный' | 'Безналичный' | 'Карта' | 'Перевод')}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={cn(errors['payment'] && 'border-red-500')}>
                          <SelectValue placeholder="Выберите тип оплаты" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Наличный">Наличный</SelectItem>
                          <SelectItem value="Безналичный">Безналичный</SelectItem>
                          <SelectItem value="Карта">Карта</SelectItem>
                          <SelectItem value="Перевод">Перевод</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors['payment'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['payment']?.message || '')}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Дата начала</label>
                      <DateTimePicker
                        value={watch('date_start')}
                        onChange={(value) => {
                          setValue('date_start', value, { shouldValidate: true });
                        }}
                        disabled={isSubmitting}
                        error={!!errors['date_start']}
                      />
                      {errors['date_start'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['date_start']?.message || '')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Дата окончания</label>
                      <DateTimePicker
                        value={watch('date_end')}
                        onChange={(value) => {
                          setValue('date_end', value, { shouldValidate: true });
                        }}
                        disabled={isSubmitting}
                        error={!!errors['date_end']}
                      />
                      {errors['date_end'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{String(errors['date_end']?.message || '')}</p>
                      )}
                    </div>
                  </div>

                  {/* Кнопки навигации для второго этапа */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToRoute}
                      className="flex-1 bg-transparent"
                      disabled={isSubmitting}
                    >
                      ← Назад к маршруту
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setShowForm(false);
                        setEditingCargoId(null);
                        setStartPlace(null);
                        setEndPlace(null);
                        setWaypoints([]);
                        setRoute(null);
                        setRouteConfirmed(false);
                        setFormStep('route');
                      }}
                      className="flex-1 bg-transparent"
                      disabled={isSubmitting}
                    >
                      Отменить
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Сохранение...' : (editingCargoId ? 'Обновить груз' : 'Создать груз')}
                    </Button>
                  </div>
                </div>
              )}
            </form>
                </div>
              )}

              {cargos.length === 0 && !showForm ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Нет грузов</h3>
                    <p className="text-muted-foreground">Добавьте свой первый груз для перевозки</p>
                  </div>
                </div>
              ) : cargos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cargos.map((cargo, index) => {
                    const cargoId = cargo.id_cargo ?? index;
                    const isActive = new Date(cargo.date_end) > new Date();

                    return (
                      <Card key={cargoId} className="hover:shadow-lg transition-shadow duration-200 bg-card border-border overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-foreground">
                              Груз #{cargoId}
                            </CardTitle>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {isActive ? 'Активный' : 'Завершён'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-muted-foreground">Маршрут:</span>
                              <span className="text-sm text-foreground">
                                {cargo.departure_point ?? '-'} → {cargo.arrival_point ?? '-'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-muted-foreground">Описание:</span>
                              <span className="text-sm text-foreground">
                                {cargo.opisanie ?? 'Не указано'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{cargo.tonn}т</div>
                              <div className="text-xs text-muted-foreground">Вес</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{cargo.m3}м³</div>
                              <div className="text-xs text-muted-foreground">Объём</div>
                            </div>
                          </div>
                          {(cargo.length || cargo.width || cargo.height) && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">Размеры (см):</div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                {cargo.length && (
                                  <div className="text-center p-2 rounded-lg">
                                    <div className="font-semibold">{cargo.length}</div>
                                    <div className="text-xs text-muted-foreground">Длина</div>
                                  </div>
                                )}
                                {cargo.width && (
                                  <div className="text-center p-2 rounded-lg">
                                    <div className="font-semibold">{cargo.width}</div>
                                    <div className="text-xs text-muted-foreground">Ширина</div>
                                  </div>
                                )}
                                {cargo.height && (
                                  <div className="text-center p-2 rounded-lg">
                                    <div className="font-semibold">{cargo.height}</div>
                                    <div className="text-xs text-muted-foreground">Высота</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:flex-nowrap flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/cargo/${cargoId}`)}
                              className="w-full sm:flex-1"
                            >
                              Подробнее
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(Number(cargoId))}
                              className="w-full sm:flex-1"
                            >
                              Редактировать
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(Number(cargoId))}
                              className="w-full sm:flex-1"
                            >
                              Удалить
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSearchCars(Number(cargoId), cargo.tonn, cargo.m3)}
                            className="w-full"
                          >
                            Подобрать машину
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно удаления груза */}
      <DeleteCargoModal
        isOpen={showDeleteModal}
        cargoId={selectedCargoId}
        cargoRoute={selectedCargoRoute ?? undefined}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCargoId(null);
          setSelectedCargoRoute(null);
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </AppLayout>
  );
}