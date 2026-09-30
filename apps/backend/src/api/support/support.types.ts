export interface SupportTicket {
  id_ticket: string;
  id_user: string;
  id_company?: string;
  subject: string;
  status: 'Открыто' | 'Закрыто' | 'В обработке';
  priority: number;
  bitrix24_ticket_id?: string;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    timestamp: Date;
    author?: string;
  }>;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  closed_by?: string;
}

export interface SupportTicketWithUser extends SupportTicket {
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  company?: {
    name_company: string;
    unp: string;
  };
}

export interface PaginatedTickets {
  tickets: SupportTicketWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Bitrix24Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Bitrix24Company {
  id: string;
  title: string;
  unp: string;
  phone: string;
  address: string;
  company_type: string;
}

export interface Bitrix24Ticket {
  id: string;
  title: string;
  stage_id: string;
  comments: Array<{
    id: string;
    text: string;
    created: Date;
    author: string;
  }>;
}
