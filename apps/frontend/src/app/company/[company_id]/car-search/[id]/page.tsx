'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Building2,
  Phone,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Package,
  Weight,
  Box,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { getCarById } from '@/shared/api/cars';
import { showToast } from '@/lib/toast';
import Image from 'next/image';

interface CarDetails {
  id_cars: number;
  phone?: string;
  title?: string;
  year?: number | null;
  tonn_min: number;
  tonn_max: number;
  m3_min: number;
  m3_max: number;
  price?: number;
  car_type?: string;
  tip_zagryzki?: string;
  images?: string[];
  id_company: string;
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
  places?: Record<string, { lat: number; lon: number; label?: string; active?: boolean }>;
  owner?: {
    id_user: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  // const { user } = useAuth();
  
  const carId = params['id'] as string;
  // const companyId = params['company_id'] as string;

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // TODO: Активировать чат с водителем при готовности функциональности.
  // const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    loadCarDetails();
  }, [carId]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getCarById(carId);
      if (result.ok && result.data) {
        setCar(result.data);
      } else {
        throw new Error(result.error || 'Ошибка загрузки данных автомобиля');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // const handleStartChat = async () => {
  //   if (!car || !user) return;
  //
  //   try {
  //     setStartingChat(true);
  //
  //     // Определяем ID владельца машины
  //     const ownerId = car.owner?.id_user || car.id_company;
  //
  //     if (!ownerId) {
  //       throw new Error('Не удалось определить владельца автомобиля');
  //     }
  //
  //     // Проверяем, не пытается ли пользователь написать самому себе
  //     if (ownerId === user.id_user) {
  //       alert('Вы не можете начать чат с самим собой');
  //       return;
  //     }
  //
  //     // Создаем или получаем существующую беседу
  //     const conversation = await messengerApi.createConversation({
  //       userId: ownerId,
  //     });
  //
  //     console.log('Created conversation:', conversation);
  //
  //     // Проверяем, что беседа создана успешно
  //     if (!conversation || !conversation.id_conversation) {
  //       throw new Error('Не удалось создать беседу. Попробуйте еще раз.');
  //     }
  //
  //     // Переходим в мессенджер с открытой беседой
  //     router.push(`/company/${companyId}/messenger?conversation=${conversation.id_conversation}`);
  //   } catch (err) {
  //     console.error('Failed to start chat:', err);
  //     alert(err instanceof Error ? err.message : 'Ошибка при создании беседы');
  //   } finally {
  //     setStartingChat(false);
  //   }
  // };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Загрузка данных автомобиля...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !car) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || 'Автомобиль не найден'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen ">
        <div className="relative overflow-hidden">
          <div className="relative z-10">
            <div className="container mx-auto px-2 py-10">
              {/* Навигация */}
              <div className="flex items-center justify-between mb-8">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="border-transparent bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к поиску
                </Button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Левая колонка - основной блок */}
                <div className="xl:col-span-2 space-y-8">
                  <Card className="border-none bg-white/5 backdrop-blur-sm shadow-2xl shadow-blue-950/30">
                    <CardHeader className="pb-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20">
                            <Truck className="h-8 w-8 text-blue-300" />
                          </span>
                          <div>
                            <CardTitle className="text-3xl font-semibold text-white">
                              {car.title || `Автомобиль #${car.id_cars}`}
                            </CardTitle>
                            <p className="text-sm text-blue-100/70 mt-2">
                              {car.car_type || 'Тип транспортного средства не указан'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          {car.price && car.price > 0 && (
                            <div className="flex items-center gap-3 rounded-xl border border-blue-200/40 bg-blue-500/15 px-4 py-2 text-white">
                              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/25">
                                <DollarSign className="h-6 w-6 text-blue-50" />
                              </span>
                              <div className="text-left">
                                <p className="text-xs uppercase tracking-wide text-blue-50/80">
                                  Стоимость
                                </p>
                                <p className="text-lg font-semibold">
                                  {car.price.toLocaleString('ru-RU')} руб.
                                </p>
                              </div>
                            </div>
                          )}
                          {car.tip_zagryzki && (
                            <div className="flex items-center gap-3 rounded-xl border border-amber-200/40 bg-amber-500/15 px-4 py-2 text-white">
                              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/25">
                                <Package className="h-6 w-6 text-amber-50" />
                              </span>
                              <span className="text-base font-medium">{car.tip_zagryzki}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {car.images && car.images.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                          {car.images.map((imageUrl, index) => (
                            <div
                              key={`${imageUrl}-${index}`}
                              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 w-fit"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                              <img
                                src={imageUrl}
                                alt={`Изображение автомобиля ${index + 1}`}
                                className="h-70 w-70 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {index === 0 && (
                                <span className="absolute top-4 left-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white backdrop-blur">
                                  Основное фото
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-200/25 bg-emerald-500/10 p-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                              <Weight className="h-6 w-6 text-emerald-200" />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-emerald-100/70">
                                Грузоподъемность
                              </p>
                              <p className="text-2xl font-semibold text-white">
                                {car.tonn_max} т
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-purple-200/25 bg-purple-500/10 p-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                              <Box className="h-6 w-6 text-purple-200" />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-purple-100/70">
                                Полезный объем
                              </p>
                              <p className="text-2xl font-semibold text-white">
                                {car.m3_max} м³
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {car.tip_zagryzki && (
                        <div className="rounded-2xl border border-amber-200/25 bg-amber-500/10 p-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                              <Package className="h-6 w-6 text-amber-200" />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-amber-100/70">
                                Тип загрузки
                              </p>
                              <p className="text-lg font-medium text-white">{car.tip_zagryzki}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {car.places && Object.keys(car.places).length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                              <MapPin className="h-5 w-5 text-blue-200" />
                            </span>
                            География присутствия
                          </h3>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {Object.entries(car.places).map(([key, place]) => (
                              <div
                                key={key}
                                className={`rounded-xl border bg-gradient-to-br p-4 text-sm ${
                                  place.active !== false
                                    ? 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-400/20'
                                    : 'from-slate-900/60 to-transparent border-white/5'
                                }`}
                              >
                                <p className="text-base font-medium text-white/90">
                                  {place.label || `Точка ${key}`}
                                </p>
                                {place.active !== false && (
                                  <Badge variant="secondary" className="mt-3 bg-white/10 text-white">
                                    Активна
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="border-none bg-white/5 p-6 backdrop-blur">
                      <h3 className="text-lg font-semibold text-white">Характеристики</h3>
                      <div className="mt-4 space-y-3 text-sm text-white/80">
                        {/* <div className="flex justify-between border-b border-white/10 pb-2">
                          <span>Минимальная масса</span>
                          <span>{car.tonn_min} т</span>
                        </div> */}
                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span>Максимальная масса</span>
                          <span>{car.tonn_max} т</span>
                        </div>

                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span>Максимальный объем</span>
                          <span>{car.m3_max} м³</span>
                        </div>

                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span>Год выпуска</span>
                          <span>{car.year ? `${car.year} год` : 'Не указан'}</span>
                        </div>
                      </div>
                    </Card>

                    {/* <Card className="border-none bg-white/5 p-6 backdrop-blur">
                      <h3 className="text-lg font-semibold text-white">Контактные данные</h3>
                      <div className="mt-4 space-y-3 text-sm text-white/80">
                        {car.company?.tel_1 && (
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="flex items-center gap-2 text-sm text-white/60">
                              <Phone className="h-4 w-4" />
                              Основной телефон
                            </span>
                            <span className="text-base font-semibold text-white">
                              {car.company.tel_1}
                            </span>
                          </div>
                        )}
                        {car.company?.tel_2 && (
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="flex items-center gap-2 text-sm text-white/60">
                              <Phone className="h-4 w-4" />
                              Доп. телефон
                            </span>
                            <span className="text-base font-semibold text-white">
                              {car.company.tel_2}
                            </span>
                          </div>
                        )}
                        {car.company?.email && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-white/60">
                              <Mail className="h-4 w-4" />
                              Электронная почта
                            </span>
                            <span className="text-base font-semibold text-white">
                              {car.company.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card> */}
                  </div>
                </div>

                {/* Правая колонка - компания и действия */}
                <div className="space-y-6">
                  {car.company && (
                    <Card className="border-none bg-white/5 p-6 backdrop-blur">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                          <Building2 className="h-6 w-6 text-white" />
                        </span>
                        <div>
                          <p className="text-xl font-semibold text-white">
                            {car.company.name_company}
                          </p>
                          <p className="mt-1 text-sm text-white/60">{car.company.entity_type}</p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">УНП</p>
                          <p className="mt-1 text-base font-medium text-white/90">
                            {car.company.unp}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">Юр. адрес</p>
                          <p className="mt-1 text-base font-medium text-white/90">
                            {car.company.ur_address}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="border-none bg-blue-500/10 p-6 backdrop-blur">
                    <h3 className="text-lg font-semibold text-white">Связаться по объявлению</h3>
                    <p className="mt-2 text-sm text-white/70">
                      Выберите удобный способ связи, чтобы обсудить условия сотрудничества, уточнить
                      наличие и сроки.
                    </p>

                    <div className="mt-4  flex items-start gap-3  rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      <span className="mt-1 flex flex-1 h-8 w-8 min-w-8 min-h-8 items-center justify-center rounded-full bg-white/10">
                        <MessageSquare className="h-4 w-4 text-white/80" />
                      </span>
                      <div>
                        <p className="font-medium text-white">
                          Чат в разработке — скоро можно будет договариваться прямо здесь.
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
                          Используйте классические контакты пока функция готовится
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {/* Резервная кнопка для быстрого чата. Оставляем в дизайне как скрытую опцию. */}
                      {/* <Button
                        onClick={handleStartChat}
                        disabled={startingChat}
                        className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                        size="lg"
                      >
                        {startingChat ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Создание чата...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Написать в чат
                          </>
                        )}
                      </Button> */}

                      <div
                        className="flex items-center gap-2 p-2 px-6 rounded-lg w-full border-white/10 bg-white/10 text-white hover:bg-white/2 cursor-pointer"
                        onClick={() => car.phone && navigator.clipboard.writeText(car.phone).then(() => showToast.success('Телефон скопирован в буфер обмена'))}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {car.phone ? car.phone : 'Телефон не указан'}
                      </div>

                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

