import { z } from 'zod';

// Типы уведомлений
export const notificationTypes = [
  'cargo_created',
  'cargo_updated',
  'cargo_deleted',
  'car_created',
  'car_updated',
  'route_match',
  'cargo_match',
  'support_reply',
  'support_closed',
  'company_invite',
  'user_added',
  'user_removed',
  'role_changed',
  'system',
] as const;

export const notificationPriorities = ['low', 'medium', 'high', 'urgent'] as const;

// Schema для получения уведомлений
export const getNotificationsSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  unread_only: z.string().optional().transform(val => val === 'true'),
  type: z.enum(notificationTypes).optional(),
});

export type GetNotificationsDto = z.infer<typeof getNotificationsSchema>;

// Schema для создания уведомления
export const createNotificationSchema = z.object({
  id_user: z.string().uuid(),
  type: z.enum(notificationTypes),
  priority: z.enum(notificationPriorities).default('medium'),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

// Schema для отметки как прочитанное
export const markAsReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).min(1),
});

export type MarkAsReadDto = z.infer<typeof markAsReadSchema>;

// Schema для настроек уведомлений
export const updateNotificationSettingsSchema = z.object({
  // Email уведомления
  email_cargo_created: z.boolean().optional(),
  email_cargo_match: z.boolean().optional(),
  email_route_match: z.boolean().optional(),
  email_support_reply: z.boolean().optional(),
  email_company_invite: z.boolean().optional(),
  
  // In-app уведомления
  inapp_cargo_created: z.boolean().optional(),
  inapp_cargo_match: z.boolean().optional(),
  inapp_route_match: z.boolean().optional(),
  inapp_support_reply: z.boolean().optional(),
  inapp_company_invite: z.boolean().optional(),
  inapp_system: z.boolean().optional(),
  
  // Telegram уведомления
  telegram_enabled: z.boolean().optional(),
  telegram_chat_id: z.string().optional(),
});

export type UpdateNotificationSettingsDto = z.infer<typeof updateNotificationSettingsSchema>;

