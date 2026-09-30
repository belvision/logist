"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supportApi } from '@/shared/api/support';

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
      fetchArchiveTickets();
    }
  }, [refreshTrigger]);

  const fetchArchiveTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getAllTickets();
      if (data.success) {
        // Фильтруем только закрытые тикеты
        const closedTickets = (data.tickets || []).filter((ticket: { status: string }) => ticket.status === 'Закрыто');
        setTickets(closedTickets);
      } else {
        throw new Error(data.error || 'Ошибка загрузки архивных тикетов');
      }
    } catch (err: unknown) {
      console.error('Error fetching archive tickets:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки архивных тикетов');
    } finally {
      setLoading(false);
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
          <p className="mt-2 text-gray-600 dark:text-gray-300">Загрузка архивных тикетов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400 mb-4">Ошибка: {error}</p>
        <Button onClick={fetchArchiveTickets} variant="outline" className="text-white border-gray-600 hover:bg-gray-700 hover:text-white">
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Нет закрытых обращений</h3>
        <p className="text-gray-600 dark:text-gray-300">У вас пока нет закрытых обращений в поддержку.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Архив обращений</h2>
        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
          {tickets.length} {tickets.length === 1 ? 'обращение' : 'обращений'}
        </Badge>
      </div>

      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg text-white">{ticket.subject}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {getPriorityText(ticket.priority)}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
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
                {ticket.closedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>Закрыт: {format(new Date(ticket.closedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                  </div>
                )}
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

              {/* Кнопка просмотра */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => onViewDetails(ticket)}
                  variant="outline"
                  className="border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500"
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
