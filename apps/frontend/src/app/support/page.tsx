"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/shared/context/auth-context';
import { useNotifications } from '@/shared/context/notifications-context';
import useCompanyStore from '@/store/company-store';
import { showToast, handleApiError } from '@/lib/toast';
import { getCookie } from 'cookies-next';
import { API_BASE } from '@/lib/config';
import OpenTicketsList from '@/components/support/OpenTicketsList';
import ResumeTicketModal from '@/components/support/ResumeTicketModal';
import ArchiveTicketsList from '@/components/support/ArchiveTicketsList';
import ArchiveTicketModal from '@/components/support/ArchiveTicketModal';

export default function SupportPage() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { companies } = useCompanyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [_tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState<'create' | 'open' | 'archive'>('create');
  const [selectedTicket, setSelectedTicket] = useState<{ id: string; subject: string; status: string; status_new?: 'Новый ответ' | 'Просмотрен'; priority: number; bitrix24TicketId: string; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author: string }>; createdAt: string; updatedAt: string; } | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedArchiveTicket, setSelectedArchiveTicket] = useState<{ id: string; subject: string; status: string; priority: number; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author?: string }>; createdAt: string; updatedAt: string; closedAt?: string; } | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  
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

  // Обработка возобновления тикета
  const handleResumeTicket = (ticket: { id: string; subject: string; status: string; status_new?: 'Новый ответ' | 'Просмотрен'; priority: number; bitrix24TicketId: string; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author: string }>; createdAt: string; updatedAt: string; }) => {
    setSelectedTicket(ticket);
    setIsResumeModalOpen(true);
  };

  // Обработка закрытия модального окна
  const handleCloseResumeModal = () => {
    setIsResumeModalOpen(false);
    setSelectedTicket(null);
  };

  // Обработка просмотра архивного тикета
  const handleViewArchiveTicket = (ticket: { id: string; subject: string; status: string; priority: number; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author?: string }>; createdAt: string; updatedAt: string; closedAt?: string; }) => {
    setSelectedArchiveTicket(ticket);
    setIsArchiveModalOpen(true);
  };

  const handleCloseArchiveModal = () => {
    setIsArchiveModalOpen(false);
    setSelectedArchiveTicket(null);
  };

  // Обработка отправки сообщения
  const handleMessageSent = (updatedTicket?: { id: string; subject: string; status: string; status_new?: 'Новый ответ' | 'Просмотрен'; priority: number; bitrix24TicketId: string; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author: string }>; createdAt: string; updatedAt: string; }) => {
    console.log('🔍 [SUPPORT PAGE] Message sent, updated ticket:', updatedTicket);
    
    // Если получены обновленные данные тикета, обновляем selectedTicket
    if (updatedTicket) {
      setSelectedTicket(updatedTicket);
      console.log('🔍 [SUPPORT PAGE] Updated selectedTicket:', updatedTicket);
    }
    
    // Обновляем ВСЕ списки тикетов на странице
    console.log('🔍 [SUPPORT PAGE] Refreshing all ticket lists...');
    
    // Обновляем архив (если открыт)
    if (activeTab === 'archive') {
      loadTickets();
    }
    
    // Обновляем открытые тикеты (если открыты)
    if (activeTab === 'open') {
      // Для открытых тикетов данные обновятся через selectedTicket
      // Но также можно принудительно обновить список
      console.log('🔍 [SUPPORT PAGE] Open tickets tab - refreshing list');
    }
    
    // Принудительно обновляем все данные на странице
    setTimeout(async () => {
      console.log('🔍 [SUPPORT PAGE] Force refresh all data after comment');
      await refreshAllData();
    }, 100);
  };

  // Обработка закрытия тикета
  const handleCloseTicket = (ticket: { id: string; subject: string; status: string; status_new?: 'Новый ответ' | 'Просмотрен'; priority: number; bitrix24TicketId: string; messages: Array<{ role: 'user' | 'support'; message: string; timestamp: string; author: string }>; createdAt: string; updatedAt: string; }) => {
    console.log('🔍 [SUPPORT PAGE] Ticket closed:', ticket);
    
    // Обновляем все данные на странице
    setTimeout(async () => {
      console.log('🔍 [SUPPORT PAGE] Refreshing all data after ticket close');
      await refreshAllData();
    }, 100);
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

      const response = await fetch(`${API_BASE}/api/bitrix24/support/all`, {
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

  // Принудительное обновление всех данных на странице
  const refreshAllData = async () => {
    console.log('🔄 [SUPPORT PAGE] Refreshing all data on page...');
    
    // Обновляем архив тикетов
    if (activeTab === 'archive') {
      await loadTickets();
    }
    
    // Для открытых тикетов увеличиваем refreshTrigger
    if (activeTab === 'open') {
      setRefreshTrigger(prev => prev + 1);
      console.log('🔄 [SUPPORT PAGE] Triggered refresh for open tickets');
    }
    
    // Для архива тоже увеличиваем refreshTrigger
    if (activeTab === 'archive') {
      setRefreshTrigger(prev => prev + 1);
      console.log('🔄 [SUPPORT PAGE] Triggered refresh for archive tickets');
    }
    
    console.log('✅ [SUPPORT PAGE] All data refreshed');
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
      // Попробуем получить токен из разных источников
      const tokenFromCookie = getCookie('access_token');
      const tokenFromLocalStorage = localStorage.getItem('lg_token');
      
      console.log('🔍 [FRONTEND] Token from cookie:', tokenFromCookie ? 'Present' : 'Missing');
      console.log('🔍 [FRONTEND] Token from localStorage:', tokenFromLocalStorage ? 'Present' : 'Missing');
      
      // Выберем первый доступный токен
      const token = tokenFromCookie || tokenFromLocalStorage;
      
      console.log('🔍 [FRONTEND] Selected token:', token ? 'Present' : 'Missing');
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
        companyId: companies.length > 0 && formData.companyId && formData.companyId.trim() ? formData.companyId : undefined,
        subject: formData.subject,
        message: formData.message
      };

      console.log('🔍 [FRONTEND] Отправляемые данные:', requestData);

      const response = await fetch(`${API_BASE}/api/bitrix24/support`, {
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
      setActiveTab('open');
      loadTickets();
    } catch (error) {
      handleApiError(error, 'Ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Загрузка тикетов при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'archive') {
      loadTickets();
    } else if (activeTab === 'open') {
      // Обновляем уведомления при переключении на вкладку открытых обращений
      refreshNotifications();
    }
  }, [activeTab, refreshNotifications]);

  // Обновляем уведомления при загрузке страницы
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <>
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
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'open'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Открытые обращения
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Архив
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

                {/* Выбор компании - показываем только если есть компании */}
                {companies.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="companyId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Компания *
                    </Label>
                    <select
                      id="companyId"
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleInputChange}
                      className="w-full h-12 px-4 bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      required
                    >
                      <option value="">Выберите компанию</option>
                      {companies.map((company) => (
                        <option key={company.id_company} value={company.id_company}>
                          {company.name_company}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Информация если нет компаний */}
                {companies.length === 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Обращение без привязки к компании
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                          <p>У вас нет доступа ни к одной компании. Обращение будет создано без привязки к компании.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

        {/* Открытые обращения */}
        {activeTab === 'open' && (
          <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                Открытые обращения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OpenTicketsList 
                onResumeTicket={handleResumeTicket} 
                onCloseTicket={handleCloseTicket}
                selectedTicket={selectedTicket}
                refreshTrigger={refreshTrigger}
              />
            </CardContent>
          </Card>
        )}

        {/* Архив тикетов */}
        {activeTab === 'archive' && (
          <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                Архив обращений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArchiveTicketsList 
                onViewDetails={handleViewArchiveTicket}
                refreshTrigger={refreshTrigger}
              />
            </CardContent>
          </Card>
        )}

        {/* Модальное окно для возобновления общения */}
        <ResumeTicketModal
          ticket={selectedTicket}
          isOpen={isResumeModalOpen}
          onClose={handleCloseResumeModal}
          onMessageSent={handleMessageSent}
          onCloseTicket={handleCloseTicket}
        />

        {/* Модальное окно для просмотра архивного тикета */}
        <ArchiveTicketModal
          ticket={selectedArchiveTicket}
          isOpen={isArchiveModalOpen}
          onClose={handleCloseArchiveModal}
        />

      </div>
    </AppLayout>
    </>
  );
}
