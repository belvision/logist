"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CarImageUploadProps {
  images: File[];
  onImagesUpdate: (images: File[]) => void;
  existingImages?: string[];
  onDeleteExisting?: (imageUrl: string) => void | Promise<void>;
  maxImages?: number;
}

export function CarImageUpload({
  images,
  onImagesUpdate,
  existingImages = [],
  onDeleteExisting,
  maxImages = 5
}: CarImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = images.length + existingImages.length;

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

    if (currentCount + files.length > maxImages) {
      showToast.error(`Максимум ${maxImages} изображений на автомобиль`);
      return;
    }

    onImagesUpdate([...images, ...files]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = (index: number) => {
    const nextImages = images.filter((_, i) => i !== index);
    onImagesUpdate(nextImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          Изображения автомобиля
        </label>
        <span className="text-xs text-gray-500">
          {existingImages.length + images.length}/{maxImages}
        </span>
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {existingImages.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-${index}`}
              className="relative group aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
            >
              <img
                src={imageUrl}
                alt={`Car image ${index + 1}`}
                className="w-full h-full object-fill"
              />
              {onDeleteExisting && (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(imageUrl)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className="relative group aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
            >
              <img
                src={preview.url}
                alt={`Car image ${index + 1}`}
                className="w-full h-full object-fill"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {existingImages.length + images.length < maxImages && (
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
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 py-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <Upload className="w-5 h-5" />
              <span>Загрузить изображения</span>
              <span className="text-xs text-gray-400">(до {maxImages - (existingImages.length + images.length)} файлов)</span>
            </div>
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Поддерживаемые форматы: JPEG, PNG, WebP, GIF. Максимальный размер: 5MB
          </p>
        </div>
      )}

      {existingImages.length + images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p className="text-sm">Нет изображений</p>
        </div>
      )}
    </div>
  );
}

