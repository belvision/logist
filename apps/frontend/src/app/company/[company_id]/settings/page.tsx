import { AppLayout } from '@/components/layout/AppLayout';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Настройки</h1>

        <div className="bg-white rounded-lg shadow p-6">
          В разработке
        </div>
      </div>
    </AppLayout>
  );
}