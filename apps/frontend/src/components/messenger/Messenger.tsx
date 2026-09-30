'use client';

import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { Chat } from './Chat';
import { messengerApi, type ConversationResponse, type MessengerStats } from '../../shared/api/messengerApi';
import { messengerWebSocket } from '../../shared/lib/messengerWebSocket';
import { CardContent } from '../ui/card';
import { MessageSquare, TrendingUp, MessageCircle, Bell } from 'lucide-react';

interface MessengerProps {
  currentUserId: string;
  initialConversationId?: string | undefined;
}

export const Messenger: React.FC<MessengerProps> = ({ currentUserId, initialConversationId }) => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [stats, setStats] = useState<MessengerStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadStats();
    connectWebSocket();
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId]);

  const loadStats = async () => {
    try {
      const statsData = await messengerApi.getMessengerStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load messenger stats:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await messengerApi.getConversationById(conversationId);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const connectWebSocket = async () => {
    try {
      await messengerWebSocket.connect({
        onConnectionChange: (connected) => {
          setIsConnected(connected);
        },
        onMessage: () => {
          loadStats();
        }
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleSelectConversation = (conversation: ConversationResponse) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0">
      {/* Список бесед */}
      <div className="w-full lg:w-80 xl:w-96 border-r border-gray-700 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm">
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id_conversation}
        />
      </div>

      {/* Область чата */}
      <div className="flex-1 min-w-0">
        {selectedConversation ? (
          <Chat
            conversation={selectedConversation}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-gray-50 via-gray-50/95 to-gray-50/90 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/90">
            <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
              {/* Иконка с анимацией */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-3xl border border-primary/20 shadow-xl">
                  <MessageSquare className="h-20 w-20 text-primary" strokeWidth={1.5} />
                </div>
              </div>

              {/* Заголовок */}
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Добро пожаловать в мессенджер
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-md text-base leading-relaxed">
                Выберите беседу из списка слева, чтобы начать общение с перевозчиками и грузовладельцами.
              </p>
              
              {/* Статистика */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-400/5">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total_conversations}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Всего бесед</div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-400/5">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.active_conversations}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Активных</div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-orange-500/30 dark:hover:border-orange-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 dark:hover:shadow-orange-400/5">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                        <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.unread_messages}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Непрочитанных</div>
                  </div>
                </div>
              )}
              
              {/* Статус подключения */}
              <div className="flex items-center gap-3 px-5 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full">
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  {isConnected && (
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {isConnected ? 'Подключено к серверу' : 'Отключено от сервера'}
                </span>
              </div>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
};
