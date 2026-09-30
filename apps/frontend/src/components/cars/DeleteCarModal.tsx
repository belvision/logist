"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteCar } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carId: number;
  carTitle: string;
}

export function DeleteCarModal({ isOpen, onClose, onSuccess, carId, carTitle }: DeleteCarModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteCar(carId.toString());
      if (response.ok) {
        showToast.success('Автомобиль успешно удален');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Ошибка при удалении автомобиля');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления автомобиля');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          {/* Декоративный градиент */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700"></div>
          
          <div className="p-4 sm:p-6">
            {/* Иконка предупреждения */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Заголовок */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2">
              Удалить автомобиль?
            </h3>

            {/* Описание */}
            <p className="text-gray-600 text-center mb-6">
              Вы уверены, что хотите удалить автомобиль &quot;{carTitle}&quot;? Это действие нельзя отменить.
            </p>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
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
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Удаление...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить
                  </div>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
