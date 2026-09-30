import db from '../../db/client';
import { support_tickets } from '../../db/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function createSupportTicket() {
  // TODO: Реализовать создание тикета в Bitrix24
  return { success: true, ticketId: 'temp-id' };
}

export async function createSupportTicketInDB(data: {
  id_user: string;
  id_company?: string;
  subject: string;
  message: string;
  bitrix24_contact_id?: string;
  bitrix24_company_id?: string;
  bitrix24_smart_process_id?: string;
}) {
  try {

    const insertData = {
      id_user: data.id_user,
      id_company: data.id_company,
      subject: data.subject,
      status: 'Открыто' as const,
      priority: 1,
      bitrix24_ticket_id: data.bitrix24_smart_process_id, // ID смарт-процесса = support_tickets.bitrix24_ticket_id
      messages: [{
        role: 'user' as const,
        message: data.message,
        timestamp: new Date(),
        author: 'Пользователь'
      }]
    };

    const result = await db.insert(support_tickets).values(insertData).returning({ 
      id_ticket: support_tickets.id_ticket 
    });

    const response = { 
      success: true, 
      ticketId: result[0]?.id_ticket,
      bitrix24Data: {
        contact_id: data.bitrix24_contact_id,
        company_id: data.bitrix24_company_id,
        smart_process_id: data.bitrix24_smart_process_id
      }
    };

    return response;
  } catch (error: any) {
    console.error('❌ [DB] PostgreSQL error details:');
    console.error('❌ [DB] Error name:', error.name);
    console.error('❌ [DB] Error message:', error.message);
    console.error('❌ [DB] Error code:', error.code);
    console.error('❌ [DB] Error detail:', error.detail);
    console.error('❌ [DB] Error hint:', error.hint);
    console.error('❌ [DB] Error position:', error.position);
    console.error('❌ [DB] Error where:', error.where);
    console.error('❌ [DB] Error schema:', error.schema);
    console.error('❌ [DB] Error table:', error.table);
    console.error('❌ [DB] Error column:', error.column);
    console.error('❌ [DB] Error dataType:', error.dataType);
    console.error('❌ [DB] Error constraint:', error.constraint);
    console.error('❌ [DB] Error file:', error.file);
    console.error('❌ [DB] Error line:', error.line);
    console.error('❌ [DB] Error routine:', error.routine);
    console.error('❌ [DB] Full error object:', error);
    
    return { success: false, error: error.message };
  }
}

// Поиск существующего тикета по пользователю и теме
export async function findExistingTicket(userId: string, subject: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(
        and(
          eq(support_tickets.id_user, userId),
          eq(support_tickets.subject, subject),
          eq(support_tickets.status, 'Открыто')
        )
      )
      .limit(1);
    
    if (result.length > 0) {
      return result[0];
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('❌ [DB] Error searching for existing ticket:', error);
    return null;
  }
}

// Добавление комментария к существующему тикету
export async function addCommentToTicket(ticketId: string, message: string, author: string = 'Пользователь') {
  try {
    
    // Сначала получаем текущие сообщения
    const currentTicket = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.id_ticket, ticketId))
      .limit(1);
    
    if (currentTicket.length === 0) {
      console.error('❌ [DB] Ticket not found:', ticketId);
      return { success: false, error: 'Ticket not found' };
    }
    
    const currentMessages = currentTicket[0]?.messages || [];
    const newMessage = {
      role: 'user' as const,
      message: message,
      timestamp: new Date(),
      author: author
    };
    
    const updatedMessages = [...currentMessages, newMessage];
    
    // Обновляем тикет с новым сообщением
    const result = await db.update(support_tickets)
      .set({
        messages: updatedMessages,
        updated_at: new Date()
      })
      .where(eq(support_tickets.id_ticket, ticketId))
      .returning({ id_ticket: support_tickets.id_ticket });
    
    return { 
      success: true, 
      ticketId: result[0]?.id_ticket,
      bitrix24TicketId: currentTicket[0]?.bitrix24_ticket_id
    };
  } catch (error: any) {
    console.error('❌ [DB] Error adding comment to ticket:', error);
    return { success: false, error: error.message };
  }
}

// Получение конкретного тикета по ID
export async function getTicketById(ticketId: string, userId: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(
        and(
          eq(support_tickets.id_ticket, ticketId),
          eq(support_tickets.id_user, userId)
        )
      )
      .limit(1);
    
    if (result.length > 0) {
      const ticket = result[0];
      return {
        success: true,
        ticket: {
          id: ticket?.id_ticket,
          subject: ticket?.subject,
          status: ticket?.status,
          status_new: ticket?.status_new,
          priority: ticket?.priority,
          bitrix24TicketId: ticket?.bitrix24_ticket_id,
          messages: ticket?.messages,
          createdAt: ticket?.created_at,
          updatedAt: ticket?.updated_at
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден' };
    }
  } catch (error: any) {
    console.error('❌ [DB] Error getting ticket by ID:', error);
    return { success: false, error: error.message };
  }
}

export async function closeTicket(ticketId: string, userId: string) {
  try {
    
    const result = await db.update(support_tickets)
      .set({
        status: 'Закрыто',
        closed_at: new Date(),
        closed_by: userId,
        updated_at: new Date()
      })
      .where(
        and(
          eq(support_tickets.id_ticket, ticketId),
          eq(support_tickets.id_user, userId)
        )
      )
      .returning({ 
        id_ticket: support_tickets.id_ticket,
        status: support_tickets.status,
        closed_at: support_tickets.closed_at,
        bitrix24_ticket_id: support_tickets.bitrix24_ticket_id
      });
    
    if (result.length > 0) {
      return {
        success: true,
        ticket: {
          id: result[0]?.id_ticket,
          status: result[0]?.status,
          closedAt: result[0]?.closed_at,
          bitrix24TicketId: result[0]?.bitrix24_ticket_id
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден или уже закрыт' };
    }
  } catch (error: any) {
    console.error('❌ [DB] Error closing ticket:', error);
    return { success: false, error: error.message };
  }
}

// Получение всех тикетов пользователя
export async function getAllTickets(userId: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.id_user, userId))
      .orderBy(support_tickets.created_at);
    
    return {
      success: true,
      tickets: result.map(ticket => ({
        id: ticket.id_ticket,
        subject: ticket.subject,
        status: ticket.status,
        status_new: ticket.status_new,
        priority: ticket.priority,
        bitrix24TicketId: ticket.bitrix24_ticket_id,
        messages: ticket.messages,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at
      }))
    };
  } catch (error: any) {
    console.error('❌ [DB] Error getting all tickets:', error);
    return { success: false, error: error.message };
  }
}

// Получение открытых тикетов пользователя
export async function getOpenTickets(userId: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(
        and(
          eq(support_tickets.id_user, userId),
          eq(support_tickets.status, 'Открыто')
        )
      )
      .orderBy(support_tickets.created_at);
    
    return {
      success: true,
      tickets: result.map(ticket => ({
        id: ticket.id_ticket,
        subject: ticket.subject,
        status: ticket.status,
        status_new: ticket.status_new,
        priority: ticket.priority,
        bitrix24TicketId: ticket.bitrix24_ticket_id,
        messages: ticket.messages,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at
      }))
    };
  } catch (error: any) {
    console.error('❌ [DB] Error getting open tickets:', error);
    return { success: false, error: error.message };
  }
}

// Отметить тикет как просмотренный
export async function markTicketAsViewed(ticketId: string, userId: string) {
  try {
    
    const result = await db.update(support_tickets)
      .set({
        status_new: 'Просмотрен', // Меняем status_new с "Новый ответ" на "Просмотрен"
        updated_at: new Date()
      })
      .where(
        and(
          eq(support_tickets.id_ticket, ticketId),
          eq(support_tickets.id_user, userId)
        )
      )
      .returning({ 
        id_ticket: support_tickets.id_ticket,
        status: support_tickets.status,
        status_new: support_tickets.status_new
      });
    
    if (result.length > 0) {
      return {
        success: true,
        ticket: {
          id: result[0]?.id_ticket,
          status: result[0]?.status,
          status_new: result[0]?.status_new
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден' };
    }
  } catch (error: any) {
    console.error('❌ [DB] Error marking ticket as viewed:', error);
    return { success: false, error: error.message };
  }
}