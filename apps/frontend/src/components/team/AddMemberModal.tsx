"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
          console.log('🔗 Ссылка приглашения:', result.invitationLink);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          {/* Декоративный градиент */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Заголовок с иконкой */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Добавить сотрудника</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm hidden sm:block">Расширьте команду новыми участниками</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Тип добавления */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Способ добавления
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`relative cursor-pointer group ${inviteType === 'existing' ? '' : ''}`}>
                    <input
                      type="radio"
                      value="existing"
                      checked={inviteType === 'existing'}
                      onChange={(e) => setInviteType(e.target.value as 'existing')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      inviteType === 'existing' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          inviteType === 'existing' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 dark:border-gray-500'
                        }`}>
                          {inviteType === 'existing' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Существующий</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Пользователь уже в системе</div>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`relative cursor-pointer group h-full`}>
                    <input
                      type="radio"
                      value="invite"
                      checked={inviteType === 'invite'}
                      onChange={(e) => setInviteType(e.target.value as 'invite')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      inviteType === 'invite' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          inviteType === 'invite' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 dark:border-gray-500'
                        }`}>
                          {inviteType === 'invite' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Пригласить</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Отправить приглашение</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email/ID поле */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {inviteType === 'existing' ? 'Email адрес' : 'Email адрес'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {inviteType === 'existing' ? (
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type={inviteType === 'existing' ? 'email' : 'email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={inviteType === 'existing' ? 'user@example.com' : 'user@example.com'}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Роль */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Роль в команде
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="Пользователь">👤 Пользователь</option>
                    <option value="Администратор">👑 Администратор</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Сообщение (только для приглашений) */}
              {inviteType === 'invite' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Сообщение (необязательно)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 pt-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Добро пожаловать в нашу команду! Мы рады пригласить вас присоединиться к LogistGo.pro..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
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

      {/* Модальное окно безопасности */}
      <SecurityCheckModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onRetry={handleRetry}
        errorType={securityError?.type as any}
        errorMessage={securityError?.message}
        retryCount={retryCount}
        maxRetries={3}
      />
    </div>
  );
}
