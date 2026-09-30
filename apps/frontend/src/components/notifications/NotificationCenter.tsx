'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Check, CheckCheck, Trash2, X, Package, Truck, AlertCircle, Users, Settings as SettingsIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { parseApiDate } from '@/lib/date-utils';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    clearError,
  } = useNotificationStore();

  // Загружаем уведомления при открытии
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ unread_only: showUnreadOnly });
    }
  }, [isOpen, showUnreadOnly, fetchNotifications]);

  // Периодически обновляем счетчик непрочитанных
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Каждые 30 секунд

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cargo_created':
      case 'cargo_updated':
      case 'cargo_deleted':
      case 'cargo_match':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'car_created':
      case 'car_updated':
      case 'route_match':
        return <Truck className="h-5 w-5 text-green-500" />;
      case 'support_reply':
      case 'support_closed':
      case 'support_message':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'company_invite':
      case 'user_added':
      case 'user_removed':
      case 'role_changed':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead([notificationId]);
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotif(notificationId);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead([notification.id_notification]);
    }
    if (notification.metadata?.link) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 left-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Панель уведомлений */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Панель */}
          <div className="absolute left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] max-h-[80vh] flex flex-col">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Уведомления
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    title="Отметить все как прочитанные"
                  >
                    <CheckCheck className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Фильтры */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  !showUnreadOnly
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showUnreadOnly
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Непрочитанные ({unreadCount})
              </button>
            </div>

            {/* Список уведомлений */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {error && (
                <div className="p-4 text-center text-red-600 dark:text-red-400">
                  {error}
                  <button onClick={clearError} className="ml-2 underline">
                    Закрыть
                  </button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Нет уведомлений</p>
                </div>
              )}

              {!loading && !error && notifications.length > 0 && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    const NotificationContent = (
                      <div
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        } ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {formatDistanceToNow(parseApiDate(notification.created_at), {
                                addSuffix: true,
                                locale: ru,
                              })}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id_notification, e)}
                                className="p-1 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                title="Отметить как прочитанное"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id_notification, e)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );

                    // Если есть ссылка, оборачиваем в Link
                    if (notification.metadata?.link) {
                      return (
                        <Link
                          key={notification.id_notification}
                          href={notification.metadata.link}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {NotificationContent}
                        </Link>
                      );
                    }

                    // Иначе просто div
                    return (
                      <div
                        key={notification.id_notification}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {NotificationContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Футер */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Посмотреть все уведомления
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

