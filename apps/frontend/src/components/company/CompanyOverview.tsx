'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Package, 
  Route,
  Search,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/config';

interface CompanyStats {
  overview: {
    totalCars: number;
    activeCars: number;
    totalCargo: number;
    activeCargo: number;
    totalRoutes: number;
    recentCars: number;
    recentCargo: number;
    recentRoutes: number;
  };
  popularRoutes: Array<{
    route: string;
    count: number;
  }>;
  carTypes: Array<{
    type: string;
    count: number;
  }>;
  tonnage: {
    avgMin: number;
    avgMax: number;
    totalCapacity: number;
  };
  lastUpdated: string;
}

interface CompanyOverviewProps {
  companyId: string;
  currentUserId?: string;
  companyName?: string;
}


export function CompanyOverview({ companyId, currentUserId, companyName }: CompanyOverviewProps) {
  const router = useRouter();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/company/${companyId}/stats`, {
          credentials: 'include'
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch company stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching company stats:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Обновляем статистику каждые 5 минут
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="h-48 bg-gray-300 rounded"></div>
            <div className="h-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Ошибка загрузки статистики
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
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
    <div className="space-y-6">
      {/* Заголовок с быстрыми действиями */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Обзор компании</h1>
          <p className="text-gray-600 dark:text-gray-300">Статистика и управление вашей логистической компанией</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push(`/company/${companyId}/fleet`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Truck className="h-4 w-4 mr-2" />
            Автомобили
          </Button>
          <Button
            onClick={() => router.push(`/company/${companyId}/cargo`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Грузы
          </Button>
          <Button
            onClick={() => router.push(`/company/${companyId}/cargo-search`)}
            variant="outline"
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
          >
            <Search className="h-4 w-4 mr-2" />
            Поиск грузов
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Автомобили</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.totalCars}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats.overview.activeCars} активных
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Грузы</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.totalCargo}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stats.overview.activeCargo} активных
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Маршруты</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.totalRoutes}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {stats.overview.recentRoutes} новых
                </p>
              </div>
              <Route className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Общая грузоподъемность</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.tonnage.totalCapacity)} т
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats.tonnage.avgMin.toFixed(1)}-{stats.tonnage.avgMax.toFixed(1)} т средняя
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последняя активность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Последняя активность (7 дней)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Новые автомобили</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                +{stats.overview.recentCars}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Новые грузы</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                +{stats.overview.recentCargo}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Route className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">Новые маршруты</span>
              </div>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                +{stats.overview.recentRoutes}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Популярные маршруты и типы автомобилей */}
      {/* TODO: Добавить популярные маршруты и типы автомобилей */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              Популярные маршруты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularRoutes.slice(0, 5).map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 min-w-6 min-h-6 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{route.route}</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-700">
                    {route.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Типы автомобилей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.carTypes.slice(0, 5).map((type, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{type.type}</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                    {type.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Reviews Section */}
      {/* TODO: Добавить отзывы */}
      {/* <div className="mt-8">
        <CompanyReviewsSection 
          companyId={companyId} 
          companyName={companyName || 'Компания'}
          currentUserId={currentUserId || ''}
          canLeaveReview={true}
        />
      </div> */}
    </div>
  );
}
