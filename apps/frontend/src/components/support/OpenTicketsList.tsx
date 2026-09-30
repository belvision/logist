'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCookie } from '@/lib/cookies';

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
      console.log('🔍 [OPEN TICKETS LIST] Updating ticket in list:', selectedTicket);
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
      console.log('🔄 [OPEN TICKETS LIST] Force refresh triggered:', refreshTrigger);
      fetchOpenTickets();
    }
  }, [refreshTrigger]);

  const fetchOpenTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/open`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки открытых тикетов');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error('Error fetching open tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async (ticket: OpenTicket) => {
    if (!onCloseTicket) return;
    
    try {
      setClosingTickets(prev => new Set(prev).add(ticket.id));
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка закрытия тикета (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        // Удаляем тикет из списка
        setTickets(prevTickets => prevTickets.filter(t => t.id !== ticket.id));
        
        // Вызываем callback для обновления родительского компонента
        onCloseTicket(ticket);
        
        // Показываем уведомление об успехе
        if (typeof window !== 'undefined' && 'toast' in window) {
          (window as any).toast.success('Обращение закрыто успешно!');
        }
      } else {
        throw new Error(data.error || 'Ошибка закрытия тикета');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      if (typeof window !== 'undefined' && 'toast' in window) {
        (window as any).toast.error(error instanceof Error ? error.message : 'Ошибка закрытия тикета');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/mark-viewed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отметке как просмотренного');
      }

      // Обновляем локальное состояние
      setTickets(prevTickets => 
        prevTickets.map(t => 
          t.id === ticket.id 
            ? { ...t, status_new: 'Просмотрен' as const }
            : t
        )
      );
    } catch (err: any) {
      console.error('Error marking as viewed:', err);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <p className="mt-2 text-gray-600">Загрузка открытых тикетов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Ошибка: {error}</p>
        <Button onClick={fetchOpenTickets} variant="outline">
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет открытых обращений</h3>
        <p className="text-gray-600">У вас пока нет открытых обращений в поддержку.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Открытые обращения</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {tickets.length} {tickets.length === 1 ? 'обращение' : 'обращений'}
        </Badge>
      </div>

      {tickets.map((ticket) => (
        <Card key={ticket.id} className={`hover:shadow-md transition-shadow ${ticket.status_new === 'Новый ответ' ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
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
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {ticket.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Информация о тикете */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Создан: {format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{ticket.messages.length} сообщений</span>
                </div>
              </div>

              {/* Последнее сообщение */}
              {ticket.messages.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {ticket.messages[ticket.messages.length - 1].author}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(ticket.messages[ticket.messages.length - 1].timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {ticket.messages[ticket.messages.length - 1].message}
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Возобновить общение
                </Button>
                <Button 
                  onClick={() => handleCloseTicket(ticket)}
                  disabled={closingTickets.has(ticket.id)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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

// Вспомогательная функция для получения cookie
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}
