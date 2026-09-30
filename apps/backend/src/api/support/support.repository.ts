import db from '../../db/client';
import { support_tickets, users, company } from '../../db/schema/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import type { SupportTicket, SupportTicketWithUser, PaginatedTickets } from './support.types';

export class SupportRepository {
  // Создать новый тикет
  async createTicket(data: {
    id_user: string;
    id_company?: string;
    subject: string;
    message: string;
    priority?: number;
  }): Promise<SupportTicket> {
    const [ticket] = await db.insert(support_tickets).values({
      id_user: data.id_user,
      id_company: data.id_company,
      subject: data.subject,
      priority: data.priority || 1,
      messages: [{
        role: 'user',
        message: data.message,
        timestamp: new Date(),
      }],
    }).returning();

    return ticket as SupportTicket;
  }

  // Получить тикет по ID
  async getTicketById(id_ticket: string, id_user: string): Promise<SupportTicketWithUser | null> {
    const [ticket] = await db
      .select({
        id_ticket: support_tickets.id_ticket,
        id_user: support_tickets.id_user,
        id_company: support_tickets.id_company,
        subject: support_tickets.subject,
        status: support_tickets.status,
        priority: support_tickets.priority,
        bitrix24_ticket_id: support_tickets.bitrix24_ticket_id,
        messages: support_tickets.messages,
        created_at: support_tickets.created_at,
        updated_at: support_tickets.updated_at,
        closed_at: support_tickets.closed_at,
        closed_by: support_tickets.closed_by,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        company: {
          name_company: company.name_company,
          unp: company.unp,
        },
      })
      .from(support_tickets)
      .leftJoin(users, eq(support_tickets.id_user, users.id_user))
      .leftJoin(company, eq(support_tickets.id_company, company.id_company))
      .where(
        and(
          eq(support_tickets.id_ticket, id_ticket),
          eq(support_tickets.id_user, id_user)
        )
      );

    return ticket as any || null;
  }

  // Получить тикеты пользователя с пагинацией
  async getTicketsByUser(
    id_user: string,
    filters: {
      status?: string;
      page: number;
      limit: number;
    }
  ): Promise<PaginatedTickets> {
    console.log('🔍 [SUPPORT REPOSITORY] Getting tickets for user:', id_user, 'filters:', filters);
    
    const whereConditions = [eq(support_tickets.id_user, id_user)];
    
    if (filters.status) {
      whereConditions.push(eq(support_tickets.status, filters.status as any));
    }
    
    console.log('🔍 [SUPPORT REPOSITORY] Where conditions:', whereConditions);

    const [tickets, totalResult] = await Promise.all([
      db
        .select({
          id_ticket: support_tickets.id_ticket,
          id_user: support_tickets.id_user,
          id_company: support_tickets.id_company,
          subject: support_tickets.subject,
          status: support_tickets.status,
          priority: support_tickets.priority,
          bitrix24_ticket_id: support_tickets.bitrix24_ticket_id,
          messages: support_tickets.messages,
          created_at: support_tickets.created_at,
          updated_at: support_tickets.updated_at,
          closed_at: support_tickets.closed_at,
          closed_by: support_tickets.closed_by,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          company: {
            name_company: company.name_company,
            unp: company.unp,
          },
        })
        .from(support_tickets)
        .leftJoin(users, eq(support_tickets.id_user, users.id_user))
        .leftJoin(company, eq(support_tickets.id_company, company.id_company))
        .where(and(...whereConditions))
        .orderBy(desc(support_tickets.created_at))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      
      db
        .select({ count: count() })
        .from(support_tickets)
        .where(and(...whereConditions))
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      tickets: tickets as SupportTicketWithUser[],
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  }

  // Добавить сообщение в тикет
  async addMessage(
    id_ticket: string,
    id_user: string,
    message: string,
    role: 'user' | 'support' = 'user',
    author?: string
  ): Promise<boolean> {
    const ticket = await this.getTicketById(id_ticket, id_user);
    if (!ticket) return false;

    const updatedMessages = [
      ...ticket.messages,
      {
        role,
        message,
        timestamp: new Date(),
        author,
      }
    ];

    await db
      .update(support_tickets)
      .set({
        messages: updatedMessages,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(support_tickets.id_ticket, id_ticket),
          eq(support_tickets.id_user, id_user)
        )
      );

    return true;
  }

  // Обновить статус тикета
  async updateTicketStatus(
    id_ticket: string,
    id_user: string,
    status: 'Открыто' | 'Закрыто' | 'В обработке',
    closed_by?: string
  ): Promise<boolean> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'Закрыто') {
      updateData.closed_at = new Date();
      updateData.closed_by = closed_by;
    }

    const result = await db
      .update(support_tickets)
      .set(updateData)
      .where(
        and(
          eq(support_tickets.id_ticket, id_ticket),
          eq(support_tickets.id_user, id_user)
        )
      );

    return (result as any).rowCount > 0;
  }

  // Обновить Bitrix24 ID
  async updateBitrix24Id(id_ticket: string, bitrix24_ticket_id: string): Promise<boolean> {
    const result = await db
      .update(support_tickets)
      .set({ bitrix24_ticket_id })
      .where(eq(support_tickets.id_ticket, id_ticket));

    return (result as any).rowCount > 0;
  }
}
