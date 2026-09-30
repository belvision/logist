'use client';

import React, { useState, useEffect, useRef } from 'react';
import { messengerApi, type MessageResponse, type ConversationResponse } from '../../shared/api/messengerApi';
import { messengerWebSocket } from '../../shared/lib/messengerWebSocket';
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Card, CardContent, CardHeader, CardTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Archive,
  Settings,
  Phone,
  Video,
  Info,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatProps {
  conversation: ConversationResponse;
  currentUserId: string;
}

export const Chat: React.FC<ChatProps> = ({ conversation, currentUserId }) => {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    setupWebSocket();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversation.id_conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messengerApi.getMessages(conversation.id_conversation);
      setMessages(response.messages.reverse()); // Переворачиваем для правильного порядка
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    messengerWebSocket.updateHandlers({
      onMessage: (message) => {
        if (message.conversation_id === conversation.id_conversation && message.message_id) {
          // Преобразуем WebSocket сообщение в MessageResponse
          const messageResponse: MessageResponse = {
            id_message: message.message_id,
            id_conversation: message.conversation_id,
            id_sender: message.sender_id || '',
            content: message.content || '',
            type: 'text', // WebSocket сообщения всегда текстовые
            is_read: false,
            created_at: message.timestamp,
            updated_at: message.timestamp
          };
          setMessages(prev => [...prev, messageResponse]);
          
          // Автоматически отмечаем как прочитанное
          if (message.sender_id !== currentUserId) {
            markMessageAsRead(message.message_id);
          }
        }
      },
      onTyping: (conversationId, senderId, isTyping) => {
        if (conversationId === conversation.id_conversation && senderId !== currentUserId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (isTyping) {
              newSet.add(senderId);
            } else {
              newSet.delete(senderId);
            }
            return newSet;
          });
        }
      },
      onReadStatus: (conversationId, messageIds) => {
        if (conversationId === conversation.id_conversation) {
          // Обновляем статус прочтения сообщений
          setMessages(prev =>
            prev.map(msg =>
              messageIds.includes(msg.id_message)
                ? { ...msg, is_read: true, read_at: new Date().toISOString() }
                : msg
            )
          );
        }
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const message = await messengerApi.sendMessage({
        conversationId: conversation.id_conversation,
        content: messageText.trim(),
        type: 'text'
      });
      
      setMessages(prev => [...prev, message]);
      setMessageText('');
      
      // Останавливаем статус "печатает"
      if (isTyping) {
        await messengerApi.sendTypingStatus(conversation.id_conversation, false);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    // Отправляем статус "печатает"
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      messengerApi.sendTypingStatus(conversation.id_conversation, true);
    }
    
    // Очищаем предыдущий таймаут
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Устанавливаем новый таймаут для остановки статуса "печатает"
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        await messengerApi.sendTypingStatus(conversation.id_conversation, false);
        setIsTyping(false);
      }
    }, 2000);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await messengerApi.markMessagesAsRead({ messageIds: [messageId] });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getOtherUser = () => {
    return conversation.user1?.id_user === currentUserId ? conversation.user2 : conversation.user1;
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ru
    });
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Загрузка сообщений...</CardTitle>
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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-gray-50/95 to-gray-50/90 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/90">
      {/* Заголовок чата */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-blue-200 dark:border-blue-600 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 font-semibold">
                  {otherUser?.firstName?.[0] || otherUser?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {otherUser?.firstName && otherUser?.lastName
                  ? `${otherUser.firstName} ${otherUser.lastName}`
                  : otherUser?.username}
              </h3>
              {otherUser?.company && (
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {otherUser.company.name_company}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors">
              <Info className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm border-border/50">
                <DropdownMenuItem className="hover:bg-primary/10">
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-primary/10">
                  <Archive className="h-4 w-4 mr-2" />
                  Архивировать
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-300">
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-blue-500 dark:text-blue-400" />
                <p className="text-base font-medium">Начните беседу</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Отправьте первое сообщение</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.id_sender === currentUserId;
              const sender = message.sender;
              
              return (
                <div
                  key={message.id_message}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwn && (
                      <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          {sender?.firstName?.[0] || sender?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      isOwn 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm md:text-base leading-relaxed break-words">{message.content}</p>
                      <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                        isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {isOwn && message.is_read && (
                          <span className="text-emerald-400">✓✓</span>
                        )}
                        {isOwn && !message.is_read && (
                          <span className="opacity-60">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Индикатор "печатает" */}
          {typingUsers.size > 0 && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 text-xs">U</AvatarFallback>
                </Avatar>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">печатает...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Поле ввода сообщения */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
        <div className="flex gap-2 items-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <Input
            value={messageText}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="flex-1 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl h-10 md:h-11 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={sending}
          />
          
          <Button 
            onClick={sendMessage} 
            disabled={!messageText.trim() || sending}
            size="sm"
            className="h-10 w-10 md:h-11 md:w-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 transition-all flex-shrink-0"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
