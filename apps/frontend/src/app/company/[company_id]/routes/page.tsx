import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs } from '@/components/ui/tabs';
import { CalculationByCities, PaymentByAddress, Routes } from '@/components/routes';

interface RoutesPageProps {
  params: Promise<{
    company_id: string;
  }>;
}

export default async function RoutesPage({ params }: RoutesPageProps) {
  const { company_id } = await params;
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Маршруты</h1>

        <Tabs items={[
          { id: '0', label: 'Маршруты', content: <Routes companyId={company_id} /> },
          { id: '1', label: 'Расчет по городам', content: <CalculationByCities /> },
          { id: '2', label: 'Расчет по адресу', content: <PaymentByAddress /> },
        ]} />
      </div>
    </AppLayout>
  );
}
