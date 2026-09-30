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
  Mail,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Package,
  Weight,
  Box,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useApiAuth } from '@/shared/hooks/useApiAuth';
import { API_BASE } from '@/lib/config';
import { messengerApi } from '@/shared/api/messengerApi';
import { useAuth } from '@/shared/context/auth-context';

interface CarDetails {
  id_cars: number;
  title?: string;
  tonn_min: number;
  tonn_max: number;
  m3_min: number;
  m3_max: number;
  price?: number;
  car_type?: string;
  tip_zagryzki?: string;
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
  const { fetchWithAuth } = useApiAuth();
  const { user } = useAuth();
  
  const carId = params['id'] as string;
  const companyId = params['company_id'] as string;

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    loadCarDetails();
  }, [carId]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetchWithAuth(`${API_BASE}/api/cars/${carId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка загрузки данных автомобиля');
      }

      const data = await response.json();
      setCar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!car || !user) return;

    try {
      setStartingChat(true);

      // Определяем ID владельца машины
      const ownerId = car.owner?.id_user || car.id_company;

      if (!ownerId) {
        throw new Error('Не удалось определить владельца автомобиля');
      }

      // Проверяем, не пытается ли пользователь написать самому себе
      if (ownerId === user.id_user) {
        alert('Вы не можете начать чат с самим собой');
        return;
      }

      // Создаем или получаем существующую беседу
      const conversation = await messengerApi.createConversation({
        userId: ownerId,
      });

      console.log('Created conversation:', conversation);

      // Проверяем, что беседа создана успешно
      if (!conversation || !conversation.id_conversation) {
        throw new Error('Не удалось создать беседу. Попробуйте еще раз.');
      }

      // Переходим в мессенджер с открытой беседой
      router.push(`/company/${companyId}/messenger?conversation=${conversation.id_conversation}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert(err instanceof Error ? err.message : 'Ошибка при создании беседы');
    } finally {
      setStartingChat(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Навигация */}
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к поиску
            </Button>
          </div>

          {/* Основная информация */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Левая колонка - детали автомобиля */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-8 w-8 text-blue-600" />
                      <div>
                        <CardTitle className="text-2xl">
                          {car.title || `Автомобиль #${car.id_cars}`}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          ID: {car.id_cars}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {car.car_type || 'Не указан'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Грузоподъемность */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <Weight className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Грузоподъемность</p>
                        <p className="text-2xl font-bold text-green-700">
                          {car.tonn_min} - {car.tonn_max} т
                        </p>
                      </div>
                    </div>

                    {/* Объем */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <Box className="h-6 w-6 text-purple-600 mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Объем</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {car.m3_min} - {car.m3_max} м³
                        </p>
                      </div>
                    </div>

                    {/* Тип загрузки */}
                    {car.tip_zagryzki && (
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                        <Package className="h-6 w-6 text-orange-600 mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Тип загрузки</p>
                          <p className="text-lg font-semibold text-orange-700">
                            {car.tip_zagryzki}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Цена */}
                    {car.price && car.price > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-blue-600 mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Цена</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {car.price} руб.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Местоположения */}
                  {car.places && Object.keys(car.places).length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Местоположения
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(car.places).map(([key, place]) => (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border ${
                              place.active !== false
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <p className="font-medium text-sm mb-1">
                              {place.label || `Точка ${key}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                            </p>
                            {place.active !== false && (
                              <Badge variant="secondary" className="mt-2 text-xs">
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
            </div>

            {/* Правая колонка - информация о компании и действия */}
            <div className="space-y-6">
              {/* Информация о компании */}
              {car.company && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-600" />
                      Компания
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="font-semibold text-lg mb-1">{car.company.name_company}</p>
                      <p className="text-sm text-muted-foreground">
                        {car.company.entity_type}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">УНП</p>
                        <p className="font-medium">{car.company.unp}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Адрес</p>
                        <p className="font-medium">{car.company.ur_address}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{car.company.tel_1}</p>
                          {car.company.tel_2 && (
                            <p className="text-muted-foreground">{car.company.tel_2}</p>
                          )}
                        </div>
                      </div>

                      {car.company.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{car.company.email}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Действия */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Действия</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {/* // TODO: Добавить кнопку написать водителю */}
                  {/* <Button
                    onClick={handleStartChat}
                    disabled={startingChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                        Написать водителю
                      </>
                    )}
                  </Button> */}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (car.company?.tel_1) {
                        window.location.href = `tel:${car.company.tel_1}`;
                      }
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Позвонить
                  </Button>

                  {car.company?.email && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (car.company?.email) {
                          window.location.href = `mailto:${car.company.email}`;
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Написать email
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

