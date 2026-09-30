'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Building2,
  Phone,
  ArrowLeft,
  MessageSquare,
  Weight,
  Box,
  DollarSign,
  Loader2,
  Calendar,
  Truck,
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import { getCargoById } from '@/shared/api/cargo';
import { getCarTypes, getLoadTypes } from '@/shared/api/cars';

interface CargoDetails {
  id_cargo: number;
  id_company: string;
  departure_point: string;
  arrival_point: string;
  id_car_type: number;
  id_tip_zagryzki: number;
  opisanie?: string | null;
  tonn: number;
  m3: number;
  price?: string | null;
  payment: 'Наличный' | 'Безналичный' | 'Карта' | 'Перевод';
  date_start: string;
  date_end: string;
  irrelevant?: number;
  departure_place_id?: Record<string, { lat: number; lon: number }> & { waypoints?: Array<{ place_id: number; lat: number; lon: number; name?: string }> };
  arrival_place_id?: Record<string, { lat: number; lon: number }>;
  status?: number;
  created_at?: string;
  updated_at?: string;
  company?: {
    id_company: string;
    name_company: string;
    unp: string;
    entity_type: string;
    ur_address: string;
    tel_1: string;
    tel_2?: string;
    email?: string;
  };
  car_type?: string;
  tip_zagryzki?: string;
}

export default function CargoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const cargoId = params['id'] as string;

  const [cargo, setCargo] = useState<CargoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carTypes, setCarTypes] = useState<Record<number, string>>({});
  const [loadTypes, setLoadTypes] = useState<Record<number, string>>({});

  useEffect(() => {
    loadCargoDetails();
    loadDictionaries();
  }, [cargoId]);

  const loadDictionaries = async () => {
    try {
      const [carTypesResponse, loadTypesResponse] = await Promise.all([
        getCarTypes(),
        getLoadTypes(),
      ]);

      if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
        const carTypesMap: Record<number, string> = {};
        carTypesResponse.data.forEach((type) => {
          carTypesMap[type.id_car_type] = type.car_type;
        });
        setCarTypes(carTypesMap);
      }

      if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
        const loadTypesMap: Record<number, string> = {};
        loadTypesResponse.data.forEach((type) => {
          loadTypesMap[type.id_tip_zagryzki] = type.tip_zagryzki;
        });
        setLoadTypes(loadTypesMap);
      }
    } catch (err) {
      console.error('Error loading dictionaries:', err);
    }
  };

  const loadCargoDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getCargoById(cargoId);
      setCargo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Загрузка данных груза...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !cargo) {
    return (
      <AppLayout>
        <div className=" flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Иконка */}
            <div className="flex justify-center">
              <div className="rounded-full bg-white/10 p-6 border border-white/20">
                <Package className="h-16 w-16 text-white/60" />
              </div>
            </div>

            {/* Заголовок и описание */}
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-white">
                Груз не найден
              </h1>
              <p className="text-white/60">
                {error || 'Запрашиваемый груз не найден или был удален'}
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 pt-4 w-full !max-w-[300px] mx-auto">
              <Button
                onClick={() => router.back()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться назад
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Header with title and cost */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 rounded-lg p-3">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Груз #{cargo.id_cargo}</h1>
                    <p className="text-muted-foreground">{carTypes[cargo.id_car_type] || cargo.car_type || 'Тип транспорта не указан'}</p>
                  </div>
                </div>
              </div>
              {/* Route section */}
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Маршрут
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-900/20 to-green-900/10 rounded-lg border border-green-900/30 p-4">
                    <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Отправление</div>
                    <div className="text-lg font-semibold text-foreground">
                      {cargo.departure_point}
                    </div>
                    {cargo.departure_place_id && Object.keys(cargo.departure_place_id).filter(k => k !== 'waypoints').length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {Object.entries(cargo.departure_place_id)
                          .filter(([key]) => key !== 'waypoints')
                          .map(([_, place]) => {
                            const placeData = place as { lat?: number; lon?: number };
                            return placeData?.lat !== undefined && placeData?.lon !== undefined
                              ? `${placeData.lat.toFixed(6)}, ${placeData.lon.toFixed(6)}`
                              : null;
                          })
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/20 to-purple-900/10 rounded-lg border border-purple-900/30 p-4">
                    <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Назначение</div>
                    <div className="text-lg font-semibold text-foreground">
                      {cargo.arrival_point}
                    </div>
                    {cargo.arrival_place_id && Object.keys(cargo.arrival_place_id).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {Object.entries(cargo.arrival_place_id).map(([_, place]) => {
                          const placeData = place as { lat?: number; lon?: number };
                          return placeData?.lat !== undefined && placeData?.lon !== undefined
                            ? `${placeData.lat.toFixed(6)}, ${placeData.lon.toFixed(6)}`
                            : null;
                        }).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Description */}
              {cargo.opisanie && (
                <Card className="bg-card border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Описание</h2>
                  <p className="text-foreground">{cargo.opisanie}</p>
                </Card>
              )}

              {/* Characteristics grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-900/10 to-green-900/5 border-green-900/30 p-6 text-center">
                  <Weight className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground uppercase mb-1">Масса</div>
                  <div className="text-3xl font-bold text-foreground">{cargo.tonn} т</div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/10 to-purple-900/5 border-purple-900/30 p-6 text-center">
                  <Box className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground uppercase mb-1">Объем</div>
                  <div className="text-3xl font-bold text-foreground">{cargo.m3} м³</div>
                </Card>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/10 to-blue-900/5 border-blue-900/30 p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Дата отправления</div>
                      <div className="font-semibold text-foreground">{formatDate(cargo.date_start)}</div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-amber-900/10 to-amber-900/5 border-amber-900/30 p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Дата прибытия</div>
                      <div className="font-semibold text-foreground">{formatDate(cargo.date_end)}</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Payment method */}
              <Card className="bg-gradient-to-br from-green-900/10 to-green-900/5 border-green-900/30 p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Способ оплаты</div>
                    <div className="font-semibold text-foreground">{cargo.payment}</div>
                  </div>
                </div>
              </Card>

              {/* Additional details */}
              <Card className="bg-card border-border p-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Характеристики</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Тип транспорта</div>
                      <div className="font-semibold text-foreground">{carTypes[cargo.id_car_type] || cargo.car_type || 'Не указан'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Тип загрузки</div>
                      <div className="font-semibold text-foreground">{loadTypes[cargo.id_tip_zagryzki] || cargo.tip_zagryzki || 'Не указан'}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Масса</div>
                      <div className="font-semibold text-foreground">{cargo.tonn} т</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Объём</div>
                      <div className="font-semibold text-foreground">{cargo.m3} м³</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">СТОИМОСТЬ</div>
                      <div className="text-2xl font-bold">{cargo.price && cargo.price !== '0' ? `${cargo.price} руб.` : 'Не указана'}</div>
                    </div>
                    {(loadTypes[cargo.id_tip_zagryzki] || cargo.tip_zagryzki) && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-amber-600 border-amber-600 text-white hover:bg-amber-700 hover:text-white"
                      >
                        {loadTypes[cargo.id_tip_zagryzki] || cargo.tip_zagryzki}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Связаться по грузу</h3>
                  <p className="text-sm text-muted-foreground">
                    Выберите удобный способ связи, чтобы обсудить условия перевозки, уточнить детали и сроки.
                  </p>

                  <div className="bg-muted/30 rounded border border-border p-3 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4 mb-2" />
                    Чат в разработке — скоро можно будет договариваться прямо здесь.
                    <div className="text-xs mt-2 text-muted-foreground">
                      ИСПОЛЬЗУЙТЕ КЛАССИЧЕСКИЕ КОНТАКТЫ ПОКА ФУНКЦИЯ ГОТОВИТСЯ
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cargo.company?.tel_1 && (
                      <div
                        className="flex items-center gap-2 p-2 px-6 rounded-lg w-full border border-border bg-muted/50 text-foreground hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(cargo.company!.tel_1);
                          showToast.success('Телефон скопирован в буфер обмена');
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {cargo.company.tel_1}
                      </div>
                    )}
                    {cargo.company?.tel_2 && (
                      <div
                        className="flex items-center gap-2 p-2 px-6 rounded-lg w-full border border-border bg-muted/50 text-foreground hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(cargo.company!.tel_2!);
                          showToast.success('Телефон скопирован в буфер обмена');
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {cargo.company.tel_2}
                      </div>
                    )}
                    {!cargo.company?.tel_1 && !cargo.company?.tel_2 && (
                      <div className="flex items-center gap-2 p-2 px-6 rounded-lg w-full border border-border bg-muted/50 text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        Телефон не указан
                      </div>
                    )}
                  </div>

                  {/* Кнопка поиска автомобилей для груза */}
                  {cargo.id_company && (
                    <Button
                      onClick={() => router.push(`/company/${cargo.id_company}/cargo/${cargoId}/car-search`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Найти автомобили для груза
                    </Button>
                  )}
                </div>

                {cargo.company && (
                  <Card className="bg-card border-border p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-600 rounded-lg p-2">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {cargo.company.name_company}
                        </p>
                        <p className="text-sm text-muted-foreground">{cargo.company.entity_type}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">УНП</p>
                        <p className="mt-1 font-medium text-foreground">
                          {cargo.company.unp}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Юр. адрес</p>
                        <p className="mt-1 font-medium text-foreground">
                          {cargo.company.ur_address}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

