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
import { getCookie } from 'cookies-next';

export default function SupportPage() {
  const { user } = useAuth();
  const { companies } = useCompanyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'tickets'>('create');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Открыто' | 'В обработке' | 'Закрыто'>('all');
  
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

  // Загрузка тикетов
  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const token = getCookie('access_token');
      if (!token) {
        showToast.error('Требуется авторизация');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/support`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки тикетов');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      handleApiError(error, 'Ошибка при загрузке тикетов');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Фильтрация тикетов по статусу
  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter === 'all') return true;
    return ticket.status === statusFilter;
  });

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
      // Попробуем получить токен из разных источников
      const tokenFromCookie = getCookie('access_token');
      const tokenFromLocalStorage = localStorage.getItem('lg_token');
      const tokenFromAuthContext = user?.token;
      
      console.log('🔍 [FRONTEND] Token from cookie:', tokenFromCookie ? 'Present' : 'Missing');
      console.log('🔍 [FRONTEND] Token from localStorage:', tokenFromLocalStorage ? 'Present' : 'Missing');
      console.log('🔍 [FRONTEND] Token from auth context:', tokenFromAuthContext ? 'Present' : 'Missing');
      
      // Выберем первый доступный токен
      const token = tokenFromCookie || tokenFromLocalStorage || tokenFromAuthContext;
      
      console.log('🔍 [FRONTEND] Selected token:'REDACTED_SECRET'Present' : 'Missing');
      console.log('🔍 [FRONTEND] Token type:', typeof token);
      console.log('🔍 [FRONTEND] Token value:', token);
      console.log('🔍 [FRONTEND] Token preview:', token && typeof token === 'string' ? token.substring(0, 20) + '...' : 'No token or not string');
      
      if (!token) {
        showToast.error('Требуется авторизация. Пожалуйста, войдите в систему.');
        return;
      }

      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyId: formData.companyId && formData.companyId.trim() ? formData.companyId : null,
        subject: formData.subject,
        message: formData.message
      };

      console.log('🔍 [FRONTEND] Отправляемые данные:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/bitrix24/support`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [FRONTEND] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Ошибка отправки запроса: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [FRONTEND] Результат создания тикета:', result);
      
      // Показываем информацию о созданных контакте и компании
      if (result.contact) {
        console.log('✅ [FRONTEND] Контакт создан в Bitrix24:', result.contact);
      }
      if (result.company) {
        console.log('✅ [FRONTEND] Компания создана/найдена в Bitrix24:', result.company);
      }
      
      showToast.success('Запрос в поддержку отправлен успешно!');
      
      // Сброс формы
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        companyId: '',
        subject: '',
        message: ''
      });

      // Переключение на вкладку тикетов и обновление списка
      setActiveTab('tickets');
      loadTickets();
    } catch (error) {
      handleApiError(error, 'Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Загрузка тикетов при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Поддержка</h1>
        
        {/* Вкладки */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'create'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Создать обращение
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tickets'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Мои обращения
          </button>
        </div>

        {/* Создание обращения */}
        {activeTab === 'create' && (
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
        )}

        {/* Список тикетов */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Фильтры */}
            <Card className="shadow-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setStatusFilter('Открыто')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === 'Открыто'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Открытые
                  </button>
                  <button
                    onClick={() => setStatusFilter('В обработке')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === 'В обработке'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    В обработке
                  </button>
                  <button
                    onClick={() => setStatusFilter('Закрыто')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === 'Закрыто'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Закрытые
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Список тикетов */}
            {isLoadingTickets ? (
              <Card className="shadow-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка обращений...</p>
                </CardContent>
              </Card>
            ) : filteredTickets.length === 0 ? (
              <Card className="shadow-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {statusFilter === 'all' ? 'У вас пока нет обращений' : `Нет обращений со статусом "${statusFilter}"`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket: any) => (
                  <Card key={ticket.id_ticket} className="shadow-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(ticket.created_at).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          ticket.status === 'Открыто' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : ticket.status === 'В обработке'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      
                      {ticket.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Компания: {ticket.company.name_company}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {ticket.messages && ticket.messages.map((message: any, index: number) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-50 dark:bg-blue-900/20' 
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}>
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {message.message}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {new Date(message.timestamp).toLocaleDateString('ru-RU', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
