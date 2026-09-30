"use client";

import React, { useState, useRef } from 'react';
import { uploadUserAvatar, deleteUserAvatar } from '@/shared/api/auth';
import { showToast, handleApiError } from '@/lib/toast';
import { User, Camera, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
// import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface AvatarUploadProps {
  avatarUrl?: string | undefined;
  onAvatarUpdate: (avatarUrl: string | undefined) => void;
}

export function AvatarUpload({ avatarUrl, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Валидация
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Неподдерживаемый формат файла. Используйте JPEG, PNG или WebP');
      return;
    }
    
    if (file.size > maxSize) {
      showToast.error('Файл превышает максимальный размер 2MB');
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const response = await uploadUserAvatar(file);
      
      if (response.ok && response.avatar_url) {
        showToast.success('Аватар успешно загружен');
        onAvatarUpdate(response.avatar_url);
        setPreviewUrl(null); // Очищаем превью
      } else {
        throw new Error(response.error || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки аватара');
      setPreviewUrl(null); // Очищаем превью при ошибке
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const response = await deleteUserAvatar();
      
      if (response.ok) {
        showToast.success('Аватар удален');
        onAvatarUpdate(undefined);
        setShowDeleteModal(false);
      } else {
        throw new Error(response.error || 'Ошибка удаления аватара');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка удаления аватара');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Фото профиля
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Добавьте фото, чтобы другие пользователи могли вас узнать
        </p>
      </div>

      {/* Аватар с эффектами */}
      <div className="flex justify-center">
        <div className="relative group">
          {/* Основной аватар */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-blue-100 dark:ring-gray-700 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-300 group-hover:ring-blue-200 dark:group-hover:ring-gray-600">
            {(previewUrl || avatarUrl) ? (
              <img
                src={previewUrl || avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400 dark:text-gray-500 transition-colors duration-300 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
              </div>
            )}
            
            {/* Overlay при наведении */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            
            {/* Индикатор загрузки */}
            {(uploading || deleting) && (
              <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white text-xs font-medium">
                    {uploading ? 'Загрузка...' : 'Удаление...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка загрузки */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center border-4 border-white dark:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group/btn"
          >
            <Camera className="w-5 h-5 transition-transform duration-200 group-hover/btn:scale-110" />
          </button>

          {/* Кнопка удаления */}
          {avatarUrl && !uploading && !deleting && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="absolute -top-2 -left-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center border-4 border-white dark:border-gray-800 group/delete"
            >
              <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover/delete:scale-110" />
            </button>
          )}
        </div>
      </div>

      {/* Скрытый input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Информация о требованиях */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>JPEG, PNG, WebP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>До 2MB</span>
          </div>
        </div>
        
        {uploading && (
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Загрузка аватара...</span>
          </div>
        )}
        
        {deleting && (
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Удаление аватара...</span>
          </div>
        )}
      </div>

      {/* Модалка подтверждения удаления */}
      {/* <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Удалить аватар"
        message="Вы уверены, что хотите удалить свой аватар? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        isLoading={deleting}
      /> */}
    </div>
  );
}

