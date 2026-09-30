import db from '../../db/client';
import { notifications, notification_settings } from '../../db/schema/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { CreateNotificationDto, UpdateNotificationSettingsDto } from './notifications.schema';

export class NotificationRepository {
  // Создать уведомление
  async createNotification(data: CreateNotificationDto) {
    const [notification] = await db
      .insert(notifications)
      .values({
        id_user: data.id_user,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      })
      .returning();
    
    return notification;
  }

  // Получить уведомления пользователя
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean; type?: string }
  ) {
    const { limit = 50, offset = 0, unreadOnly = false, type } = options;

    const conditions = [eq(notifications.id_user, userId)];
    
    if (unreadOnly) {
      conditions.push(eq(notifications.is_read, false));
    }
    
    if (type) {
      conditions.push(sql`${notifications.type} = ${type}`);
    }

    const items = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(...conditions));

    return {
      items,
      total: count,
      limit,
      offset,
    };
  }

  // Получить количество непрочитанных уведомлений
  async getUnreadCount(userId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.id_user, userId), eq(notifications.is_read, false)));

    return count;
  }

  // Отметить уведомления как прочитанные
  async markAsRead(userId: string, notificationIds: string[]) {
    const updated = await db
      .update(notifications)
      .set({
        is_read: true,
        read_at: new Date(),
      })
      .where(
        and(
          eq(notifications.id_user, userId),
          inArray(notifications.id_notification, notificationIds)
        )
      )
      .returning();

    return updated;
  }

  // Отметить все уведомления как прочитанные
  async markAllAsRead(userId: string) {
    const updated = await db
      .update(notifications)
      .set({
        is_read: true,
        read_at: new Date(),
      })
      .where(and(eq(notifications.id_user, userId), eq(notifications.is_read, false)))
      .returning();

    return updated;
  }

  // Удалить уведомление
  async deleteNotification(userId: string, notificationId: string) {
    const deleted = await db
      .delete(notifications)
      .where(
        and(eq(notifications.id_user, userId), eq(notifications.id_notification, notificationId))
      )
      .returning();

    return deleted.length > 0;
  }

  // Удалить все прочитанные уведомления
  async deleteAllRead(userId: string) {
    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id_user, userId), eq(notifications.is_read, true)))
      .returning();

    return deleted.length;
  }

  // Получить настройки уведомлений
  async getSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(notification_settings)
      .where(eq(notification_settings.id_user, userId));

    // Если настроек нет, создаем с дефолтными значениями
    if (!settings) {
      const [newSettings] = await db
        .insert(notification_settings)
        .values({ id_user: userId })
        .returning();
      return newSettings;
    }

    return settings;
  }

  // Обновить настройки уведомлений
  async updateSettings(userId: string, data: UpdateNotificationSettingsDto) {
    // Проверяем существование настроек
    const existing = await this.getSettings(userId);

    const [updated] = await db
      .update(notification_settings)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(notification_settings.id_user, userId))
      .returning();

    return updated;
  }

  // Проверить, включены ли уведомления определенного типа
  async isNotificationEnabled(userId: string, type: string, channel: 'email' | 'inapp' | 'telegram'): Promise<boolean> {
    const settings = await this.getSettings(userId);
    
    // Маппинг типов уведомлений на настройки
    const settingsMap: Record<string, string> = {
      'cargo_created': 'cargo_created',
      'cargo_match': 'cargo_match',
      'route_match': 'route_match',
      'support_reply': 'support_reply',
      'company_invite': 'company_invite',
      'system': 'system',
    };

    const settingKey = settingsMap[type];
    if (!settingKey) return true; // По умолчанию включено для неизвестных типов

    const fullKey = `${channel}_${settingKey}` as keyof typeof settings;
    return settings[fullKey] !== false;
  }
}

