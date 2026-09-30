'use client';

import React, { useState, useEffect } from 'react';
import { messengerApi, type ConversationResponse } from '../../shared/api/messengerApi';
import { messengerWebSocket } from '../../shared/lib/messengerWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge ,Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Button } from '../ui';
import { CreateConversationDialog } from './CreateConversationDialog';
import { 
  MessageSquare, 
  Search, 
  Archive, 
  MoreVertical, 
  Settings,
  Users,
  Clock,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ConversationListProps {
  onSelectConversation: (conversation: ConversationResponse) => void;
  selectedConversationId?: string | undefined;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId
}) => {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    loadConversations();
    setupWebSocket();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messengerApi.getConversations();
      setConversations(response.conversations || []);
      setUnreadTotal(response.unread_total || 0);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
      setUnreadTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    messengerWebSocket.updateHandlers({
      onMessage: (message) => {
        // Обновляем последнее сообщение в списке бесед
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id_conversation === message.conversation_id) {
              const updated: ConversationResponse = {
                ...conv,
                last_message_at: message.timestamp,
                unread_count: (conv.unread_count || 0) + 1
              };
              
              // Добавляем опциональные поля только если они есть
              if (message.message_id) {
                updated.last_message_id = message.message_id;
              }
              if (message.content) {
                updated.last_message_text = message.content;
              }
              
              return updated;
            }
            return conv;
          })
        );
        
        // Обновляем общее количество непрочитанных
        setUnreadTotal(prev => prev + 1);
      },
      onConversationUpdate: (_conversationId, _updateType, data) => {
        // Обновляем статус беседы
        setConversations(prev =>
          prev.map(conv =>
            conv.id_conversation === _conversationId
              ? { ...conv, ...data }
              : conv
          )
        );
      }
    });
  };

  const filteredConversations = (conversations || []).filter(conv => {
    if (!searchQuery) return true;
    
    const otherUser = conv.user1?.username === 'current_user' ? conv.user2 : conv.user1;
    const searchLower = searchQuery.toLowerCase();
    
    return (
      otherUser?.username?.toLowerCase().includes(searchLower) ||
      otherUser?.firstName?.toLowerCase().includes(searchLower) ||
      otherUser?.lastName?.toLowerCase().includes(searchLower) ||
      otherUser?.company?.name_company?.toLowerCase().includes(searchLower)
    );
  });

  const getOtherUser = (conversation: ConversationResponse) => {
    // В реальном приложении нужно получить текущего пользователя
    return conversation.user1 || conversation.user2;
  };

  const getStatusBadge = (conversation: ConversationResponse) => {
    switch (conversation.status) {
      case 'Архивирован':
        return <Badge variant="secondary">Архив</Badge>;
      case 'Заблокирован':
        return <Badge variant="destructive">Заблокирован</Badge>;
      default:
        return null;
    }
  };

  const handleConversationAction = async (
    conversationId: string, 
    action: 'archive' | 'restore' | 'block'
  ) => {
    try {
      switch (action) {
        case 'archive':
          await messengerApi.archiveConversation(conversationId);
          break;
        case 'restore':
          await messengerApi.restoreConversation(conversationId);
          break;
        case 'block':
          await messengerApi.blockConversation(conversationId);
          break;
      }
      
      // Обновляем локальное состояние
      setConversations(prev =>
        prev.map(conv =>
          conv.id_conversation === conversationId
            ? {
                ...conv,
                status: action === 'restore' ? 'Активен' : 
                       action === 'archive' ? 'Архивирован' : 'Заблокирован'
              }
            : conv
        )
      );
    } catch (error) {
      console.error(`Failed to ${action} conversation:`, error);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Мессенджер
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800/30 backdrop-blur-sm">
      {/* Заголовок */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Мессенджер</h2>
              {unreadTotal > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {unreadTotal} непрочитанных
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Кнопка создания беседы */}
        <CreateConversationDialog
          onConversationCreated={() => {
            loadConversations();
          }}
          trigger={
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Новая беседа
            </Button>
          }
        />
        
        {/* Поиск */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Поиск бесед..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Список бесед */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-1 h-full overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600 dark:text-gray-300">
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <Users className="h-10 w-10 mx-auto mb-2 text-blue-500 dark:text-blue-400" />
                <p className="text-sm font-medium">Нет бесед</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const isSelected = selectedConversationId === conversation.id_conversation;
              
              return (
                <div
                  key={conversation.id_conversation}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-500/10 dark:shadow-blue-400/10' 
                      : 'hover:bg-white/50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11 border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 font-semibold">
                          {otherUser?.firstName?.[0] || otherUser?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {otherUser?.firstName && otherUser?.lastName
                              ? `${otherUser.firstName} ${otherUser.lastName}`
                              : otherUser?.username}
                          </h4>
                          {getStatusBadge(conversation)}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary flex-shrink-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm border-border/50">
                            {conversation.status === 'Активен' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConversationAction(conversation.id_conversation, 'archive');
                                }}
                                className="hover:bg-primary/10"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Архивировать
                              </DropdownMenuItem>
                            )}
                            {conversation.status === 'Архивирован' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConversationAction(conversation.id_conversation, 'restore');
                                }}
                                className="hover:bg-primary/10"
                              >
                                Восстановить
                              </DropdownMenuItem>
                            )}
                            {conversation.status === 'Активен' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConversationAction(conversation.id_conversation, 'block');
                                }}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                Заблокировать
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {otherUser?.company && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 truncate">
                          {otherUser.company.name_company}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate flex-1 ${
                          conversation.unread_count && conversation.unread_count > 0 
                            ? 'text-gray-900 dark:text-white font-medium' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {conversation.last_message_text || 'Нет сообщений'}
                        </p>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conversation.last_message_at), {
                              addSuffix: false,
                              locale: ru
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
