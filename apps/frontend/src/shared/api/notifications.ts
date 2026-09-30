import { getCookie } from 'cookies-next';

import { API_BASE } from '@/lib/config';

// Хелпер для запросов с авторизацией
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getCookie('access_token');
  
  const response = await fetch(`${API_BASE}/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

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
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.unread_only) queryParams.append('unread_only', 'true');
  if (params?.type) queryParams.append('type', params.type);

  const query = queryParams.toString();
  return fetchWithAuth(`/notifications${query ? `?${query}` : ''}`);
}

// Получить количество непрочитанных
export async function getUnreadCount(): Promise<{ count: number }> {
  return fetchWithAuth('/notifications/unread-count');
}

// Отметить уведомления как прочитанные
export async function markNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean; count: number }> {
  return fetchWithAuth('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
}

// Отметить все как прочитанные
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
  return fetchWithAuth('/notifications/mark-all-read', {
    method: 'POST',
  });
}

// Удалить уведомление
export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

// Удалить все прочитанные
export async function deleteAllReadNotifications(): Promise<{ success: boolean; count: number }> {
  return fetchWithAuth('/notifications/read/all', {
    method: 'DELETE',
  });
}

// Получить настройки уведомлений
export async function getNotificationSettings(): Promise<NotificationSettings> {
  return fetchWithAuth('/notifications/settings');
}

// Обновить настройки уведомлений
export async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  return fetchWithAuth('/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

