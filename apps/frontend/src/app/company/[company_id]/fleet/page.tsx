"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { FleetGridCard } from '@/components/cars/FleetGridCard';
import { AddCarModal } from '@/components/cars/AddCarModal';
import { EditCarModal } from '@/components/cars/EditCarModal';
import { DeleteCarModal } from '@/components/cars/DeleteCarModal';
import { Car, CarType, LoadType, getCompanyCars, getCarTypes, getLoadTypes } from '@/shared/api/cars';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/toast';
import { Truck, Plus } from 'lucide-react';
import { usePageHeader } from '@/shared/context/page-header-context';

function FleetPageHeader({ onAdd }: { onAdd: () => void }) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Автопарк',
      'Найдите подходящие автомобили для ваших грузоперевозок',
      undefined,
      <Button
        onClick={onAdd}
        className="bg-primary hover:bg-primary/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить автомобиль
      </Button>
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, [onAdd, setHeader]);

  return null;
}

export default function FleetPage() {
  const params = useParams();
  const companyId = params['company_id'] as string;
  const router = useRouter();

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

  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleEdit = (car: Car) => {
    setSelectedCar(car);
    setIsEditModalOpen(true);
  };

  const handleDelete = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleFindCargo = (carId: number) => {
    router.push(`/company/${companyId}/cars/${carId}/cargo-search`);
  };

  return (
    <AppLayout>
      <FleetPageHeader onAdd={openAddModal} />
      <div className="flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : cars.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Нет автомобилей</h3>
                <p className="text-muted-foreground">Добавьте свой первый автомобиль в автопарк</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <FleetGridCard
                  key={car.id_cars}
                  car={car}
                  carType={carTypes[car.id_car_type] || ""}
                  loadType={loadTypes[car.id_tip_zagryzki] || ""}
                  onEdit={() => handleEdit(car)}
                  onDelete={() => handleDelete(car)}
                  onFindCargo={handleFindCargo}
                />
              ))}
            </div>
          )}
        </div>
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