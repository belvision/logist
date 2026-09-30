"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createCar, CarType, LoadType, getCarTypes, getLoadTypes } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

export function AddCarModal({ isOpen, onClose, onSuccess, companyId }: AddCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    id_car_type: 0,
    id_tip_zagryzki: 0,
    tonn_min: 0,
    tonn_max: 0,
    m3_min: 0,
    m3_max: 0,
    price: 0,
    subscription: false,
    search: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carTypesResponse, loadTypesResponse] = await Promise.all([
          getCarTypes(),
          getLoadTypes()
        ]);

        if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
          setCarTypes(carTypesResponse.data);
          if (carTypesResponse.data.length > 0) {
            setFormData(prev => ({ ...prev, id_car_type: carTypesResponse.data![0].id_car_type }));
          }
        }

        // Обрабатываем типы загрузки
        if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
          setLoadTypes(loadTypesResponse.data);
          if (loadTypesResponse.data.length > 0) {
            setFormData(prev => ({ ...prev, id_tip_zagryzki: loadTypesResponse.data![0].id_tip_zagryzki }));
          }
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки данных');
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await createCar({
        ...formData,
        id_company: companyId,
        status: null,
        places: {},
      });

      if (response.ok) {
        showToast.success('Автомобиль успешно добавлен');
        onSuccess();
        onClose();
        setFormData({
          title: '',
          id_car_type: carTypes[0]?.id_car_type || 0,
          id_tip_zagryzki: loadTypes[0]?.id_tip_zagryzki || 0,
          tonn_min: 0,
          tonn_max: 0,
          m3_min: 0,
          m3_max: 0,
          price: 0,
          subscription: false,
          search: false,
        });
      } else {
        throw new Error(response.error || 'Ошибка при добавлении автомобиля');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка добавления автомобиля');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          {/* Декоративный градиент */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Заголовок с иконкой */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Добавить автомобиль</h2>
                <p className="text-gray-600 text-sm hidden sm:block">Добавьте новый автомобиль в автопарк</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Название */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Название
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Например: MAN TGX"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Тип автомобиля и тип загрузки */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Тип автомобиля
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <select
                      value={formData.id_car_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_car_type: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                      required
                    >
                      {!Array.isArray(carTypes) || carTypes.length === 0 ? (
                        <option value="">Загрузка...</option>
                      ) : (
                        carTypes.map(type => (
                          <option key={type.id_car_type} value={type.id_car_type}>{type.car_type}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Тип загрузки
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <select
                      value={formData.id_tip_zagryzki}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_tip_zagryzki: Number(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                      required
                    >
                      {!Array.isArray(loadTypes) || loadTypes.length === 0 ? (
                        <option value="">Загрузка...</option>
                      ) : (
                        loadTypes.map(type => (
                          <option key={type.id_tip_zagryzki} value={type.id_tip_zagryzki}>{type.tip_zagryzki}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Грузоподъемность и объем */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Грузоподъемность (тонн)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.tonn_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, tonn_min: Number(e.target.value) }))}
                        placeholder="Мин."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.tonn_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, tonn_max: Number(e.target.value) }))}
                        placeholder="Макс."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Объем (м³)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.m3_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, m3_min: Number(e.target.value) }))}
                        placeholder="Мин."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.m3_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, m3_max: Number(e.target.value) }))}
                        placeholder="Макс."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Цена */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Цена
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="Введите цену"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    min="0"
                  />
                </div>
              </div>

              {/* Переключатели */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.subscription}
                    onChange={(e) => setFormData(prev => ({ ...prev, subscription: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Подписка</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.search}
                    onChange={(e) => setFormData(prev => ({ ...prev, search: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Поиск</span>
                </label>
              </div>

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-gray-50"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Добавление...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Добавить
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}