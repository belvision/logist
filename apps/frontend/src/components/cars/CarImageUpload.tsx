"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadCarImages, deleteCarImage } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface CarImageUploadProps {
  carId: number;
  images: string[];
  onImagesUpdate: (images: string[]) => void;
}

export function CarImageUpload({ carId, images, onImagesUpdate }: CarImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Валидация
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showToast.error(`Файл ${file.name} имеет неподдерживаемый формат`);
        return;
      }
      if (file.size > maxSize) {
        showToast.error(`Файл ${file.name} превышает максимальный размер 5MB`);
        return;
      }
    }

    if (images.length + files.length > 5) {
      showToast.error('Максимум 5 изображений на автомобиль');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadCarImages(carId, files);
      
      if (response.ok && response.data) {
        showToast.success('Изображения успешно загружены');
        onImagesUpdate(response.data);
      } else {
        throw new Error(response.error || 'Ошибка загрузки изображений');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки изображений');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Удалить это изображение?')) return;

    try {
      const response = await deleteCarImage(carId, imageUrl);
      
      if (response.ok) {
        showToast.success('Изображение удалено');
        onImagesUpdate(images.filter(img => img !== imageUrl));
      } else {
        throw new Error(response.error || 'Ошибка удаления изображения');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления изображения');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          Изображения автомобиля
        </label>
        <span className="text-xs text-gray-500">
          {images.length}/5
        </span>
      </div>

      {/* Превью изображений */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all">
              <img
                src={imageUrl}
                alt={`Car image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(imageUrl)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка загрузки */}
      {images.length < 5 && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 py-6"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Загрузка...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <Upload className="w-5 h-5" />
                <span>Загрузить изображения</span>
                <span className="text-xs text-gray-400">(до {5 - images.length} файлов)</span>
              </div>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Поддерживаемые форматы: JPEG, PNG, WebP, GIF. Максимальный размер: 5MB
          </p>
        </div>
      )}

      {/* Заглушка, если нет изображений */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p className="text-sm">Нет изображений</p>
        </div>
      )}
    </div>
  );
}

