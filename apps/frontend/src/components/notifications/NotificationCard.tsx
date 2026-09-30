'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, Trash2, Package, Truck, AlertCircle, Users, Bell } from 'lucide-react';
import { parseApiDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/shared/api/notifications';

interface NotificationCardProps {
  notification: Notification;
  onUpdate: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotificationCard({ 
  notification, 
  onUpdate,
  onMarkAsRead,
  onDelete 
}: NotificationCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors] || colors.low}`}>
        {labels[priority as keyof typeof labels] || labels.low}
      </span>
    );
  };

  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id_notification);
    }
    if (notification.metadata?.link) {
      router.push(notification.metadata.link);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onMarkAsRead(notification.id_notification);
    onUpdate();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(notification.id_notification);
    onUpdate();
    setIsDeleting(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-5 bg-card border rounded-lg transition-all cursor-pointer ${
        !notification.is_read
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border hover:border-border/80'
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
            <h3 className="text-lg font-semibold text-foreground">
              {notification.title}
            </h3>
            <div className="flex items-center gap-2">
              {getPriorityBadge(notification.priority)}
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground mb-3">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(parseApiDate(notification.created_at), {
                addSuffix: true,
                locale: ru,
              })}
            </span>

            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMarkAsRead}
                  className="h-8 w-8"
                  title="Отметить как прочитанное"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

