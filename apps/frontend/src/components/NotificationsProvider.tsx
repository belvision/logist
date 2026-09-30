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
      console.log('[NotificationsProvider] No token available, skipping WebSocket connection');
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
      console.log('[NotificationsProvider] On public page, skipping WebSocket connection');
      return;
    }

    // Проверяем валидность токена (базовая проверка JWT структуры)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[NotificationsProvider] Invalid token format, skipping WebSocket connection');
        return;
      }
      
      // Проверяем, не истек ли токен
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('[NotificationsProvider] Token expired, skipping WebSocket connection');
        return;
      }
    } catch (error) {
      console.log('[NotificationsProvider] Invalid token, skipping WebSocket connection');
      return;
    }

    // Проверяем, нужно ли отключать WebSocket в режиме разработки
    const disableWebSocket = process.env.NODE_ENV === 'development' && 
                            process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true';
    
    if (disableWebSocket) {
      console.log('[NotificationsProvider] WebSocket disabled in development mode');
      return;
    }

    console.log('[NotificationsProvider] Creating WebSocket connection');
    wsRef.current = connectNotificationsWS({
      token,
      onOpen: () => {
        console.log('[NotificationsProvider] WebSocket connected successfully');
      },
      onMessage: (data) => {
        console.log('[NotificationsProvider] Message received:', data);
        
        // Обрабатываем сообщения от поддержки
        if (data.type === 'support_message') {
          console.log('[NotificationsProvider] New support message received');
          // Обновляем счетчик непрочитанных уведомлений
          fetchUnreadCount();
          // Обновляем контекст уведомлений для отображения меток
          refreshNotifications();
          
          // Отправляем событие для обновления данных тикетов
          console.log('[NotificationsProvider] Dispatching support message event');
          window.dispatchEvent(new CustomEvent('supportMessageReceived', {
            detail: { ticketId: data.data?.ticket_id }
          }));
        }
        
        // Обрабатываем другие типы уведомлений
        if (data.type === 'notification') {
          console.log('[NotificationsProvider] New notification received:', data.data);
          // Обновляем счетчик непрочитанных уведомлений
          fetchUnreadCount();
          // Обновляем контекст уведомлений для отображения меток
          refreshNotifications();
          
          // Показываем уведомление пользователю для всех типов
          console.log('[NotificationsProvider] Notification type:', data.data?.type);
        }
      },
      onError: (e) => {
        // Убираем избыточное логирование ошибок
        // console.error('[NotificationsProvider] WebSocket error:', e);
        console.log('[NotificationsProvider] WebSocket error occurred, connection will retry');
      },
      onClose: (e) => {
        console.log('[NotificationsProvider] WebSocket closed:', e.code, e.reason);
        // Не закрываем соединение здесь, только логируем
      }
    });

    return () => {
      console.log('[NotificationsProvider] Component unmounting, cleaning up WebSocket connection');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return null;
}
