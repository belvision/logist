"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ArchiveTicket {
  id: string;
  subject: string;
  status: string;
  priority: number;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    timestamp: string;
    author?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface ArchiveTicketsListProps {
  onViewDetails: (ticket: ArchiveTicket) => void;
  refreshTrigger?: number;
}

export default function ArchiveTicketsList({ onViewDetails, refreshTrigger }: ArchiveTicketsListProps) {
  const [tickets, setTickets] = useState<ArchiveTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchiveTickets();
  }, []);

  // Принудительное обновление списка при изменении refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 [ARCHIVE TICKETS LIST] Force refresh triggered:', refreshTrigger);
      fetchArchiveTickets();
    }
  }, [refreshTrigger]);

  const fetchArchiveTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки архивных тикетов');
      }

      const data = await response.json();
      if (data.success) {
        // Фильтруем только закрытые тикеты
        const closedTickets = (data.tickets || []).filter((ticket: any) => ticket.status === 'Закрыто');
        setTickets(closedTickets);
        console.log('✅ [ARCHIVE TICKETS LIST] Loaded closed tickets:', closedTickets.length);
      } else {
        throw new Error(data.error || 'Ошибка загрузки архивных тикетов');
      }
    } catch (err: any) {
      console.error('Error fetching archive tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
          <p className="mt-2 text-gray-600">Загрузка архивных тикетов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Ошибка: {error}</p>
        <Button onClick={fetchArchiveTickets} variant="outline">
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет закрытых обращений</h3>
        <p className="text-gray-600">У вас пока нет закрытых обращений в поддержку.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Архив обращений</h2>
        <Badge variant="outline" className="bg-gray-50 text-gray-700">
          {tickets.length} {tickets.length === 1 ? 'обращение' : 'обращений'}
        </Badge>
      </div>

      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {getPriorityText(ticket.priority)}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
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
                {ticket.closedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Закрыт: {format(new Date(ticket.closedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                  </div>
                )}
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

              {/* Кнопка просмотра */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => onViewDetails(ticket)}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Подробнее
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
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}
