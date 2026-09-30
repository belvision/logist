"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, X } from 'lucide-react';
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

interface ArchiveTicketModalProps {
  ticket: ArchiveTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveTicketModal({ 
  ticket, 
  isOpen, 
  onClose 
}: ArchiveTicketModalProps) {

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

  const handleClose = () => {
    onClose();
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{ticket.subject}</DialogTitle>
          <DialogDescription>
            Просмотр переписки по обращению в поддержку
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о тикете */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-3">
              <Badge className={getPriorityColor(ticket.priority)}>
                {getPriorityText(ticket.priority)}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                {ticket.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Создан: {format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Закрыт: {format(new Date(ticket.closedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{ticket.messages.length} сообщений</span>
              </div>
            </div>
          </div>

          {/* Переписка */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Переписка</h3>
            
            {ticket.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Нет сообщений в переписке</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticket.messages.map((message, index) => (
                  <div 
                    key={`${ticket.id}-${index}`}
                    className={`p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'bg-gray-50 border-l-4 border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {message.author || (message.role === 'user' ? 'Вы' : 'Поддержка')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка закрытия */}
          <div className="flex justify-end">
            <Button 
              onClick={handleClose}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
