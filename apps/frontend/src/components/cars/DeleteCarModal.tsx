"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground mb-2">Удалить автомобиль?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Вы уверены, что хотите удалить автомобиль &quot;{carTitle}&quot;? Это действие нельзя отменить.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {loading ? "Удаление..." : "Удалить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
