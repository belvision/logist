'use client';
import { useEffect, useRef } from 'react';
import { connectNotificationsWS } from '@/lib/ws';
import { getAccessToken } from '@/lib/auth/token';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotifications } from '@/shared/context/notifications-context';

export default function NotificationsProvider() {
  const wsRef = useRef<ReturnType<typeof connectNotificationsWS> | null>(null);
  const { fetchUnreadCount } = useNotificationStore();
  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    // Проверяем, что пользователь действительно авторизован
    // Если мы на публичной странице, не подключаемся к WebSocket
    const publicPaths = [
      '/',
      '/login', 
      '/registry',
      '/cargo-owners',
      '/carriers',
      '/carriers/7-steps',
      '/carriers/add-transport',
      '/carriers/licenses',
      '/team'
    ];
    
    const isPublicPage = publicPaths.includes(window.location.pathname) || 
                        window.location.pathname.startsWith('/invite') ||
                        window.location.pathname.startsWith('/countries/');
    
    if (isPublicPage) {
      return;
    }

    // Проверяем валидность токена (базовая проверка JWT структуры)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return;
      }
      
      // Проверяем, не истек ли токен
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return;
      }
    } catch {
      return;
    }

    // Проверяем, нужно ли отключать WebSocket в режиме разработки
    const disableWebSocket = process.env.NODE_ENV === 'development' && 
                            process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true';
    
    if (disableWebSocket) {
      return;
    }

    wsRef.current = connectNotificationsWS({
      token,
      onOpen: () => {
      },
      onMessage: (data) => {
        
        // Обрабатываем сообщения от поддержки
        if (data.type === 'support_message') {
          // Обновляем счетчик непрочитанных уведомлений
          fetchUnreadCount();
          // Обновляем контекст уведомлений для отображения меток
          refreshNotifications();
          
          // Отправляем событие для обновления данных тикетов
          window.dispatchEvent(new CustomEvent('supportMessageReceived', {
            detail: { ticketId: data.data?.ticket_id }
          }));
        }
        
        // Обрабатываем другие типы уведомлений
        if (data.type === 'notification') {
          // Обновляем счетчик непрочитанных уведомлений
          fetchUnreadCount();
          // Обновляем контекст уведомлений для отображения меток
          refreshNotifications();
          
          // Показываем уведомление пользователю для всех типов
        }
      },
      onError: () => {},
      onClose: () => {}
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return null;
}
