'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Search,
  Truck,
  Package,
  Route,
  Users,
  Settings,
  BarChart3,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/config';

interface QuickActionsProps {
  companyId: string;
}

interface AnalyticsData {
  overview: {
    fleetUtilization: number;
    fuelSavings: number;
    avgTravelTime: string;
    companyRating: string;
  };
  analytics: {
    fleetUtilization: {
      value: number;
      description: string;
      trend: string;
    };
    fuelSavings: {
      value: number;
      description: string;
      trend: string;
    };
    avgTravelTime: {
      value: string;
      description: string;
      trend: string;
    };
    companyRating: {
      value: string;
      description: string;
      trend: string;
    };
  };
}


export function QuickActions({ companyId }: QuickActionsProps) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/company/${companyId}/analytics`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        // setLoading(false);
      }
    };

    fetchAnalytics();
  }, [companyId]);

  const actions = [
    {
      title: 'Добавить автомобиль',
      description: 'Добавить новый автомобиль в парк',
      icon: Truck,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => router.push(`/company/${companyId}/fleet`)
    },
    {
      title: 'Создать груз',
      description: 'Создать новый груз для перевозки',
      icon: Package,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => router.push(`/company/${companyId}/cargo`)
    },
    {
      title: 'Поиск грузов',
      description: 'Найти попутные грузы',
      icon: Search,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => router.push(`/company/${companyId}/cargo-search`)
    },
    {
      title: 'Поиск автомобилей',
      description: 'Найти автомобили для груза',
      icon: Truck,
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => router.push(`/company/${companyId}/car-search`)
    },
    {
      title: 'Создать маршрут',
      description: 'Добавить постоянный маршрут',
      icon: Route,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      onClick: () => router.push(`/company/${companyId}/routes`)
    },
    {
      title: 'Управление командой',
      description: 'Добавить пользователей в компанию',
      icon: Users,
      color: 'bg-pink-600 hover:bg-pink-700',
      onClick: () => router.push(`/company/${companyId}/team`)
    }
  ];

  const quickStats = analytics ? [
    {
      title: 'Средняя загрузка',
      value: `${analytics.overview.fleetUtilization}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: analytics.analytics.fleetUtilization.description,
      trend: analytics.analytics.fleetUtilization.trend
    },
    {
      title: 'Время в пути',
      value: analytics.overview.avgTravelTime,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: analytics.analytics.avgTravelTime.description,
      trend: analytics.analytics.avgTravelTime.trend
    },
    {
      title: 'Экономия топлива',
      value: `${analytics.overview.fuelSavings}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: analytics.analytics.fuelSavings.description,
      trend: analytics.analytics.fuelSavings.trend
    },
    {
      title: 'Рейтинг',
      value: analytics.overview.companyRating,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: analytics.analytics.companyRating.description,
      trend: analytics.analytics.companyRating.trend
    }
  ] : [
    // Fallback данные при загрузке
    {
      title: 'Средняя загрузка',
      value: '73%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Использование парка',
      trend: 'stable'
    },
    {
      title: 'Время в пути',
      value: '2.4ч',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Среднее время',
      trend: 'stable'
    },
    {
      title: 'Экономия топлива',
      value: '15%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Благодаря попутным грузам',
      trend: 'stable'
    },
    {
      title: 'Рейтинг',
      value: '4.8★',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Средняя оценка',
      trend: 'stable'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5 text-blue-600" />
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`${action.color} text-white h-auto p-4 flex flex-col items-start text-left`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{action.title}</span>
                  </div>
                  <p className="text-sm opacity-90">{action.description}</p>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Аналитические показатели */}
      {/* TODO: Добавить аналитические показатели */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Аналитические показатели
            {loading && (
              <div className="ml-2">
                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-6 w-6 bg-gray-300 rounded"></div>
                    <div className="text-right">
                      <div className="h-8 w-12 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 w-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                const getTrendIcon = (trend: string) => {
                  if (trend === 'up') return '📈';
                  if (trend === 'down') return '📉';
                  return '➡️';
                };
                
                return (
                  <div key={index} className={`${stat.bgColor} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        {stat.trend && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getTrendIcon(stat.trend)}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
