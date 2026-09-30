import { NotificationRepository } from './notifications.repository';
import { CreateNotificationDto, GetNotificationsDto, MarkAsReadDto, UpdateNotificationSettingsDto } from './notifications.schema';

export class NotificationService {
  private repository = new NotificationRepository();

  // Создать уведомление
  async createNotification(data: CreateNotificationDto) {
    try {
      // Проверяем, включены ли in-app уведомления для этого типа
      const isEnabled = await this.repository.isNotificationEnabled(data.id_user, data.type, 'inapp');
      
      if (!isEnabled) {
        console.log(`In-app notifications disabled for user ${data.id_user}, type ${data.type}`);
        return null;
      }

      const notification = await this.repository.createNotification(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Создать уведомления для нескольких пользователей
  async createBulkNotifications(userIds: string[], data: Omit<CreateNotificationDto, 'id_user'>) {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.createNotification({
          ...data,
          id_user: userId,
        })
      )
    );
    return notifications.filter(n => n !== null);
  }

  // Получить уведомления
  async getNotifications(userId: string, filters: GetNotificationsDto) {
    try {
      return await this.repository.getNotifications(userId, {
        limit: filters.limit,
        offset: filters.offset,
        unreadOnly: filters.unread_only,
        type: filters.type,
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Получить количество непрочитанных
  async getUnreadCount(userId: string) {
    try {
      return await this.repository.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Отметить как прочитанные
  async markAsRead(userId: string, data: MarkAsReadDto) {
    try {
      return await this.repository.markAsRead(userId, data.notification_ids);
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Отметить все как прочитанные
  async markAllAsRead(userId: string) {
    try {
      return await this.repository.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Удалить уведомление
  async deleteNotification(userId: string, notificationId: string) {
    try {
      return await this.repository.deleteNotification(userId, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Удалить все прочитанные
  async deleteAllRead(userId: string) {
    try {
      return await this.repository.deleteAllRead(userId);
    } catch (error) {
      console.error('Error deleting all read:', error);
      throw error;
    }
  }

  // Получить настройки
  async getSettings(userId: string) {
    try {
      return await this.repository.getSettings(userId);
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  // Обновить настройки
  async updateSettings(userId: string, data: UpdateNotificationSettingsDto) {
    try {
      return await this.repository.updateSettings(userId, data);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

// Утилита для создания уведомлений (используется в других модулях)
export async function notifyUser(
  userId: string,
  type: CreateNotificationDto['type'],
  title: string,
  message: string,
  metadata?: Record<string, any>,
  priority: CreateNotificationDto['priority'] = 'medium'
) {
  const service = new NotificationService();
  return service.createNotification({
    id_user: userId,
    type,
    priority,
    title,
    message,
    metadata,
  });
}

// Утилита для создания уведомлений для всех пользователей компании
export async function notifyCompanyUsers(
  companyId: string,
  type: CreateNotificationDto['type'],
  title: string,
  message: string,
  metadata?: Record<string, any>,
  priority: CreateNotificationDto['priority'] = 'medium'
) {
  // Импортируем здесь, чтобы избежать циклических зависимостей
  const db = (await import('../../db/client')).default;
  const { users_company } = await import('../../db/schema/schema');
  const { eq } = await import('drizzle-orm');

  // Получаем всех пользователей компании
  const companyUsers = await db
    .select({ id_user: users_company.id_user })
    .from(users_company)
    .where(eq(users_company.id_company, companyId));

  const userIds = companyUsers.map(u => u.id_user);

  const service = new NotificationService();
  return service.createBulkNotifications(userIds, {
    type,
    priority,
    title,
    message,
    metadata: { ...metadata, company_id: companyId },
  });
}

// Утилита для уведомления ДРУГИХ компаний о новом грузе (кроме создавшей)
export async function notifyOtherCompaniesAboutCargo(
  excludeCompanyId: string,
  cargo: any,
  cargoDetails: {
    cargo_id: number;
    departure_point: string;
    arrival_point: string;
    tonn: number;
    m3: number;
    date_start: string | Date;
    date_end: string | Date;
  }
) {
  // Импортируем здесь, чтобы избежать циклических зависимостей
  const db = (await import('../../db/client')).default;
  const { users_company, company } = await import('../../db/schema/schema');
  const { eq, ne } = await import('drizzle-orm');

  console.log('🔔 [NOTIFICATIONS] Sending cargo notifications to other companies...');
  console.log('🔔 [NOTIFICATIONS] Excluding company:', excludeCompanyId);

  // Получаем всех пользователей ДРУГИХ компаний (исключая компанию-создателя)
  const otherCompanyUsers = await db
    .select({ 
      id_user: users_company.id_user,
      id_company: users_company.id_company,
    })
    .from(users_company)
    .where(ne(users_company.id_company, excludeCompanyId));

  console.log('🔔 [NOTIFICATIONS] Found users from other companies:', otherCompanyUsers.length);

  if (otherCompanyUsers.length === 0) {
    console.log('🔔 [NOTIFICATIONS] No other company users found');
    return [];
  }

  const userIds = otherCompanyUsers.map(u => u.id_user);

  const service = new NotificationService();
  
  // Формируем красивое сообщение с деталями груза
  const title = '🚚 Новый груз доступен';
  const message = `${cargoDetails.departure_point} → ${cargoDetails.arrival_point} | ${cargoDetails.tonn}т, ${cargoDetails.m3}м³`;
  
  const notifications = await service.createBulkNotifications(userIds, {
    type: 'cargo_match',
    priority: 'medium',
    title,
    message,
    metadata: {
      cargo_id: cargoDetails.cargo_id,
      departure_point: cargoDetails.departure_point,
      arrival_point: cargoDetails.arrival_point,
      link: `/cargo/${cargoDetails.cargo_id}`, // Ссылка для просмотра груза
    },
  });

  console.log('🔔 [NOTIFICATIONS] Sent notifications:', notifications.length);
  return notifications;
}

