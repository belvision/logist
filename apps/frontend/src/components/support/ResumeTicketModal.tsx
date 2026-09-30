'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, X, Bell } from 'lucide-react';
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
  const { refreshNotifications } = useNotifications();
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
      const result = await supportApi.markAsViewed(ticket.id);
      if (result.success) {
        // Обновляем тикет в родительском компоненте
        onMessageSent({ ...ticket, status_new: 'Просмотрен' });
      }
    } catch (err: unknown) {
      console.error('Error marking as viewed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !ticket) return;

    try {
      setLoading(true);
      setError(null);

      const data = await supportApi.addComment(ticket.id, message.trim());
      
      if (data.success) {
        setMessage('');
        
        // Используем обновленные данные из ответа API
        const updatedTicket = data.updatedTicket;
        
        onMessageSent(updatedTicket || undefined);
        
        // Обновляем уведомления после отправки сообщения
        await refreshNotifications();
        
        onClose();
        
        // Показываем уведомление об успехе
        if (typeof window !== 'undefined' && 'toast' in window) {
          (window as { toast: { success: (message: string) => void } }).toast.success('Сообщение отправлено успешно!');
        }
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket || !onCloseTicket) return;
    
    try {
      setClosingTicket(true);
      
      const data = await supportApi.closeTicket(ticket.id);
      if (data.success) {
        onCloseTicket(ticket);
        
        // Обновляем уведомления после закрытия тикета
        await refreshNotifications();
        
        onClose();
        
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
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
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Добавьте новое сообщение к существующему обращению
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* История сообщений */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">История сообщений</h3>
            <div className="space-y-3">
              {ticket.messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 ml-8' 
                      : 'bg-white dark:bg-gray-600 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {msg.author}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(msg.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Форма для нового сообщения */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-gray-700 dark:text-gray-200">Ваше сообщение</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите ваше сообщение..."
                className="min-h-[100px] resize-none bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
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
                    className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500"
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
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !message.trim() || closingTicket}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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