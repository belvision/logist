import { Context } from 'hono';
import { MessengerService } from './messenger.service';
import { z } from 'zod';
import type { 
  CreateConversationRequest, 
  SendMessageRequest, 
  MarkAsReadRequest,
  UpdateConversationRequest
} from './messenger.types';

// Валидационные схемы
const CreateConversationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  relatedCargoId: z.number().optional(),
  relatedRouteId: z.number().optional(),
});

const SendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  type: z.enum(['text', 'file', 'image', 'system']).optional().default('text'),
  metadata: z.object({
    filename: z.string().optional(),
    file_size: z.number().optional(),
    mime_type: z.string().optional(),
    file_url: z.string().optional(),
    thumbnail_url: z.string().optional(),
  }).optional(),
});

const MarkAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid('Invalid message ID')).min(1, 'At least one message ID required'),
});

const UpdateConversationSchema = z.object({
  status: z.enum(['Активен', 'Архивирован', 'Заблокирован']).optional(),
  notifications_enabled: z.boolean().optional(),
});

const GetConversationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const GetMessagesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

const service = new MessengerService();

/**
 * POST /api/messenger/conversations
 * Создает новую беседу
 */
export const createConversationHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validatedData = CreateConversationSchema.parse(body);
    
    const conversation = await service.createConversation(user.id_user, validatedData);
    
    return c.json({
      success: true,
      data: conversation,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Create conversation error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * GET /api/messenger/conversations
 * Получает список бесед пользователя
 */
export const getConversationsHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query();
    const validatedQuery = GetConversationsSchema.parse(query);
    
    const result = await service.getConversations(
      user.id_user, 
      validatedQuery.page, 
      validatedQuery.limit
    );
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Get conversations error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * GET /api/messenger/conversations/:id
 * Получает беседу по ID
 */
export const getConversationByIdHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const conversation = await service.getConversationById(conversationId, user.id_user);
    
    return c.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    
    if (error instanceof Error && error.message === 'Conversation not found') {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    if (error instanceof Error && error.message === 'Access denied') {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * PUT /api/messenger/conversations/:id
 * Обновляет настройки беседы
 */
export const updateConversationHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const body = await c.req.json();
    const validatedData = UpdateConversationSchema.parse(body);
    
    const conversation = await service.updateConversation(
      conversationId, 
      user.id_user, 
      validatedData
    );
    
    return c.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Update conversation error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/messages
 * Отправляет сообщение
 */
export const sendMessageHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validatedData = SendMessageSchema.parse(body);
    
    const message = await service.sendMessage(user.id_user, validatedData);
    
    return c.json({
      success: true,
      data: message,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Send message error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * GET /api/messenger/conversations/:id/messages
 * Получает сообщения беседы
 */
export const getMessagesHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const query = c.req.query();
    const validatedQuery = GetMessagesSchema.parse(query);
    
    const result = await service.getMessages(
      conversationId, 
      user.id_user, 
      validatedQuery.page, 
      validatedQuery.limit
    );
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Get messages error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * GET /api/messenger/messages/:id
 * Получает сообщение по ID
 */
export const getMessageByIdHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messageId = c.req.param('id');
    if (!messageId) {
      return c.json({ error: 'Message ID is required' }, 400);
    }

    const message = await service.getMessageById(messageId);
    
    return c.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Get message error:', error);
    
    if (error instanceof Error && error.message === 'Message not found') {
      return c.json({ error: 'Message not found' }, 404);
    }

    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/messages/mark-read
 * Отмечает сообщения как прочитанные
 */
export const markMessagesAsReadHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validatedData = MarkAsReadSchema.parse(body);
    
    await service.markMessagesAsRead(user.id_user, validatedData);
    
    return c.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Mark messages as read error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * GET /api/messenger/stats
 * Получает статистику мессенджера
 */
export const getMessengerStatsHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const stats = await service.getMessengerStats(user.id_user);
    
    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get messenger stats error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/conversations/:id/archive
 * Архивирует беседу
 */
export const archiveConversationHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const conversation = await service.archiveConversation(conversationId, user.id_user);
    
    return c.json({
      success: true,
      data: conversation,
      message: 'Conversation archived',
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/conversations/:id/restore
 * Восстанавливает беседу из архива
 */
export const restoreConversationHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const conversation = await service.restoreConversation(conversationId, user.id_user);
    
    return c.json({
      success: true,
      data: conversation,
      message: 'Conversation restored',
    });
  } catch (error) {
    console.error('Restore conversation error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/conversations/:id/block
 * Блокирует беседу
 */
export const blockConversationHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const conversation = await service.blockConversation(conversationId, user.id_user);
    
    return c.json({
      success: true,
      data: conversation,
      message: 'Conversation blocked',
    });
  } catch (error) {
    console.error('Block conversation error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/conversations/:id/toggle-notifications
 * Включает/выключает уведомления для беседы
 */
export const toggleNotificationsHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const body = await c.req.json();
    const { enabled } = body;
    if (typeof enabled !== 'boolean') {
      return c.json({ error: 'Enabled flag is required and must be boolean' }, 400);
    }

    const conversation = await service.toggleNotifications(
      conversationId, 
      user.id_user, 
      enabled
    );
    
    return c.json({
      success: true,
      data: conversation,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error('Toggle notifications error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

/**
 * POST /api/messenger/conversations/:id/typing
 * Отправляет статус "печатает"
 */
export const sendTypingStatusHandler = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user?.id_user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    if (!conversationId) {
      return c.json({ error: 'Conversation ID is required' }, 400);
    }

    const body = await c.req.json();
    const { isTyping } = body;
    if (typeof isTyping !== 'boolean') {
      return c.json({ error: 'isTyping flag is required and must be boolean' }, 400);
    }

    await service.sendTypingStatus(conversationId, user.id_user, isTyping);
    
    return c.json({
      success: true,
      message: `Typing status ${isTyping ? 'sent' : 'stopped'}`,
    });
  } catch (error) {
    console.error('Send typing status error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};