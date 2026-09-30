'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Trash2, Check, Settings as SettingsIcon, Package, Truck, AlertCircle, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiDate } from '@/lib/date-utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationsPage() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

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
    if (showUnreadOnly) params.unread_only = true;
    if (filterType !== 'all') params.type = filterType;
    
    fetchNotifications(params);
  }, [filterType, showUnreadOnly, fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cargo_created':
      case 'cargo_updated':
      case 'cargo_deleted':
      case 'cargo_match':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'car_created':
      case 'car_updated':
      case 'route_match':
        return <Truck className="h-6 w-6 text-green-500" />;
      case 'support_reply':
      case 'support_closed':
      case 'support_message':
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
      case 'company_invite':
      case 'user_added':
      case 'user_removed':
      case 'role_changed':
        return <Users className="h-6 w-6 text-purple-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };

    const labels = {
      urgent: 'Срочно',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead([notification.id_notification]);
    }
    if (notification.metadata?.link) {
      router.push(notification.metadata.link);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Уведомления
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Всего: {total} {unreadCount > 0 && `• Непрочитанных: ${unreadCount}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Отметить все как прочитанные
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowUnreadOnly(false)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            !showUnreadOnly
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setShowUnreadOnly(true)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showUnreadOnly
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
          }`}
        >
          Непрочитанные
        </button>

        <div className="ml-auto">
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value)}
            // className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Тип уведомления" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
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

        {notifications.some((n) => n.is_read) && (
          <button
            onClick={deleteAllRead}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
          >
            Удалить прочитанные
          </button>
        )}
      </div>

      {/* Список уведомлений */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет уведомлений
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showUnreadOnly
              ? 'У вас нет непрочитанных уведомлений'
              : 'У вас пока нет уведомлений'}
          </p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id_notification}
              onClick={() => handleNotificationClick(notification)}
              className={`p-5 bg-white dark:bg-gray-800 rounded-lg border transition-all cursor-pointer ${
                !notification.is_read
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Иконка */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(notification.priority)}
                      {!notification.is_read && (
                        <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(parseApiDate(notification.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead([notification.id_notification]);
                          }}
                          className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                          title="Отметить как прочитанное"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif(notification.id_notification);
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  );
}

