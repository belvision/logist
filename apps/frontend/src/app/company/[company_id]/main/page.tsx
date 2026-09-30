import { AppLayout } from '@/components/layout/AppLayout';

export default function MainPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Главная</h1>

        <div className="bg-white rounded-lg shadow p-6">
          В разработке
        </div>
      </div>
    </AppLayout>
  );
}