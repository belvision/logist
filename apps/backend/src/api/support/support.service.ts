import { SupportRepository } from './support.repository';
import { Bitrix24Service } from '../bitrix24/bitrix24.service';
import type { 
  CreateSupportTicketDto, 
  AddMessageDto, 
  UpdateTicketStatusDto, 
  GetTicketsDto 
} from './support.schema';
import type { 
  SupportTicket, 
  SupportTicketWithUser, 
  PaginatedTickets,
  Bitrix24Contact,
  Bitrix24Company,
  Bitrix24Ticket 
} from './support.types';

export class SupportService {
  private repository = new SupportRepository();
  private bitrix24Service = new Bitrix24Service();

  // Упрощенная логика: только создание контакта и компании в Bitrix24
  async testBitrix24Integration(
    userData: {
      firstName?: string;
      lastName?: string;
      email: string;
      phone?: string;
      role?: string;
    },
    companyData?: {
      name: string;
      unp: string;
      phone?: string;
      address?: string;
      company_type?: string;
      tip_company_name?: string;
    }
  ): Promise<{ contact: any; company: any }> {
    
    let contact = null;
    let company = null;

    try {
      // 1. Найти/создать контакт в Bitrix24
      contact = await this.bitrix24Service.findContactByPhone(userData.phone || '');
      if (!contact) {
        contact = await this.bitrix24Service.createContact(userData);
      }

      // 2. Найти/создать компанию в Bitrix24 (если есть данные компании)
      if (companyData) {
        company = await this.bitrix24Service.findCompanyByUnp(companyData.unp);
        if (!company) {
          company = await this.bitrix24Service.createCompany(companyData);
        }
      }

      return { contact, company };
    } catch (error) {
      console.error('❌ [SUPPORT SERVICE] Error in Bitrix24 integration:', error);
      return { contact, company };
    }
  }

  // Получить тикет по ID
  async getTicketById(id_ticket: string, id_user: string): Promise<SupportTicketWithUser | null> {
    return await this.repository.getTicketById(id_ticket, id_user);
  }

  // Получить тикеты пользователя
  async getTicketsByUser(id_user: string, filters: GetTicketsDto): Promise<PaginatedTickets> {
    try {
      const result = await this.repository.getTicketsByUser(id_user, filters as any);
      return result;
    } catch (error) {
      console.error('❌ [SUPPORT SERVICE] Error getting tickets:', error);
      throw error;
    }
  }

  // Добавить сообщение в тикет
  async addMessage(
    id_ticket: string,
    id_user: string,
    data: AddMessageDto
  ): Promise<boolean> {
    
    const success = await this.repository.addMessage(
      id_ticket,
      id_user,
      data.message,
      'user'
    );

    if (success) {
      try {
        // Получить тикет для получения bitrix24_ticket_id
        const ticket = await this.repository.getTicketById(id_ticket, id_user);
        if (ticket?.bitrix24_ticket_id) {
          // Отправить комментарий в Bitrix24
          await (this.bitrix24Service as any).addComment(ticket.bitrix24_ticket_id, data.message);
          
          // Обновить стадию на "В обработке"
          await (this.bitrix24Service as any).updateStage(ticket.bitrix24_ticket_id, '383');
        }
      } catch (error) {
        console.error('Error sending message to Bitrix24:', error);
        // Не прерываем добавление сообщения, если Bitrix24 недоступен
      }
    }

    return success;
  }

  // Обновить статус тикета
  async updateTicketStatus(
    id_ticket: string,
    id_user: string,
    data: UpdateTicketStatusDto
  ): Promise<boolean> {
    return await this.repository.updateTicketStatus(
      id_ticket,
      id_user,
      data.status
    );
  }

  // Bitrix24 интеграция - найти/создать контакт
  async findOrCreateBitrix24Contact(userData: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  }): Promise<Bitrix24Contact | null> {
    // TODO: Реализовать поиск/создание контакта в Bitrix24
    return null;
  }

  // Bitrix24 интеграция - найти/создать компанию
  async findOrCreateBitrix24Company(companyData: {
    name: string;
    unp: string;
    phone?: string;
    address?: string;
    company_type?: string;
  }): Promise<Bitrix24Company | null> {
    // TODO: Реализовать поиск/создание компании в Bitrix24
    return null;
  }

  // Bitrix24 интеграция - создать тикет
  async createBitrix24Ticket(ticketData: {
    title: string;
    comment: string;
    contactId: string;
    companyId?: string;
  }): Promise<Bitrix24Ticket | null> {
    // TODO: Реализовать создание тикета в Bitrix24
    return null;
  }

  // Bitrix24 интеграция - отправить комментарий
  async sendBitrix24Comment(ticketId: string, message: string): Promise<boolean> {
    // TODO: Реализовать отправку комментария в Bitrix24
    return false;
  }

  // Bitrix24 интеграция - обновить стадию
  async updateBitrix24Stage(ticketId: string, stageId: string): Promise<boolean> {
    // TODO: Реализовать обновление стадии в Bitrix24
    return false;
  }
}
