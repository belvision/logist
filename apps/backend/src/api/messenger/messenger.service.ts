import { MessengerRepository } from './messenger.repository';
import { sendNotificationToUser, sendMessengerMessage, sendTypingStatus, sendReadStatus, sendConversationUpdate } from '../../ws/notifications';
import type { 
  CreateConversationRequest, 
  SendMessageRequest, 
  MessageResponse, 
  ConversationResponse,
  ConversationListResponse,
  MessageListResponse,
  MarkAsReadRequest,
  UpdateConversationRequest
} from './messenger.types';

export class MessengerService {
  private repository: MessengerRepository;

  constructor() {
    this.repository = new MessengerRepository();
  }

  /**
   * Создает новую беседу между пользователями
   */
  async createConversation(
    currentUserId: string, 
    request: CreateConversationRequest
  ): Promise<ConversationResponse> {
    const conversation = await this.repository.createConversation(currentUserId, request);

    // Отправляем уведомление о начале новой беседы
    const otherUserId = conversation.id_user1 === currentUserId ? conversation.id_user2 : conversation.id_user1;
    
    await this.sendConversationNotification(
      otherUserId,
      'conversation_started',
      'Новая беседа',
      `Пользователь начал с вами беседу`,
      {
        conversation_id: conversation.id_conversation,
        sender_id: currentUserId,
        sender_name: conversation.id_user1 === currentUserId ? conversation.user1?.username : conversation.user2?.username,
      }
    );

    return conversation;
  }

  /**
   * Получает беседу по ID
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationResponse> {
    return this.repository.getConversationById(conversationId, userId);
  }

  /**
   * Получает список бесед пользователя
   */
  async getConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ConversationListResponse> {
    return this.repository.getConversations(userId, page, limit);
  }

  /**
   * Отправляет сообщение в беседу
   */
  async sendMessage(
    senderId: string, 
    request: SendMessageRequest
  ): Promise<MessageResponse> {
    const message = await this.repository.sendMessage(senderId, request);

    // Получаем информацию о беседе для отправки уведомления
    const conversation = await this.repository.getConversationById(request.conversationId, senderId);
    const recipientId = conversation.id_user1 === senderId ? conversation.id_user2 : conversation.id_user1;

    // Отправляем сообщение через WebSocket
    await sendMessengerMessage(recipientId, {
      type: 'message',
      conversation_id: request.conversationId,
      message_id: message.id_message,
      sender_id: senderId,
      content: message.content,
      message_type: message.type,
      metadata: message.metadata,
      timestamp: message.created_at.toISOString(),
    });

    // Проверяем настройки уведомлений получателя
    const notificationsEnabled = conversation.id_user1 === senderId 
      ? conversation.user2_notifications_enabled 
      : conversation.user1_notifications_enabled;

    if (notificationsEnabled) {
      await this.sendMessageNotification(
        recipientId,
        conversation,
        message,
        senderId
      );
    }

    return message;
  }

  /**
   * Получает сообщения беседы
   */
  async getMessages(
    conversationId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<MessageListResponse> {
    return this.repository.getMessages(conversationId, userId, page, limit);
  }

  /**
   * Получает сообщение по ID
   */
  async getMessageById(messageId: string): Promise<MessageResponse> {
    return this.repository.getMessageById(messageId);
  }

  /**
   * Отмечает сообщения как прочитанные
   */
  async markMessagesAsRead(userId: string, request: MarkAsReadRequest): Promise<void> {
    await this.repository.markMessagesAsRead(userId, request);

    // Отправляем статус прочтения через WebSocket
    // Получаем информацию о беседе из первого сообщения
    if (request.messageIds.length > 0) {
      const firstMessage = await this.repository.getMessageById(request.messageIds[0]);
      const conversation = await this.repository.getConversationById(firstMessage.id_conversation, userId);
      const otherUserId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;

      await sendReadStatus(otherUserId, firstMessage.id_conversation, request.messageIds, userId);
    }
  }

  /**
   * Обновляет настройки беседы
   */
  async updateConversation(
    conversationId: string, 
    userId: string, 
    request: UpdateConversationRequest
  ): Promise<ConversationResponse> {
    return this.repository.updateConversation(conversationId, userId, request);
  }

  /**
   * Получает количество непрочитанных сообщений пользователя
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.getTotalUnreadMessageCount(userId);
  }

  /**
   * Отправляет уведомление о новом сообщении
   */
  private async sendMessageNotification(
    recipientId: string,
    conversation: ConversationResponse,
    message: MessageResponse,
    senderId: string
  ): Promise<void> {
    const senderName = conversation.id_user1 === senderId 
      ? conversation.user1?.username 
      : conversation.user2?.username;

    const messagePreview = message.content.length > 100 
      ? message.content.substring(0, 100) + '...' 
      : message.content;

    await this.sendConversationNotification(
      recipientId,
      'message_received',
      `Новое сообщение от ${senderName}`,
      messagePreview,
      {
        conversation_id: conversation.id_conversation,
        message_id: message.id_message,
        sender_id: senderId,
        sender_name: senderName,
        message_type: message.type,
        related_cargo_id: conversation.related_cargo_id,
        related_route_id: conversation.related_route_id,
      }
    );
  }

  /**
   * Отправляет уведомление о беседе
   */
  private async sendConversationNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata: any
  ): Promise<void> {
    try {
      await sendNotificationToUser(userId, {
        type,
        title,
        message,
        metadata: {
          ...metadata,
          link: `/messenger/${metadata.conversation_id}`,
        },
      });
    } catch (error) {
      console.error('Failed to send messenger notification:', error);
    }
  }

  /**
   * Получает статистику мессенджера для пользователя
   */
  async getMessengerStats(userId: string): Promise<{
    total_conversations: number;
    unread_messages: number;
    active_conversations: number;
  }> {
    const conversations = await this.repository.getConversations(userId, 1, 1000);
    const unreadCount = await this.repository.getTotalUnreadMessageCount(userId);
    
    const activeConversations = conversations.conversations.filter(
      conv => conv.status === 'Активен'
    ).length;

    return {
      total_conversations: conversations.total,
      unread_messages: unreadCount,
      active_conversations: activeConversations,
    };
  }


  /**
   * Включает/выключает уведомления для беседы
   */
  async toggleNotifications(
    conversationId: string, 
    userId: string, 
    enabled: boolean
  ): Promise<ConversationResponse> {
    const conversation = await this.repository.updateConversation(conversationId, userId, {
      notifications_enabled: enabled
    });

    // Отправляем обновление через WebSocket
    const otherUserId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;
    await sendConversationUpdate(otherUserId, conversationId, 'notifications_toggled', {
      notifications_enabled: enabled,
      changed_by: userId
    });

    return conversation;
  }

  /**
   * Отправляет статус "печатает"
   */
  async sendTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const conversation = await this.repository.getConversationById(conversationId, userId);
    const recipientId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;

    await sendTypingStatus(recipientId, conversationId, userId, isTyping);
  }

  /**
   * Архивирует беседу с уведомлением
   */
  async archiveConversation(conversationId: string, userId: string): Promise<ConversationResponse> {
    const conversation = await this.repository.updateConversation(conversationId, userId, {
      status: 'Архивирован'
    });

    // Отправляем обновление через WebSocket
    const otherUserId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;
    await sendConversationUpdate(otherUserId, conversationId, 'archived', {
      archived_by: userId
    });

    return conversation;
  }

  /**
   * Восстанавливает беседу из архива с уведомлением
   */
  async restoreConversation(conversationId: string, userId: string): Promise<ConversationResponse> {
    const conversation = await this.repository.updateConversation(conversationId, userId, {
      status: 'Активен'
    });

    // Отправляем обновление через WebSocket
    const otherUserId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;
    await sendConversationUpdate(otherUserId, conversationId, 'restored', {
      restored_by: userId
    });

    return conversation;
  }

  /**
   * Блокирует беседу с уведомлением
   */
  async blockConversation(conversationId: string, userId: string): Promise<ConversationResponse> {
    const conversation = await this.repository.updateConversation(conversationId, userId, {
      status: 'Заблокирован'
    });

    // Отправляем обновление через WebSocket
    const otherUserId = conversation.id_user1 === userId ? conversation.id_user2 : conversation.id_user1;
    await sendConversationUpdate(otherUserId, conversationId, 'blocked', {
      blocked_by: userId
    });

    return conversation;
  }
}
