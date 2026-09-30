"use client";

import React, { useState } from 'react';
import { X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addUserToCompany, inviteUserToCompany } from '@/shared/api/company';
import { showToast, handleApiError } from '@/lib/toast';
import { SecurityCheckModal } from '@/components/security/SecurityCheckModal';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

export function AddMemberModal({ isOpen, onClose, onSuccess, companyId }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Пользователь');
  const [loading, setLoading] = useState(false);
  const [inviteType, setInviteType] = useState<'existing' | 'invite'>('existing');
  const [message, setMessage] = useState('');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityError, setSecurityError] = useState<{type: string, message: string} | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      if (inviteType === 'existing') {
        // Добавить существующего пользователя
        await addUserToCompany(companyId, { email, role });
        showToast.success('Пользователь успешно добавлен в компанию');
      } else {
        // Пригласить нового пользователя
        const result = await inviteUserToCompany(companyId, { email, role, message });
        
        // Проверяем, была ли отправка письма успешной
        if (result && result.invitationLink) {
          showToast.success('Приглашение отправлено! Проверьте почту или скопируйте ссылку из консоли.');
        } else {
          showToast.success('Приглашение создано');
        }
      }
      
      // Небольшая задержка для обновления API
      setTimeout(() => {
        onSuccess();
      }, 500);
      
      onClose();
      setEmail('');
      setMessage('');
      setRetryCount(0);
    } catch (error: any) {
      console.error('Ошибка приглашения:', error);
      
      // Определяем тип ошибки для показа соответствующего модального окна
      if (error?.status === 403) {
        setSecurityError({
          type: 'general',
          message: 'У вас нет прав для приглашения пользователей в эту компанию'
        });
        setShowSecurityModal(true);
      } else if (error?.status === 409) {
        setSecurityError({
          type: 'email_verification',
          message: 'Пользователь с таким email уже зарегистрирован. Используйте добавление пользователя.'
        });
        setShowSecurityModal(true);
      } else {
        handleApiError(error, 'Ошибка добавления пользователя');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShowSecurityModal(false);
    // Повторяем последнее действие
    handleSubmit(new Event('submit') as any);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Добавить сотрудника</h2>
            <p className="text-sm text-muted-foreground">Расширьте команду новыми участниками</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Способ добавления</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setInviteType("existing")}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  inviteType === "existing" ? "border-primary bg-primary/10" : "border-border bg-transparent hover:bg-muted"
                }`}
              >
                <div className="text-sm font-medium text-foreground">Существующий</div>
                <div className="text-xs text-muted-foreground">Пользователи уже в системе</div>
              </button>
              <button
                type="button"
                onClick={() => setInviteType("invite")}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  inviteType === "invite" ? "border-primary bg-primary/10" : "border-border bg-transparent hover:bg-muted"
                }`}
              >
                <div className="text-sm font-medium text-foreground">Пригласить</div>
                <div className="text-xs text-muted-foreground">Отправить приглашение</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email адрес</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Роль в команде</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Пользователь">Пользователь</SelectItem>
                  <SelectItem value="Администратор">Администратор</SelectItem>
                  <SelectItem value="Водитель">Водитель</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteType === 'invite' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Сообщение (необязательно)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Добро пожаловать в нашу команду! Мы рады пригласить вас присоединиться к LogistGo.pro..."
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Добавление..." : "+ Добавить"}
            </Button>
          </div>
        </form>
      </div>

      {/* Модальное окно безопасности */}
      <SecurityCheckModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onRetry={handleRetry}
        errorType={securityError?.type as any}
        {...(securityError?.message && { errorMessage: securityError.message })}
        retryCount={retryCount}
        maxRetries={3}
      />
    </div>
  );
}
