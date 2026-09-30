'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Route,
  Zap,
  Plus,
  Users,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStatistics } from '@/shared/api/statistics';
import useCompanyStore from '@/store/company-store';

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


export function CompanyOverview({ companyId }: CompanyOverviewProps) {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStatistics(companyId);
        setStats(data as unknown as CompanyStats);
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
      <div className="space-y-4 md:space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 md:h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ошибка загрузки статистики
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatTonnage = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  // Данные для карточек статистики
  const statisticsCards = [
    {
      label: 'Автомобили',
      value: stats.overview.totalCars,
      subtitle: `${stats.overview.activeCars} активных`,
      icon: Truck,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      label: 'Грузы',
      value: stats.overview.totalCargo,
      subtitle: `${stats.overview.activeCargo} активных`,
      icon: Package,
    },
    {
      label: 'Маршруты',
      value: stats.overview.totalRoutes,
      subtitle: `${stats.overview.recentRoutes} новых`,
      icon: Route,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      label: 'Общая грузоподъемность',
      value: `${formatTonnage(stats.tonnage.totalCapacity)} т`,
      subtitle: `${stats.tonnage.avgMin.toFixed(1)}-${stats.tonnage.avgMax.toFixed(1)} т средний`,
      icon: Zap,
      hidden: selectedCompany?.id_tip_company === 1,
    },
  ];

  // Данные для последней активности
  const recentActivityItems = [
    {
      label: 'Новые автомобили',
      value: stats.overview.recentCars,
      icon: Truck,
      color: 'text-blue-500',
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      label: 'Новые грузы',
      value: stats.overview.recentCargo,
      icon: Package,
      color: 'text-green-500',
    },
    {
      label: 'Новые маршруты',
      value: stats.overview.recentRoutes,
      icon: Route,
      color: 'text-purple-500',
      hidden: selectedCompany?.id_tip_company === 1,
    },
  ];

  // Данные для быстрых действий
  const quickActions = [
    {
      title: 'Добавить автомобиль',
      description: 'Добавить новый автомобиль в парк',
      icon: Truck,
      bgColor: 'bg-blue-600',
      path: `/company/${companyId}/fleet`,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      title: 'Создать груз',
      description: 'Создать новый груз для перевозки',
      icon: Package,
      bgColor: 'bg-green-600',
      path: `/company/${companyId}/cargo`,
    },
    {
      title: 'Поиск грузов',
      description: 'Найти попутные грузы',
      icon: Search,
      bgColor: 'bg-purple-600',
      path: `/company/${companyId}/cargo-search`,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      title: 'Поиск автомобилей',
      description: 'Найти автомобили для груза',
      icon: Truck,
      bgColor: 'bg-orange-600',
      path: `/company/${companyId}/car-search`,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      title: 'Создать маршрут',
      description: 'Добавить постоянный маршрут',
      icon: Route,
      bgColor: 'bg-indigo-600',
      path: `/company/${companyId}/routes`,
      hidden: selectedCompany?.id_tip_company === 1,
    },
    {
      title: 'Управление командой',
      description: 'Добавить пользователей в компанию',
      icon: Users,
      bgColor: 'bg-pink-600',
      path: `/company/${companyId}/team`,
      hidden: selectedCompany?.id_tip_company === 1,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statisticsCards.filter((card) => !card.hidden).map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-card border border-border rounded-lg p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 md:mt-2">{card.subtitle}</p>
                </div>
                <div className="text-primary flex-shrink-0 ml-2">
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">Последняя активность (7 дней)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {recentActivityItems.filter((item) => !item.hidden).map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-2 md:gap-3">
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="font-medium text-xs md:text-sm text-foreground">{item.label}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">+{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
          Быстрые действия
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickActions.filter((action) => !action.hidden).map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(action.path)}
                className={`${action.bgColor} text-white rounded-lg p-4 md:p-6 text-left hover:shadow-lg transition-shadow w-full`}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs md:text-sm">{action.title}</p>
                    <p className="text-xs opacity-90 mt-1">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
