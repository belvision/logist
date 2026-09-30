import { clientAuth } from './api';

const api = clientAuth as any;

export interface OpenTicket {
  id: string;
  subject: string;
  status: string;
  status_new?: 'Новый ответ' | 'Просмотрен';
  priority: number;
  bitrix24TicketId: string;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    timestamp: string;
    author: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveTicket {
  id: string;
  subject: string;
  status: string;
  priority: number;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    timestamp: string;
    author?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CreateTicketRequest {
  firstName: string;
  lastName: string;
  companyId?: string;
  subject: string;
  message: string;
}

export interface CreateTicketResponse {
  success: boolean;
  ticket?: OpenTicket;
  contact?: unknown;
  company?: unknown;
  error?: string;
}

export interface AllTicketsResponse {
  success: boolean;
  tickets: Array<OpenTicket | ArchiveTicket>;
  error?: string;
}

export interface OpenTicketsResponse {
  tickets: OpenTicket[];
}

export const supportApi = {
  /**
   * Получить открытые тикеты
   */
  async getOpenTickets(): Promise<OpenTicketsResponse> {
    const res = await api['bitrix24']['support']['open'].$get();
    return await res.json();
  },

  /**
   * Получить все тикеты (открытые и закрытые)
   */
  async getAllTickets(): Promise<AllTicketsResponse> {
    const res = await api['bitrix24']['support']['all'].$get();
    return await res.json();
  },

  /**
   * Создать новый тикет
   */
  async createTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
    const res = await api['bitrix24']['support'].$post({ json: data });
    return await res.json();
  },

  /**
   * Отметить тикет как просмотренный
   */
  async markAsViewed(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const res = await api['bitrix24']['support']['mark-viewed'].$post({
      json: { ticketId }
    });
    return await res.json();
  },

  /**
   * Отправить комментарий в тикет
   */
  async addComment(ticketId: string, message: string): Promise<{
    success: boolean;
    updatedTicket?: OpenTicket;
    error?: string;
  }> {
    const res = await api['bitrix24']['support']['comment'].$post({
      json: { ticketId, message }
    });
    return await res.json();
  },

  /**
   * Закрыть тикет
   */
  async closeTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const res = await api['bitrix24']['support']['close'].$post({
      json: { ticketId }
    });
    return await res.json();
  },
};

