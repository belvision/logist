"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { CarCard } from '@/components/cars/CarCard';
import { AddCarModal } from '@/components/cars/AddCarModal';
import { EditCarModal } from '@/components/cars/EditCarModal';
import { DeleteCarModal } from '@/components/cars/DeleteCarModal';
import { Car, CarType, LoadType, getCompanyCars, getCarTypes, getLoadTypes, toggleCarFlags } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';

export default function FleetPage() {
  const params = useParams();
  const companyId = params.company_id as string;

  const [cars, setCars] = useState<Car[]>([]);
  const [carTypes, setCarTypes] = useState<Record<number, string>>({});
  const [loadTypes, setLoadTypes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const fetchData = async () => {
    try {
      const [carsResponse, carTypesResponse, loadTypesResponse] = await Promise.all([
        getCompanyCars(companyId),
        getCarTypes(),
        getLoadTypes()
      ]);

      // Обрабатываем данные автомобилей
      if (carsResponse.ok && Array.isArray(carsResponse.data)) {
        setCars(carsResponse.data);
      }
      
      // Преобразуем типы автомобилей в объект для быстрого доступа
      const carTypesMap: Record<number, string> = {};
      if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
        carTypesResponse.data.forEach((type: CarType) => {
          carTypesMap[type.id_car_type] = type.car_type;
        });
      }
      setCarTypes(carTypesMap);

      // Преобразуем типы загрузки в объект для быстрого доступа
      const loadTypesMap: Record<number, string> = {};
      if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
        loadTypesResponse.data.forEach((type: LoadType) => {
          loadTypesMap[type.id_tip_zagryzki] = type.tip_zagryzki;
        });
      }
      setLoadTypes(loadTypesMap);
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleEdit = (car: Car) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const handleDelete = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleToggleFlags = async (carId: string, flags: { subscription?: boolean; search?: boolean }) => {
    try {
      const response = await toggleCarFlags(carId, flags);
      if (response.ok) {
        await fetchData(); // Обновляем данные после успешного изменения
      }
    } catch (error) {
      handleApiError(error, 'Ошибка изменения статуса автомобиля');
    }
  };

  console.log(cars);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Заголовок и кнопка добавления */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Автопарк</h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить автомобиль
          </Button>
        </div>

        {/* Список автомобилей */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Нет автомобилей</h3>
              <p className="text-gray-600">Добавьте свой первый автомобиль в автопарк</p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2"
              >
                Добавить автомобиль
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, index) => (
              <CarCard
                key={car.id_car_type + index}
                car={car}
                carType={carTypes[car.id_car_type]}
                loadType={loadTypes[car.id_tip_zagryzki]}
                onEdit={() => handleEdit(car)}
                onDelete={() => handleDelete(car)}
                onToggleFlags={handleToggleFlags}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <AddCarModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        companyId={companyId}
      />

      {selectedCar && (
        <>
          <EditCarModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedCar(null);
            }}
            onSuccess={fetchData}
            car={selectedCar}
          />

          <DeleteCarModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedCar(null);
            }}
            onSuccess={fetchData}
            carId={selectedCar.id_cars}
            carTitle={selectedCar.title}
          />
        </>
      )}
    </AppLayout>
  );
}