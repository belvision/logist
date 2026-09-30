import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createConversationHandler,
  getConversationsHandler,
  getConversationByIdHandler,
  updateConversationHandler,
  archiveConversationHandler,
  restoreConversationHandler,
  blockConversationHandler,
  toggleNotificationsHandler,
  sendTypingStatusHandler,
  sendMessageHandler,
  getMessagesHandler,
  getMessageByIdHandler,
  markMessagesAsReadHandler,
  getMessengerStatsHandler,
} from './messenger.controller';

const messengerRouter = new Hono();

// Беседы
messengerRouter.post('/conversations', authenticate, createConversationHandler);
messengerRouter.get('/conversations', authenticate, getConversationsHandler);
messengerRouter.get('/conversations/:id', authenticate, getConversationByIdHandler);
messengerRouter.put('/conversations/:id', authenticate, updateConversationHandler);
messengerRouter.post('/conversations/:id/archive', authenticate, archiveConversationHandler);
messengerRouter.post('/conversations/:id/restore', authenticate, restoreConversationHandler);
messengerRouter.post('/conversations/:id/block', authenticate, blockConversationHandler);
messengerRouter.post('/conversations/:id/toggle-notifications', authenticate, toggleNotificationsHandler);
messengerRouter.post('/conversations/:id/typing', authenticate, sendTypingStatusHandler);

// Сообщения
messengerRouter.post('/messages', authenticate, sendMessageHandler);
messengerRouter.get('/conversations/:id/messages', authenticate, getMessagesHandler);
messengerRouter.get('/messages/:id', authenticate, getMessageByIdHandler);
messengerRouter.post('/messages/mark-read', authenticate, markMessagesAsReadHandler);

// Статистика
messengerRouter.get('/stats', authenticate, getMessengerStatsHandler);

export default messengerRouter;
