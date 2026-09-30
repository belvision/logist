'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyRedirect } from "@/shared/hooks";

export default function Home() {
  // Используем хук для автоматического перенаправления
  useCompanyRedirect();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель управления LogisticPro</h1>

        <div className="bg-white rounded-lg shadow p-6">
          Перенаправление на выбранную компанию...
        </div>
      </div>
    </AppLayout>
  );
}
