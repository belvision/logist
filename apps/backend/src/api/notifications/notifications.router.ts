import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  deleteAllReadHandler,
  getSettingsHandler,
  updateSettingsHandler,
} from './notifications.controller';

const notificationsRouter = new Hono();

// Все маршруты требуют авторизации
notificationsRouter.use('/*', authenticate);

// Получить уведомления
notificationsRouter.get('/', getNotificationsHandler);

// Получить количество непрочитанных
notificationsRouter.get('/unread-count', getUnreadCountHandler);

// Отметить уведомления как прочитанные
notificationsRouter.post('/mark-read', markAsReadHandler);

// Отметить все как прочитанные
notificationsRouter.post('/mark-all-read', markAllAsReadHandler);

// Удалить уведомление
notificationsRouter.delete('/:id', deleteNotificationHandler);

// Удалить все прочитанные
notificationsRouter.delete('/read/all', deleteAllReadHandler);

// Получить настройки уведомлений
notificationsRouter.get('/settings', getSettingsHandler);

// Обновить настройки уведомлений
notificationsRouter.put('/settings', updateSettingsHandler);

export default notificationsRouter;

