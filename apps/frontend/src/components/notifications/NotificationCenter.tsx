'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Check, CheckCheck, Trash2, X, Package, Truck, AlertCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { parseApiDate } from '@/lib/date-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Монтируем компонент для Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Закрытие по клику вне области
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Небольшая задержка, чтобы не закрыть сразу при открытии
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
        return 'border-l-4 border-destructive bg-destructive/10';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-l-4 border-primary bg-primary/5';
      default:
        return 'border-l-4 border-border';
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="relative"
            aria-label="Уведомления"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full min-w-[18px] h-[18px]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          Уведомления{unreadCount > 0 && ` (${unreadCount})`}
        </TooltipContent>
      </Tooltip>

      {/* Панель уведомлений */}
      {isOpen && mounted && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-popover text-popover-foreground border border-border rounded-md top-16 left-4 max-w-[400px] sm:left-4 md:left-auto md:w-[500px] lg:w-[720px] z-[9999] max-h-[calc(100vh-5rem)] flex flex-col shadow-md outline-hidden scrollbar-hide animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Уведомления
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={markAllAsRead}
                    title="Отметить все как прочитанные"
                  >
                    <CheckCheck className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Фильтры */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Button
                variant={!showUnreadOnly ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowUnreadOnly(false)}
              >
                Все
              </Button>
              <Button
                variant={showUnreadOnly ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowUnreadOnly(true)}
              >
                Непрочитанные ({unreadCount})
              </Button>
            </div>

            {/* Список уведомлений */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}

              {error && (
                <div className="p-4 text-center text-destructive">
                  {error}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearError}
                    className="ml-2"
                  >
                    Закрыть
                  </Button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Нет уведомлений</p>
                </div>
              )}

              {!loading && !error && notifications.length > 0 && (
                <div className="divide-y divide-border bg-background">
                  {notifications.map((notification) => {
                    const NotificationContent = (
                      <div className="bg-background">
                        <div
                          className={cn(
                            "p-4 hover:bg-accent/10 transition-colors cursor-pointer",
                            !notification.is_read && 'bg-primary/5 dark:bg-primary/10',
                            getPriorityColor(notification.priority)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDistanceToNow(parseApiDate(notification.created_at), {
                                  addSuffix: true,
                                  locale: ru,
                                })}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleMarkAsRead(notification.id_notification, e)}
                                  className="h-8 w-8"
                                  title="Отметить как прочитанное"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDelete(notification.id_notification, e)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              <div className="p-3 border-t border-border">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Посмотреть все уведомления
                </Link>
              </div>
            )}
        </div>,
        document.body
      )}
    </div>
  );
}

