"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { CalculationByCities, PaymentByAddress, Routes } from '@/components/routes';
import { usePageHeader } from '@/shared/context/page-header-context';
import { Navigation, MapPin, Calculator, Plus } from 'lucide-react';
import { AddRouteModal } from '@/components/routes/AddRouteModal';
import { useParams } from 'next/navigation';

function RoutesPageHeader({ onAdd }: { onAdd: () => void }) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Маршруты',
      'Управление маршрутами и расчет стоимости перевозок',
      undefined,
      <Button
        onClick={onAdd}
        className="bg-primary hover:bg-primary/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить маршрут
      </Button>
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, [onAdd, setHeader]);

  return null;
}

export default function RoutesPage() {
  const params = useParams();
  const companyId = params?.['company_id'] as string;
  const [activeTab, setActiveTab] = useState<'routes' | 'cities' | 'address'>('routes');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const refreshRoutesRef = useRef<(() => Promise<void>) | null>(null);

  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  return (
    <AppLayout>
      <RoutesPageHeader onAdd={openAddModal} />
      <div className="flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto py-8">
          {/* Tabs Navigation */}
          <div className="border-b border-border mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('routes')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'routes'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Navigation className="h-4 w-4" />
                Маршруты
              </button>
              <button
                onClick={() => setActiveTab('cities')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'cities'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <MapPin className="h-4 w-4" />
                Расчет по городам
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'address'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Calculator className="h-4 w-4" />
                Расчет по адресу
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'routes' && <Routes onRefreshReady={(fn) => { refreshRoutesRef.current = fn; }} />}
          {activeTab === 'cities' && <CalculationByCities />}
          {activeTab === 'address' && <PaymentByAddress />}
        </div>
      </div>

      {/* Модальное окно для добавления маршрута */}
      <AddRouteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          setIsAddModalOpen(false);
          // Вызываем функцию обновления из Routes компонента
          if (refreshRoutesRef.current) {
            await refreshRoutesRef.current();
          }
        }}
        companyId={companyId}
      />
    </AppLayout>
  );
}
