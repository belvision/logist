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
  read_at?: Date;
  is_edited: boolean;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  created_at: Date;
  updated_at: Date;
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
  last_message_at?: Date;
  related_cargo_id?: number;
  related_route_id?: number;
  user1_notifications_enabled: boolean;
  user2_notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
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
