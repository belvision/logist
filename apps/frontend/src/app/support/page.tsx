"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/shared/context/auth-context';
import useCompanyStore from '@/store/company-store';
import { showToast, handleApiError } from '@/lib/toast';

export default function SupportPage() {
  const { user } = useAuth();
  const { companies } = useCompanyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    companyId: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Если у пользователя есть компании, но он не выбрал ни одну
    if (companies.length > 0 && !formData.companyId) {
      alert('Выберите компанию');
      return;
    }

    if (!formData.subject.trim()) {
      alert('Заполните тему');
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      alert('Сообщение должно содержать минимум 10 символов');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Реализовать отправку запроса в поддержку
      console.log('Отправка запроса в поддержку:', formData);
      
      // Временная заглушка
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast.success('Запрос в поддержку отправлен успешно!');
      
      // Сброс формы
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        companyId: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      handleApiError(error, 'Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Поддержка</h1>
        
        <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-4 lg:pb-6">
            <CardTitle className="text-lg lg:text-2xl font-semibold text-center text-gray-900 dark:text-white">
              Обращение в службу поддержки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              {/* Имя и Фамилия */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Имя *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    style={{ colorScheme: 'light' }}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Фамилия *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    style={{ colorScheme: 'light' }}
                    required
                  />
                </div>
              </div>

              {/* Выбор компании */}
              <div className="space-y-2">
                <Label htmlFor="companyId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Компания {companies.length > 0 ? '*' : ''}
                </Label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  required={companies.length > 0}
                >
                  <option value="">Выберите компанию</option>
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <option key={company.id_company} value={company.id_company}>
                        {company.name_company}
                      </option>
                    ))
                  ) : (
                    <option value="no-company" disabled>
                      Нет компании
                    </option>
                  )}
                </select>
                {companies.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    У вас нет доступа ни к одной компании
                  </p>
                )}
              </div>

              {/* Тема */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тема обращения *
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Кратко опишите суть проблемы"
                  className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  style={{ colorScheme: 'light' }}
                  required
                />
              </div>

              {/* Сообщение */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Описание проблемы *
                </Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Подробно опишите проблему или вопрос..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md resize-none"
                  style={{ colorScheme: 'light' }}
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Минимум 10 символов. Сейчас: {formData.message.length}
                </p>
              </div>

              {/* Кнопка отправки */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
