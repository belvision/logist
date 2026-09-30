'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from "lucide-react";
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { newPassword: string; confirmPassword: string }) => Promise<void>;
}

export function ChangePasswordModal({ isOpen, onClose, onSubmit }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; level: string; isValid: boolean } | null>(null);

  // Очистка состояния при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(null);
      setErrors({});
    }
  }, [isOpen]);

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStrength(null);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Валидация
    const validationErrors: Record<string, string> = {};
    
    if (!newPassword) {
      validationErrors['newPassword'] = 'Пароль обязателен';
    } else if (newPassword.length < 8) {
      validationErrors['newPassword'] = 'Пароль должен содержать минимум 8 символов';
    } else if (passwordStrength && !passwordStrength.isValid) {
      validationErrors['newPassword'] = 'Пароль не соответствует требованиям безопасности';
    }
    
    if (!confirmPassword) {
      validationErrors['confirmPassword'] = 'Подтверждение пароля обязательно';
    } else if (newPassword !== confirmPassword) {
      validationErrors['confirmPassword'] = 'Пароли не совпадают';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit({ newPassword, confirmPassword });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(null);
      setErrors({});
      onClose();
    }
    catch {}
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground">Смена пароля</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Новый пароль</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors['newPassword']) {
                  setErrors((prev) => ({ ...prev, 'newPassword': '' }));
                }
              }}
              placeholder="Введите новый пароль"
              className={`text-sm md:text-base ${errors['newPassword'] ? 'border-destructive' : ''}`}
            />
            <PasswordStrengthIndicator
              password={newPassword}
              onStrengthChange={setPasswordStrength}
              showSuggestions={true}
              className="mt-2"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground mb-1.5 md:mb-2">Подтвердите пароль</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors['confirmPassword']) {
                  setErrors((prev) => ({ ...prev, 'confirmPassword': '' }));
                }
              }}
              placeholder="Подтвердите новый пароль"
              className={`text-sm md:text-base ${errors['confirmPassword'] ? 'border-destructive' : ''}`}
            />
            {errors['confirmPassword'] && (
              <p className="text-xs md:text-sm text-destructive mt-1 flex items-center">
                <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="break-words">{errors['confirmPassword']}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4 md:mt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent text-sm md:text-base">
              Отмена
            </Button>
            <Button type="submit" className="flex-1 text-sm md:text-base">
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
