'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Truck, 
  Package, 
  Route, 
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface StatsData {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalCars: number;
    totalCargo: number;
    totalRoutes: number;
    activeCars: number;
    activeCargo: number;
    recentCars: number;
    recentCargo: number;
  };
  popularRoutes: Array<{
    route: string;
    count: number;
  }>;
  topCities: Array<{
    city: string;
    count: number;
  }>;
  lastUpdated: string;
}


export function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Обновляем статистику каждые 5 минут
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Не удалось загрузить статистику</p>
          </div>
        </div>
      </section>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            LogistGo.pro в цифрах
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Активная платформа для грузоперевозок
          </p>
        </div>

        {/* Основная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(stats.overview.totalUsers)}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Пользователей</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(stats.overview.totalCompanies)}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Компаний</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Truck className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(stats.overview.activeCars)}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Активных автомобилей</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Package className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(stats.overview.activeCargo)}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Активных грузов</p>
            </CardContent>
          </Card>
        </div>

        {/* Последняя активность */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Последняя активность
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Новые автомобили</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                    +{stats.overview.recentCars} за 24ч
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Новые грузы</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                    +{stats.overview.recentCargo} за 24ч
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Популярные маршруты
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {stats.popularRoutes.slice(0, 3).map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Route className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{route.route}</span>
                    </div>
                    <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                      {route.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Топ города */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
              <MapPin className="h-6 w-6 text-red-600 dark:text-red-400" />
              Топ городов отправления
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topCities.map((city, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-600 dark:bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{city.city}</span>
                  </div>
                  <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">
                    {city.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Время последнего обновления */}
        {/* <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Последнее обновление: {new Date(stats.lastUpdated).toLocaleString('ru-RU')}
          </p>
        </div> */}
      </div>
    </section>
  );
}
