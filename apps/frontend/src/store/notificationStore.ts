import { create } from 'zustand';
import {
  getNotifications,
  getUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  type Notification,
  type GetNotificationsParams,
} from '@/shared/api/notifications';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (params?: GetNotificationsParams) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotif: (notificationId: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,

  fetchNotifications: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await getNotifications(params);
      set({
        notifications: data.items,
        total: data.total,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || 'Ошибка загрузки уведомлений',
        loading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await getUnreadCount();
      set({ unreadCount: data.count });
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationIds) => {
    try {
      await markNotificationsAsRead(notificationIds);
      
      // Обновляем локальное состояние
      set((state) => ({
        notifications: state.notifications.map((n) =>
          notificationIds.includes(n.id_notification)
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - notificationIds.length),
      }));
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || 'Ошибка отметки уведомлений',
      });
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Обновляем локальное состояние
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || 'Ошибка отметки всех уведомлений',
      });
    }
  },

  deleteNotif: async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // Удаляем из локального состояния
      set((state) => {
        const notification = state.notifications.find((n) => n.id_notification === notificationId);
        const wasUnread = notification && !notification.is_read;
        
        return {
          notifications: state.notifications.filter((n) => n.id_notification !== notificationId),
          total: state.total - 1,
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || 'Ошибка удаления уведомления',
      });
    }
  },

  deleteAllRead: async () => {
    try {
      const result = await deleteAllReadNotifications();
      
      // Удаляем прочитанные из локального состояния
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.is_read),
        total: state.total - result.count,
      }));
    } catch (error: any) {
      set({
        error: error?.response?.data?.error || 'Ошибка удаления прочитанных уведомлений',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

