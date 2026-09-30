'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/cookies';
import { API_BASE } from '@/lib/config';
import { supportApi } from '@/shared/api/support';
// import { useWebSocket } from '../hooks/useWebSocket';

interface NotificationContextType {
  hasNewSupportMessages: boolean;
  newMessagesCount: number;
  markAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  isWebSocketConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [hasNewSupportMessages, setHasNewSupportMessages] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Обработчик WebSocket сообщений
  const handleWebSocketMessage = useCallback((message: any) => {
    
    if (message.type === 'support_message') {
      // Новое сообщение от поддержки
      setHasNewSupportMessages(true);
      setNewMessagesCount(prev => prev + 1);
    } else if (message.type === 'hello' || message.type === 'connection_established') {
    }
  }, []);

  // WebSocket соединение (в продакшене всегда, в разработке если настроен)
  const isProduction = process.env.NODE_ENV === 'production';
  const wsUrl = process.env['NEXT_PUBLIC_WS_URL'];
  const isWebSocketEnabled = isProduction || (wsUrl && wsUrl !== 'false');
  
  // Состояние WebSocket соединения
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // WebSocket соединение
  useEffect(() => {
    if (!isWebSocketEnabled) {
      return;
    }

    const connectWebSocket = async () => {
      try {
        const token = await getCookie('access_token');
        if (!token) {
          return;
        }

        setConnectionStatus('connecting');
        const wsUrl = `${API_BASE.replace('http', 'ws')}/notifications?token=${token}`;
        
        const websocket = new WebSocket(wsUrl);
        setWs(websocket);

        websocket.onopen = () => {
          setIsConnected(true);
          setConnectionStatus('connected');
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('[NotificationsProvider] Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = (event) => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setWs(null);
        };

        websocket.onerror = (error) => {
          // WebSocket error event не содержит детальной информации об ошибке
          const errorInfo: any = {
            type: error.type,
            readyState: websocket.readyState,
            url: wsUrl
          };
          
          errorInfo.readyStateText = websocket.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                                     websocket.readyState === WebSocket.OPEN ? 'OPEN' :
                                     websocket.readyState === WebSocket.CLOSING ? 'CLOSING' :
                                     websocket.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN';
          
          console.error('[NotificationsProvider] WebSocket error:', errorInfo);
          setConnectionStatus('error');
          setIsConnected(false);
        };

      } catch (error) {
        console.error('[NotificationsProvider] Error connecting to WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    // Cleanup при размонтировании
    return () => {
      if (ws) {
        ws.close();
        setWs(null);
      }
    };
  }, [isWebSocketEnabled, handleWebSocketMessage]);

  const checkForNewMessages = useCallback(async () => {
    try {
      const token = await getCookie('access_token');
      if (!token) {
        // Пользователь не авторизован - это нормально
        return;
      }

      const data = await supportApi.getOpenTickets();
      const tickets = data.tickets || [];
      
      // Подсчитываем тикеты с новыми сообщениями
      const newMessagesTickets = tickets.filter((ticket: { status_new?: string }) => ticket.status_new === 'Новый ответ');
      const hasNew = newMessagesTickets.length > 0;
      const count = newMessagesTickets.length;
      
      setHasNewSupportMessages(hasNew);
      setNewMessagesCount(count);
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, []);

  const markAsRead = useCallback(() => {
    setHasNewSupportMessages(false);
    setNewMessagesCount(0);
  }, []);

  const refreshNotifications = useCallback(async () => {
    await checkForNewMessages();
  }, [checkForNewMessages]);

  // Проверяем новые сообщения при загрузке
  useEffect(() => {
    checkForNewMessages();
  }, [checkForNewMessages]);

  // Устанавливаем интервал для проверки новых сообщений
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isWebSocketEnabled) {
      // WebSocket отключен - используем polling
      interval = setInterval(checkForNewMessages, 60000); // Каждую минуту
    } else if (!isConnected) {
      // WebSocket включен, но не подключен - используем polling как fallback
      interval = setInterval(checkForNewMessages, 60000); // Каждую минуту
    } else {
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkForNewMessages, isConnected, isWebSocketEnabled]);

  const value = {
    hasNewSupportMessages,
    newMessagesCount,
    markAsRead,
    refreshNotifications,
    isWebSocketConnected: isConnected,
    connectionStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
