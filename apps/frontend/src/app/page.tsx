'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Truck, Package } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleCarSearch = () => {
    // Переход на страницу поиска машин (публичная страница без авторизации)
    router.push('/car-search');
  };

  const handleCargoSearch = () => {
    // Переход на страницу поиска попутных грузов
    router.push('/cargo-search');
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">LogisticPro</h1>
            <p className="text-lg text-gray-600 mb-8">Система управления логистикой</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleCarSearch}
              className="w-full h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Truck className="mr-3 h-6 w-6" />
              Поиск машин
            </Button>
            
            <Button 
              onClick={handleCargoSearch}
              className="w-full h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Package className="mr-3 h-6 w-6" />
              Поиск грузов
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-8">
            Поиск автомобилей доступен без регистрации
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
