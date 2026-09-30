import { clientAuth } from './api';
import { handleApiError } from '@/lib/toast';

// Type assertion для clientAuth чтобы избежать ошибок типизации
const api = clientAuth as any;

export interface CreateConversationRequest {
  userId: string;
  relatedCargoId?: number;
  relatedRouteId?: number;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: 'text' | 'file' | 'image' | 'system';
  metadata?: {
    filename?: string;
    file_size?: number;
    mime_type?: string;
    file_url?: string;
    thumbnail_url?: string;
  };
}

export interface MessageResponse {
  id_message: string;
  id_conversation: string;
  id_sender: string;
  type: 'text' | 'file' | 'image' | 'system';
  content: string;
  metadata?: any;
  is_read: boolean;
  read_at?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id_user: string;
    username: string;
    firstName?: string;
    lastName?: string;
    company?: {
      id_company: string;
      name_company: string;
    };
  };
}

export interface ConversationResponse {
  id_conversation: string;
  id_user1: string;
  id_user2: string;
  id_company1?: string;
  id_company2?: string;
  status: 'Активен' | 'Архивирован' | 'Заблокирован';
  last_message_id?: string;
  last_message_text?: string;
  last_message_at?: string;
  related_cargo_id?: number;
  related_route_id?: number;
  user1_notifications_enabled: boolean;
  user2_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
  user1?: {
    id_user: string;
    username: string;
    firstName?: string;
    lastName?: string;
    company?: {
      id_company: string;
      name_company: string;
    };
  };
  user2?: {
    id_user: string;
    username: string;
    firstName?: string;
    lastName?: string;
    company?: {
      id_company: string;
      name_company: string;
    };
  };
  unread_count?: number;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
  unread_total: number;
}

export interface MessageListResponse {
  messages: MessageResponse[];
  total: number;
  has_more: boolean;
}

export interface MarkAsReadRequest {
  messageIds: string[];
}

export interface UpdateConversationRequest {
  status?: 'Активен' | 'Архивирован' | 'Заблокирован';
  notifications_enabled?: boolean;
}

export interface MessengerStats {
  total_conversations: number;
  unread_messages: number;
  active_conversations: number;
}

class MessengerApi {
  /**
   * Создает новую беседу
   */
  async createConversation(data: CreateConversationRequest): Promise<ConversationResponse> {
    try {
      console.log('Creating conversation with data:', data);
      const res = await api['messenger']['conversations']['$post']({
        json: data
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: Ошибка создания беседы`);
      }
      
      const result = await res.json();
      console.log('Create conversation response:', result);
      return result.data || result;
    } catch (error) {
      console.error('Create conversation error:', error);
      handleApiError(error, 'Ошибка создания беседы');
      throw error;
    }
  }

  /**
   * Получает список бесед пользователя
   */
  async getConversations(page: number = 1, limit: number = 20): Promise<ConversationListResponse> {
    try {
      const res = await api['messenger']['conversations']['$get']({
        query: { page: page.toString(), limit: limit.toString() }
      });
      const result = await res.json();
      return result.data || result || { conversations: [], total: 0, unread_total: 0 };
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки бесед');
      throw error;
    }
  }

  /**
   * Получает беседу по ID
   */
  async getConversationById(conversationId: string): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['$get']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки беседы');
      throw error;
    }
  }

  /**
   * Обновляет настройки беседы
   */
  async updateConversation(conversationId: string, data: UpdateConversationRequest): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['$put']({
        json: data
      });
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка обновления беседы');
      throw error;
    }
  }

  /**
   * Отправляет сообщение
   */
  async sendMessage(data: SendMessageRequest): Promise<MessageResponse> {
    try {
      const res = await api['messenger']['messages']['$post']({
        json: data
      });
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка отправки сообщения');
      throw error;
    }
  }

  /**
   * Получает сообщения беседы
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<MessageListResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['messages']['$get']({
        query: { page: page.toString(), limit: limit.toString() }
      });
      const result = await res.json();
      return result.data || result || { messages: [], total: 0, has_more: false };
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки сообщений');
      throw error;
    }
  }

  /**
   * Получает сообщение по ID
   */
  async getMessageById(messageId: string): Promise<MessageResponse> {
    try {
      const res = await api['messenger']['messages'][messageId]['$get']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки сообщения');
      throw error;
    }
  }

  /**
   * Отмечает сообщения как прочитанные
   */
  async markMessagesAsRead(data: MarkAsReadRequest): Promise<void> {
    try {
      await api['messenger']['messages']['mark-read']['$post']({
        json: data
      });
    } catch (error) {
      handleApiError(error, 'Ошибка отметки сообщений как прочитанных');
      throw error;
    }
  }

  /**
   * Получает статистику мессенджера
   */
  async getMessengerStats(): Promise<MessengerStats> {
    try {
      const res = await api['messenger']['stats']['$get']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки статистики');
      throw error;
    }
  }

  /**
   * Архивирует беседу
   */
  async archiveConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['archive']['$post']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка архивации беседы');
      throw error;
    }
  }

  /**
   * Восстанавливает беседу из архива
   */
  async restoreConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['restore']['$post']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка восстановления беседы');
      throw error;
    }
  }

  /**
   * Блокирует беседу
   */
  async blockConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['block']['$post']();
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка блокировки беседы');
      throw error;
    }
  }

  /**
   * Включает/выключает уведомления для беседы
   */
  async toggleNotifications(conversationId: string, enabled: boolean): Promise<ConversationResponse> {
    try {
      const res = await api['messenger']['conversations'][conversationId]['toggle-notifications']['$post']({
        json: { enabled }
      });
      const result = await res.json();
      return result.data || result;
    } catch (error) {
      handleApiError(error, 'Ошибка изменения уведомлений');
      throw error;
    }
  }

  /**
   * Отправляет статус "печатает"
   */
  async sendTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      await api['messenger']['conversations'][conversationId]['typing']['$post']({
        json: { isTyping }
      });
    } catch (error) {
      // Не критичная ошибка, просто логируем
      console.error('Failed to send typing status:', error);
    }
  }
}

export const messengerApi = new MessengerApi();
