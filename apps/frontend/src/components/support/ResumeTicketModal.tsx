'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, X, Bell } from 'lucide-react';
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

interface ResumeTicketModalProps {
  ticket: OpenTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageSent: (updatedTicket?: OpenTicket) => void;
  onCloseTicket?: (ticket: OpenTicket) => void;
}

export default function ResumeTicketModal({ 
  ticket, 
  isOpen, 
  onClose, 
  onMessageSent,
  onCloseTicket
}: ResumeTicketModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closingTicket, setClosingTicket] = useState(false);

  // Автоматически отмечаем как просмотренный при открытии модального окна
  useEffect(() => {
    if (ticket && ticket.status_new === 'Новый ответ' && isOpen) {
      handleMarkAsViewed();
    }
  }, [ticket, isOpen]);

  const handleMarkAsViewed = async () => {
    if (!ticket) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/mark-viewed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      if (response.ok) {
        // Обновляем тикет в родительском компоненте
        onMessageSent({ ...ticket, status_new: 'Просмотрен' });
      }
    } catch (err: any) {
      console.error('Error marking as viewed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !ticket) return;

    try {
      setLoading(true);
      setError(null);

      const requestData = {
        ticketId: ticket.id,
        message: message.trim()
      };

      console.log('🔍 [RESUME MODAL] Отправляемые данные:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555'}/api/bitrix24/support/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getCookie('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [RESUME MODAL] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        console.error('❌ [RESUME MODAL] Full error data:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || `Ошибка отправки сообщения (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMessage('');
        
        // Используем обновленные данные из ответа API
        const updatedTicket = data.updatedTicket;
        console.log('🔍 [RESUME MODAL] Updated ticket from API:', updatedTicket);
        
        onMessageSent(updatedTicket || undefined);
        onClose();
        
        // Показываем уведомление об успехе
        if (typeof window !== 'undefined' && 'toast' in window) {
          (window as any).toast.success('Сообщение отправлено успешно!');
        }
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket || !onCloseTicket) return;
    
    try {
      setClosingTicket(true);
      
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
        onCloseTicket(ticket);
        onClose();
        
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
      setClosingTicket(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    onClose();
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Возобновить общение: {ticket.subject}
            {ticket.status_new === 'Новый ответ' && (
              <div className="flex items-center gap-2 ml-2">
                <div className="relative">
                  <Bell className="h-5 w-5 text-red-600 animate-pulse" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full animate-ping"></div>
                </div>
                <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm font-medium animate-pulse">
                  Новый ответ от поддержки!
                </span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Добавьте новое сообщение к существующему обращению
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* История сообщений */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3 text-gray-700">История сообщений</h3>
            <div className="space-y-3">
              {ticket.messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 ml-8' 
                      : 'bg-white mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {msg.author}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Форма для нового сообщения */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="message">Ваше сообщение</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите ваше сообщение..."
                className="min-h-[100px] resize-none"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <div className="flex gap-2">
                {onCloseTicket && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCloseTicket}
                    disabled={loading || closingTicket}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    {closingTicket ? (
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
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={loading || closingTicket}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !message.trim() || closingTicket}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить сообщение
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
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
