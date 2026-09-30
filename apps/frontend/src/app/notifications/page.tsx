'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; 

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    deleteAllRead,
  } = useNotificationStore();

  useEffect(() => {
    const params: any = { limit: 100 };
    if (filter === 'unread') params.unread_only = true;
    if (filterType !== 'all') params.type = filterType;
    
    fetchNotifications(params);
  }, [filter, filterType, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    const params: any = { limit: 100 };
    if (filter === 'unread') params.unread_only = true;
    if (filterType !== 'all') params.type = filterType;
    fetchNotifications(params);
  };

  const handleDeleteRead = async () => {
    await deleteAllRead();
    const params: any = { limit: 100 };
    if (filter === 'unread') params.unread_only = true;
    if (filterType !== 'all') params.type = filterType;
    fetchNotifications(params);
  };

  const handleNotificationUpdate = () => {
    const params: any = { limit: 100 };
    if (filter === 'unread') params.unread_only = true;
    if (filterType !== 'all') params.type = filterType;
    fetchNotifications(params);
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n) => !n.is_read) 
    : notifications;

  return (
    <AppLayout>
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Уведомления</h1>
          <p className="text-muted-foreground">
            Всего: {total} • Непрочитанных: {unreadCount}
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="px-6"
              >
                Все
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
                className="px-6"
              >
                Непрочитанные
              </Button>
            </div>

            {/* Filter Dropdown */}
            <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value)}
            // className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Тип уведомления" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="cargo_created">Грузы</SelectItem>
              <SelectItem value="car_created">Автомобили</SelectItem>
              <SelectItem value="support_reply">Поддержка</SelectItem>
              <SelectItem value="company_invite">Компания</SelectItem>
            </SelectContent>
            {/* <option value="cargo_created">Грузы</option>
            <option value="car_created">Автомобили</option>
            <option value="support_reply">Поддержка</option>
            <option value="company_invite">Компания</option> */}
          </Select>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => n.is_read) && (
              <button
                onClick={handleDeleteRead}
                className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
              >
                Удалить прочитанные
              </button>
            )}

            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} className="px-6">
                <Check className="w-4 h-4 mr-2" />
                Отметить все как прочитанные
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id_notification}
                  notification={notification}
                  onUpdate={handleNotificationUpdate}
                  onMarkAsRead={async (id) => {
                    await markAsRead([id]);
                  }}
                  onDelete={async (id) => {
                    await deleteNotif(id);
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  {filter === 'unread' 
                    ? 'У вас нет непрочитанных уведомлений'
                    : 'Нет уведомлений'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
