import db from '../../db/client';
import { conversations, messages, message_read_status, users, company, users_company } from '../../db/schema/schema';
import { eq, and, or, desc, asc, sql, count, ne, isNull } from 'drizzle-orm';
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

export class MessengerRepository {
  
  /**
   * Создает новую беседу между двумя пользователями
   */
  async createConversation(
    currentUserId: string, 
    request: CreateConversationRequest
  ): Promise<ConversationResponse> {
    const { userId: otherUserId, relatedCargoId, relatedRouteId } = request;
    
    // Проверяем, существует ли уже беседа между этими пользователями
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.id_user1, currentUserId), eq(conversations.id_user2, otherUserId)),
          and(eq(conversations.id_user1, otherUserId), eq(conversations.id_user2, currentUserId))
        )
      )
      .limit(1);

    if (existingConversation.length > 0) {
      return this.getConversationById(existingConversation[0].id_conversation, currentUserId);
    }

    // Получаем информацию о компаниях пользователей
    const [user1Company, user2Company] = await Promise.all([
      this.getUserCompany(currentUserId),
      this.getUserCompany(otherUserId)
    ]);

    // Создаем новую беседу
    const [newConversation] = await db
      .insert(conversations)
      .values({
        id_user1: currentUserId,
        id_user2: otherUserId,
        id_company1: user1Company?.id_company,
        id_company2: user2Company?.id_company,
        related_cargo_id: relatedCargoId,
        related_route_id: relatedRouteId,
      })
      .returning();

    return this.getConversationById(newConversation.id_conversation, currentUserId);
  }

  /**
   * Получает беседу по ID с полной информацией
   */
  async getConversationById(conversationId: string, currentUserId: string): Promise<ConversationResponse> {
    const [conversation] = await db
      .select({
        id_conversation: conversations.id_conversation,
        id_user1: conversations.id_user1,
        id_user2: conversations.id_user2,
        id_company1: conversations.id_company1,
        id_company2: conversations.id_company2,
        status: conversations.status,
        last_message_id: conversations.last_message_id,
        last_message_text: conversations.last_message_text,
        last_message_at: conversations.last_message_at,
        related_cargo_id: conversations.related_cargo_id,
        related_route_id: conversations.related_route_id,
        user1_notifications_enabled: conversations.user1_notifications_enabled,
        user2_notifications_enabled: conversations.user2_notifications_enabled,
        created_at: conversations.created_at,
        updated_at: conversations.updated_at,
        user1: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        user1_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
        user2: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        user2_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.id_user1, users.id_user))
      .leftJoin(company, eq(conversations.id_company1, company.id_company))
      .leftJoin(users, eq(conversations.id_user2, users.id_user))
      .leftJoin(company, eq(conversations.id_company2, company.id_company))
      .where(eq(conversations.id_conversation, conversationId))
      .limit(1);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Проверяем, что пользователь является участником беседы
    if (conversation.id_user1 !== currentUserId && conversation.id_user2 !== currentUserId) {
      throw new Error('Access denied');
    }

    // Получаем количество непрочитанных сообщений
    const unreadCount = await this.getUnreadMessageCount(conversationId, currentUserId);

    return {
      ...conversation,
      user1: {
        ...conversation.user1,
        company: conversation.user1_company,
      },
      user2: {
        ...conversation.user2,
        company: conversation.user2_company,
      },
      unread_count: unreadCount,
    } as ConversationResponse;
  }

  /**
   * Получает список бесед пользователя
   */
  async getConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ConversationListResponse> {
    const offset = (page - 1) * limit;

    const userConversations = await db
      .select({
        id_conversation: conversations.id_conversation,
        id_user1: conversations.id_user1,
        id_user2: conversations.id_user2,
        id_company1: conversations.id_company1,
        id_company2: conversations.id_company2,
        status: conversations.status,
        last_message_id: conversations.last_message_id,
        last_message_text: conversations.last_message_text,
        last_message_at: conversations.last_message_at,
        related_cargo_id: conversations.related_cargo_id,
        related_route_id: conversations.related_route_id,
        user1_notifications_enabled: conversations.user1_notifications_enabled,
        user2_notifications_enabled: conversations.user2_notifications_enabled,
        created_at: conversations.created_at,
        updated_at: conversations.updated_at,
        user1: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        user1_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
        user2: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        user2_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.id_user1, users.id_user))
      .leftJoin(company, eq(conversations.id_company1, company.id_company))
      .leftJoin(users, eq(conversations.id_user2, users.id_user))
      .leftJoin(company, eq(conversations.id_company2, company.id_company))
      .where(
        or(
          eq(conversations.id_user1, userId),
          eq(conversations.id_user2, userId)
        )
      )
      .orderBy(desc(conversations.last_message_at), desc(conversations.created_at))
      .limit(limit)
      .offset(offset);

    // Получаем общее количество бесед
    const [totalResult] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        or(
          eq(conversations.id_user1, userId),
          eq(conversations.id_user2, userId)
        )
      );

    // Получаем количество непрочитанных сообщений для каждой беседы
    const conversationsWithUnread = await Promise.all(
      userConversations.map(async (conv: any) => {
        const unreadCount = await this.getUnreadMessageCount(conv.id_conversation, userId);
        return {
          ...conv,
          user1: {
            ...conv.user1,
            company: conv.user1_company,
          },
          user2: {
            ...conv.user2,
            company: conv.user2_company,
          },
          unread_count: unreadCount,
        } as ConversationResponse;
      })
    );

    // Получаем общее количество непрочитанных сообщений
    const unreadTotal = await this.getTotalUnreadMessageCount(userId);

    return {
      conversations: conversationsWithUnread,
      total: totalResult.count,
      unread_total: unreadTotal,
    };
  }

  /**
   * Отправляет сообщение в беседу
   */
  async sendMessage(
    senderId: string, 
    request: SendMessageRequest
  ): Promise<MessageResponse> {
    const { conversationId, content, type = 'text', metadata } = request;

    // Проверяем, что пользователь является участником беседы
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id_conversation, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    const conv = conversation[0];
    if (conv.id_user1 !== senderId && conv.id_user2 !== senderId) {
      throw new Error('Access denied');
    }

    // Создаем сообщение
    const [newMessage] = await db
      .insert(messages)
      .values({
        id_conversation: conversationId,
        id_sender: senderId,
        type,
        content,
        metadata: metadata || {},
      })
      .returning();

    // Обновляем информацию о последнем сообщении в беседе
    await db
      .update(conversations)
      .set({
        last_message_id: newMessage.id_message,
        last_message_text: content,
        last_message_at: newMessage.created_at,
        updated_at: new Date(),
      })
      .where(eq(conversations.id_conversation, conversationId));

    return this.getMessageById(newMessage.id_message);
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
    const offset = (page - 1) * limit;

    // Проверяем доступ к беседе
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id_conversation, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    const conv = conversation[0];
    if (conv.id_user1 !== userId && conv.id_user2 !== userId) {
      throw new Error('Access denied');
    }

    const messageList = await db
      .select({
        id_message: messages.id_message,
        id_conversation: messages.id_conversation,
        id_sender: messages.id_sender,
        type: messages.type,
        content: messages.content,
        metadata: messages.metadata,
        is_read: messages.is_read,
        read_at: messages.read_at,
        is_edited: messages.is_edited,
        edited_at: messages.edited_at,
        is_deleted: messages.is_deleted,
        deleted_at: messages.deleted_at,
        deleted_by: messages.deleted_by,
        created_at: messages.created_at,
        updated_at: messages.updated_at,
        sender: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        sender_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.id_sender, users.id_user))
      .leftJoin(users_company, eq(users.id_user, users_company.id_user))
      .leftJoin(company, eq(users_company.id_company, company.id_company))
      .where(
        and(
          eq(messages.id_conversation, conversationId),
          eq(messages.is_deleted, false)
        )
      )
      .orderBy(desc(messages.created_at))
      .limit(limit)
      .offset(offset);

    // Получаем общее количество сообщений
    const [totalResult] = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.id_conversation, conversationId),
          eq(messages.is_deleted, false)
        )
      );

    const messagesWithSender = messageList.map((msg: any) => ({
      ...msg,
      sender: {
        ...msg.sender,
        company: msg.sender_company,
      },
    })) as MessageResponse[];

    return {
      messages: messagesWithSender,
      total: totalResult.count,
      has_more: offset + limit < totalResult.count,
    };
  }

  /**
   * Получает сообщение по ID
   */
  async getMessageById(messageId: string): Promise<MessageResponse> {
    const [message] = await db
      .select({
        id_message: messages.id_message,
        id_conversation: messages.id_conversation,
        id_sender: messages.id_sender,
        type: messages.type,
        content: messages.content,
        metadata: messages.metadata,
        is_read: messages.is_read,
        read_at: messages.read_at,
        is_edited: messages.is_edited,
        edited_at: messages.edited_at,
        is_deleted: messages.is_deleted,
        deleted_at: messages.deleted_at,
        deleted_by: messages.deleted_by,
        created_at: messages.created_at,
        updated_at: messages.updated_at,
        sender: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        sender_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.id_sender, users.id_user))
      .leftJoin(users_company, eq(users.id_user, users_company.id_user))
      .leftJoin(company, eq(users_company.id_company, company.id_company))
      .where(eq(messages.id_message, messageId))
      .limit(1);

    if (!message) {
      throw new Error('Message not found');
    }

    return {
      ...message,
      sender: {
        ...message.sender,
        company: message.sender_company,
      },
    } as MessageResponse;
  }

  /**
   * Отмечает сообщения как прочитанные
   */
  async markMessagesAsRead(
    userId: string, 
    request: MarkAsReadRequest
  ): Promise<void> {
    const { messageIds } = request;

    // Проверяем, что пользователь имеет доступ к этим сообщениям
    const userMessages = await db
      .select({ id_message: messages.id_message })
      .from(messages)
      .innerJoin(conversations, eq(messages.id_conversation, conversations.id_conversation))
      .where(
        and(
          sql`${messages.id_message} = ANY(${messageIds})`,
          or(
            eq(conversations.id_user1, userId),
            eq(conversations.id_user2, userId)
          )
        )
      );

    const accessibleMessageIds = userMessages.map((msg: any) => msg.id_message);

    if (accessibleMessageIds.length === 0) {
      return;
    }

    // Отмечаем сообщения как прочитанные
    await db
      .update(messages)
      .set({
        is_read: true,
        read_at: new Date(),
      })
      .where(sql`${messages.id_message} = ANY(${accessibleMessageIds})`);

    // Добавляем записи в таблицу статуса прочтения
    const readStatusRecords = accessibleMessageIds.map((messageId: any) => ({
      id_message: messageId,
      id_user: userId,
    }));

    await db
      .insert(message_read_status)
      .values(readStatusRecords)
      .onConflictDoNothing();
  }

  /**
   * Обновляет настройки беседы
   */
  async updateConversation(
    conversationId: string, 
    userId: string, 
    request: UpdateConversationRequest
  ): Promise<ConversationResponse> {
    const { status, notifications_enabled } = request;

    // Проверяем доступ к беседе
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id_conversation, conversationId))
      .limit(1);

    if (!conversation.length) {
      throw new Error('Conversation not found');
    }

    const conv = conversation[0];
    if (conv.id_user1 !== userId && conv.id_user2 !== userId) {
      throw new Error('Access denied');
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (notifications_enabled !== undefined) {
      if (conv.id_user1 === userId) {
        updateData.user1_notifications_enabled = notifications_enabled;
      } else {
        updateData.user2_notifications_enabled = notifications_enabled;
      }
    }

    await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id_conversation, conversationId));

    return this.getConversationById(conversationId, userId);
  }

  /**
   * Получает количество непрочитанных сообщений в беседе
   */
  async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.id_conversation, conversationId),
          ne(messages.id_sender, userId),
          eq(messages.is_read, false),
          eq(messages.is_deleted, false)
        )
      );

    return result.count;
  }

  /**
   * Получает общее количество непрочитанных сообщений пользователя
   */
  async getTotalUnreadMessageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.id_conversation, conversations.id_conversation))
      .where(
        and(
          or(
            eq(conversations.id_user1, userId),
            eq(conversations.id_user2, userId)
          ),
          ne(messages.id_sender, userId),
          eq(messages.is_read, false),
          eq(messages.is_deleted, false)
        )
      );

    return result.count;
  }

  /**
   * Получает информацию о компании пользователя
   */
  private async getUserCompany(userId: string) {
    const [userCompany] = await db
      .select({
        id_company: company.id_company,
        name_company: company.name_company,
      })
      .from(users_company)
      .innerJoin(company, eq(users_company.id_company, company.id_company))
      .where(eq(users_company.id_user, userId))
      .limit(1);

    return userCompany;
  }
}
