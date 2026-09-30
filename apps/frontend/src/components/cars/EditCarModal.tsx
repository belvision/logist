"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Car, CarType, LoadType, getCarTypes, getLoadTypes, updateCar } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';
import { getCookie } from 'cookies-next';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  car: Car;
}

export function EditCarModal({ isOpen, onClose, onSuccess, car }: EditCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  
  const [formData, setFormData] = useState<Car>(car);
  const [newPlaceId, setNewPlaceId] = useState<string>("");
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState<string>("");
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carTypesData, loadTypesData] = await Promise.all([
          getCarTypes(),
          getLoadTypes()
        ]);
        setCarTypes(carTypesData.data ?? []);
        setLoadTypes(loadTypesData.data ?? []);
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки данных');
      }
    };
    if (isOpen) {
      fetchData();
      setFormData(car);
    }
  }, [isOpen, car]);

  // Search places using Nominatim
  const searchPlaces = async (query: string) => {
    const q = query.trim();
    if (q.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555';
      const token = getCookie('access_token');
      const authHeaders: HeadersInit = {};
      if (token) {
        (authHeaders as any).Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/nominatim/places/search?q=${encodeURIComponent(q)}`, {
        credentials: 'include',
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        setPlaceSuggestions([]);
        return;
      }
      const data = await res.json();
      setPlaceSuggestions(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setPlaceSuggestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await updateCar(car.id_cars.toString(), formData);
      if (response.ok) {
        showToast.success('Автомобиль успешно обновлен');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Ошибка при обновлении автомобиля');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка обновления автомобиля');
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Редактировать автомобиль</h2>
                <p className="text-gray-600 text-sm hidden sm:block">Измените данные автомобиля</p>
              </div>
            </div>
            
            {/* Города доступности */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">Города доступности</label>
              </div>
              <div className="space-y-2">
                {Object.entries(formData.places || {}).length === 0 && (
                  <div className="text-sm text-gray-500">Список пуст</div>
                )}
                {Object.entries(formData.places || {}).map(([pid, place]) => (
                  <div key={pid} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={place.label || pid}
                      onChange={(e) => {
                        const next = { ...(formData.places || {}) } as any;
                        next[pid] = { ...place, label: e.target.value };
                        setFormData(prev => ({ ...prev, places: next }));
                      }}
                      className="flex-1 px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-1 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={place.active !== false}
                        onChange={(e) => {
                          const next = { ...(formData.places || {}) } as any;
                          next[pid] = { ...place, active: e.target.checked };
                          setFormData(prev => ({ ...prev, places: next }));
                        }}
                      />
                      Активен
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = { ...(formData.places || {}) } as any;
                        delete next[pid];
                        setFormData(prev => ({ ...prev, places: next }));
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={placeSearchQuery}
                    onChange={(e) => {
                      setPlaceSearchQuery(e.target.value);
                      searchPlaces(e.target.value);
                    }}
                    placeholder="Поиск города..."
                    className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {placeSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full border border-gray-300 bg-white rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                      {placeSuggestions.map((item: any, idx: number) => (
                        <li
                          key={idx}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                          onClick={() => {
                            const placeId = Object.keys(item.place || {})[0];
                            const coords = placeId ? item.place[placeId] : undefined;
                            setPlaceSearchQuery(item.label);
                            setNewPlaceId(placeId || '');
                            setNewPlaceCoords(coords || null);
                            setPlaceSuggestions([]);
                          }}
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (!newPlaceId.trim() || !newPlaceCoords) return;
                    const next = { ...(formData.places || {}) } as any;
                    next[newPlaceId.trim()] = { 
                      lat: newPlaceCoords.lat, 
                      lon: newPlaceCoords.lon, 
                      label: placeSearchQuery, 
                      active: true 
                    };
                    setFormData(prev => ({ ...prev, places: next }));
                    setNewPlaceId("");
                    setNewPlaceCoords(null);
                    setPlaceSearchQuery("");
                  }}
                  disabled={!newPlaceId.trim() || !newPlaceCoords}
                  className="w-full"
                >
                  Добавить город
                </Button>
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
                      {carTypes.map(type => (
                        <option key={type.id_car_type} value={type.id_car_type}>{type.car_type}</option>
                      ))}
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
                      {loadTypes.map(type => (
                        <option key={type.id_tip_zagryzki} value={type.id_tip_zagryzki}>{type.tip_zagryzki}</option>
                      ))}
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
                      Сохранение...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Сохранить
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
