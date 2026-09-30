import { Context } from 'hono';
import { NotificationService } from './notifications.service';
import { 
  getNotificationsSchema, 
  markAsReadSchema, 
  updateNotificationSettingsSchema 
} from './notifications.schema';

const notificationService = new NotificationService();

// Получить уведомления пользователя
export async function getNotificationsHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const queryParams = c.req.query();
    const parsed = getNotificationsSchema.safeParse(queryParams);

    if (!parsed.success) {
      return c.json({ error: 'Неверные параметры запроса', details: parsed.error.errors }, 400);
    }

    const result = await notificationService.getNotifications(userId, parsed.data);
    return c.json(result);
  } catch (error) {
    console.error('Error in getNotificationsHandler:', error);
    return c.json({ error: 'Ошибка при получении уведомлений' }, 500);
  }
}

// Получить количество непрочитанных уведомлений
export async function getUnreadCountHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const count = await notificationService.getUnreadCount(userId);
    return c.json({ count });
  } catch (error) {
    console.error('Error in getUnreadCountHandler:', error);
    return c.json({ error: 'Ошибка при получении количества непрочитанных' }, 500);
  }
}

// Отметить уведомления как прочитанные
export async function markAsReadHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const body = await c.req.json();
    const parsed = markAsReadSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Неверные данные', details: parsed.error.errors }, 400);
    }

    const updated = await notificationService.markAsRead(userId, parsed.data);
    return c.json({ success: true, count: updated.length });
  } catch (error) {
    console.error('Error in markAsReadHandler:', error);
    return c.json({ error: 'Ошибка при отметке уведомлений' }, 500);
  }
}

// Отметить все уведомления как прочитанные
export async function markAllAsReadHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const updated = await notificationService.markAllAsRead(userId);
    return c.json({ success: true, count: updated.length });
  } catch (error) {
    console.error('Error in markAllAsReadHandler:', error);
    return c.json({ error: 'Ошибка при отметке всех уведомлений' }, 500);
  }
}

// Удалить уведомление
export async function deleteNotificationHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const notificationId = c.req.param('id');
    if (!notificationId) {
      return c.json({ error: 'ID уведомления обязателен' }, 400);
    }

    const deleted = await notificationService.deleteNotification(userId, notificationId);
    if (!deleted) {
      return c.json({ error: 'Уведомление не найдено' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error in deleteNotificationHandler:', error);
    return c.json({ error: 'Ошибка при удалении уведомления' }, 500);
  }
}

// Удалить все прочитанные уведомления
export async function deleteAllReadHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const count = await notificationService.deleteAllRead(userId);
    return c.json({ success: true, count });
  } catch (error) {
    console.error('Error in deleteAllReadHandler:', error);
    return c.json({ error: 'Ошибка при удалении прочитанных уведомлений' }, 500);
  }
}

// Получить настройки уведомлений
export async function getSettingsHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const settings = await notificationService.getSettings(userId);
    return c.json(settings);
  } catch (error) {
    console.error('Error in getSettingsHandler:', error);
    return c.json({ error: 'Ошибка при получении настроек' }, 500);
  }
}

// Обновить настройки уведомлений
export async function updateSettingsHandler(c: Context) {
  try {
    const userId = c.get('user')?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const body = await c.req.json();
    const parsed = updateNotificationSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Неверные данные', details: parsed.error.errors }, 400);
    }

    const updated = await notificationService.updateSettings(userId, parsed.data);
    return c.json(updated);
  } catch (error) {
    console.error('Error in updateSettingsHandler:', error);
    return c.json({ error: 'Ошибка при обновлении настроек' }, 500);
  }
}

