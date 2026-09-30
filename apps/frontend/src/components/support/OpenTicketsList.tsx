'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNotifications } from '@/shared/context/notifications-context';
import { supportApi } from '@/shared/api/support';

interface OpenTicket {
  id: string;
  subject: string;
  status: string;
  status_new?: 'Новый ответ' | 'Просмотрен';
  priority: number;
  bitrix24TicketId: string;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    timestamp: string;
    author: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface OpenTicketsListProps {
  onResumeTicket: (ticket: OpenTicket) => void;
  onCloseTicket?: (ticket: OpenTicket) => void;
  selectedTicket?: OpenTicket | null;
  refreshTrigger?: number; // Добавляем триггер для принудительного обновления
}

export default function OpenTicketsList({ onResumeTicket, onCloseTicket, selectedTicket, refreshTrigger }: OpenTicketsListProps) {
  const { refreshNotifications } = useNotifications();
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closingTickets, setClosingTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOpenTickets();
  }, []);

  // Обновляем тикет в списке, если пришли обновленные данные
  useEffect(() => {
    if (selectedTicket) {
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicket.id ? selectedTicket : ticket
        )
      );
    }
  }, [selectedTicket]);

  // Принудительное обновление списка при изменении refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchOpenTickets();
    }
  }, [refreshTrigger]);

  // Обработчик события получения нового сообщения от поддержки
  useEffect(() => {
    const handleSupportMessage = () => {
      fetchOpenTickets();
    };

    window.addEventListener('supportMessageReceived', handleSupportMessage as EventListener);
    
    return () => {
      window.removeEventListener('supportMessageReceived', handleSupportMessage as EventListener);
    };
  }, []);

  const fetchOpenTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getOpenTickets();
      setTickets(data.tickets || []);
      
      // Обновляем уведомления после загрузки тикетов
      await refreshNotifications();
    } catch (err: unknown) {
      console.error('Error fetching open tickets:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки тикетов');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async (ticket: OpenTicket) => {
    if (!onCloseTicket) return;
    
    try {
      setClosingTickets(prev => new Set(prev).add(ticket.id));
      
      const data = await supportApi.closeTicket(ticket.id);
      if (data.success) {
        // Удаляем тикет из списка
        setTickets(prevTickets => prevTickets.filter(t => t.id !== ticket.id));
        
        // Вызываем callback для обновления родительского компонента
        onCloseTicket(ticket);
        
        // Показываем уведомление об успехе
      if (typeof window !== 'undefined' && 'toast' in window) {
        (window as { toast: { success: (message: string) => void } }).toast.success('Обращение закрыто успешно!');
      }
      } else {
        throw new Error(data.error || 'Ошибка закрытия тикета');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      if (typeof window !== 'undefined' && 'toast' in window) {
        (window as { toast: { error: (message: string) => void } }).toast.error(error instanceof Error ? error.message : 'Ошибка закрытия тикета');
      }
    } finally {
      setClosingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticket.id);
        return newSet;
      });
    }
  };

  const handleMarkAsViewed = async (ticket: OpenTicket) => {
    try {
      const result = await supportApi.markAsViewed(ticket.id);
      if (!result.success) {
        throw new Error(result.error || 'Ошибка при отметке как просмотренного');
      }

      // Обновляем локальное состояние
      setTickets(prevTickets => 
        prevTickets.map(t => 
          t.id === ticket.id 
            ? { ...t, status_new: 'Просмотрен' as const }
            : t
        )
      );
    } catch (err: unknown) {
      console.error('Error marking as viewed:', err);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 2: return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 3: return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Низкий';
      case 2: return 'Средний';
      case 3: return 'Высокий';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Загрузка открытых тикетов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400 mb-4">Ошибка: {error}</p>
        <Button onClick={fetchOpenTickets} variant="outline" className="text-white border-gray-600 hover:bg-gray-700 hover:text-white">
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Нет открытых обращений</h3>
        <p className="text-gray-600 dark:text-gray-300">У вас пока нет открытых обращений в поддержку.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
          {tickets.length} {tickets.length === 1 ? 'обращение' : 'обращений'}
        </Badge>
      </div>

      {tickets.map((ticket) => (
        <Card key={ticket.id} className={`hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${ticket.status_new === 'Новый ответ' ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50 dark:bg-red-900/20' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white">{ticket.subject}</CardTitle>
                {ticket.status_new === 'Новый ответ' && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-red-600 animate-pulse" />
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full animate-ping"></div>
                    </div>
                    <Badge className="bg-red-600 text-white animate-pulse">
                      Новый ответ от поддержки!
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {getPriorityText(ticket.priority)}
                </Badge>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                  {ticket.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Информация о тикете */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Создан: {format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>{ticket.messages.length} сообщений</span>
                </div>
              </div>

              {/* Последнее сообщение */}
              {ticket.messages.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ticket.messages?.[ticket.messages.length - 1]?.author || 'Неизвестно'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.messages?.[ticket.messages.length - 1]?.timestamp || new Date()), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {ticket.messages?.[ticket.messages.length - 1]?.message || 'Нет сообщений'}
                  </p>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex justify-end gap-2">
                {ticket.status_new === 'Новый ответ' && (
                  <Button 
                    onClick={() => handleMarkAsViewed(ticket)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Отметить как просмотренный
                  </Button>
                )}
                <Button 
                  onClick={() => onResumeTicket(ticket)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Возобновить общение
                </Button>
                <Button 
                  onClick={() => handleCloseTicket(ticket)}
                  disabled={closingTickets.has(ticket.id)}
                  variant="outline"
                  className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500"
                >
                  {closingTickets.has(ticket.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                      Закрытие...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Закрыть обращение
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
