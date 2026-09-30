'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectNotificationsWS } from '@/lib/ws';
import { getAccessToken } from '@/lib/auth/token';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<ReturnType<typeof connectNotificationsWS> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(async () => {
    if (wsRef.current) {
      return;
    }

    // Проверяем, включен ли WebSocket
    const isProduction = process.env.NODE_ENV === 'production';
    const wsUrl = process.env['NEXT_PUBLIC_WS_URL'];
    
    // В продакшене WebSocket должен работать, в разработке может быть отключен
    if (wsUrl === 'false') {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }
    
    // В режиме разработки отключаем WebSocket если не настроен URL
    if (!isProduction && !wsUrl) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    try {
      // Получаем токен
      const token = getAccessToken();
      if (!token) {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        return;
      }

      setConnectionStatus('connecting');

      // Используем новый WebSocket клиент
      wsRef.current = connectNotificationsWS({
        url: wsUrl,
        token,
        onOpen: () => {
          setIsConnected(true);
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
          onOpen?.();
        },
        onMessage: (data) => {
          onMessage?.(data);
        },
        onClose: (e) => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          wsRef.current = null;
          onClose?.();

          // Don't auto-reconnect if it's a permanent closure or max attempts reached
          const reason = String(e.reason || '').toLowerCase();
          const permanentPolicy = e.code === 1008 && (reason === 'unauthorized' || reason === 'token_required');
          if (permanentPolicy || e.code === 4003 || reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setConnectionStatus('error');
            return;
          }
          
          // Автоматическое переподключение с экспоненциальной задержкой
          if (shouldReconnectRef.current) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        },
        onError: (error) => {
          console.error('[WebSocket] Error:', error);
          setConnectionStatus('error');
          onError?.(error);
        }
      });

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(message);
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }, [isConnected]);

  // Автоматическое подключение при монтировании
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage
  };
}