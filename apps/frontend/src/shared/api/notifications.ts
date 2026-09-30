import { clientAuth } from './api';

// Type assertion для clientAuth чтобы избежать ошибок типизации
const apiAuth = clientAuth as any;

export interface Notification {
  id_notification: string;
  id_user: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  metadata?: {
    cargo_id?: number;
    car_id?: number;
    route_id?: number;
    company_id?: string;
    ticket_id?: string;
    user_id?: string;
    link?: string;
    [key: string]: any;
  };
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationSettings {
  id_setting: string;
  id_user: string;
  // Email уведомления
  email_cargo_created: boolean;
  email_cargo_match: boolean;
  email_route_match: boolean;
  email_support_reply: boolean;
  email_company_invite: boolean;
  // In-app уведомления
  inapp_cargo_created: boolean;
  inapp_cargo_match: boolean;
  inapp_route_match: boolean;
  inapp_support_reply: boolean;
  inapp_company_invite: boolean;
  inapp_system: boolean;
  // Telegram уведомления
  telegram_enabled: boolean;
  telegram_chat_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
  type?: string;
}

export interface GetNotificationsResponse {
  items: Notification[];
  total: number;
  limit: number;
  offset: number;
}

// Получить уведомления
export async function getNotifications(params?: GetNotificationsParams): Promise<GetNotificationsResponse> {
  const query: Record<string, string> = {};
  if (params?.limit) query['limit'] = params.limit.toString();
  if (params?.offset) query['offset'] = params.offset.toString();
  if (params?.unread_only) query['unread_only'] = 'true';
  if (params?.type) query['type'] = params.type;

  const resp = await apiAuth.notifications.$get({
    query
  });
  return resp.json();
}

// Получить количество непрочитанных
export async function getUnreadCount(): Promise<{ count: number }> {
  const resp = await apiAuth.notifications['unread-count'].$get();
  return resp.json();
}

// Отметить уведомления как прочитанные
export async function markNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean; count: number }> {
  const resp = await apiAuth.notifications['mark-read'].$post({
    json: { notification_ids: notificationIds }
  });
  return resp.json();
}

// Отметить все как прочитанные
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
  const resp = await apiAuth.notifications['mark-all-read'].$post();
  return resp.json();
}

// Удалить уведомление
export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  const resp = await apiAuth.notifications[':id'].$delete({
    param: { id: notificationId }
  });
  return resp.json();
}

// Удалить все прочитанные
export async function deleteAllReadNotifications(): Promise<{ success: boolean; count: number }> {
  const resp = await apiAuth.notifications.read.all.$delete();
  return resp.json();
}

// Получить настройки уведомлений
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const resp = await apiAuth.notifications.settings.$get();
  return resp.json();
}

// Обновить настройки уведомлений
export async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const resp = await apiAuth.notifications.settings.$put({
    json: settings
  });
  return resp.json();
}

