import { AppLayout } from '@/components/layout/AppLayout';
import { CompanyOverview } from '@/components/company/CompanyOverview';

interface MainPageProps {
  params: Promise<{
    company_id: string;
  }>;
}

export default async function MainPage({ params }: MainPageProps) {
  const { company_id } = await params;
  
  return (
    <AppLayout>
      <div className="space-y-8">
        <CompanyOverview companyId={company_id} />

      </div>
    </AppLayout>
  );
}