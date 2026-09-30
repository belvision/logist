import db from '../../db/client';
import { support_tickets } from '../../db/schema/schema';
import { eq, and } from 'drizzle-orm';
import { SmartProcessComment, SupportNewStatus } from './webhook.types';
import { sendNotificationToUser } from '../../ws/notifications';
import { notifyUser } from '../notifications/notifications.service';

// Поиск тикета по ID смарт-процесса Bitrix24
export async function findTicketByBitrixId(bitrix24TicketId: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.bitrix24_ticket_id, bitrix24TicketId))
      .limit(1);
    
    if (result.length > 0) {
      return result[0];
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('❌ [WEBHOOK REPOSITORY] Error searching for ticket:', error);
    return null;
  }
}

// Добавление комментария от поддержки к тикету
export async function addSupportCommentToTicket(
  ticketId: string, 
  comment: SmartProcessComment
) {
  try {
    
    // Получаем текущие сообщения
    const currentTicket = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.id_ticket, ticketId))
      .limit(1);
    
    if (currentTicket.length === 0) {
      console.error('❌ [WEBHOOK REPOSITORY] Ticket not found:', ticketId);
      return { success: false, error: 'Ticket not found' };
    }
    
    const currentMessages = currentTicket[0].messages || [];
    const newMessage = {
      role: 'support' as const,
      message: comment.message,
      timestamp: comment.timestamp,
      author: comment.author
    };
    
    const updatedMessages = [...currentMessages, newMessage];
    
    // Обновляем тикет с новым сообщением и статусом "Новый ответ" в колонке status_new
    const result = await db.update(support_tickets)
      .set({
        messages: updatedMessages,
        status_new: 'Новый ответ',
        updated_at: new Date()
      })
      .where(eq(support_tickets.id_ticket, ticketId))
      .returning({ 
        id_ticket: support_tickets.id_ticket,
        status: support_tickets.status,
        status_new: support_tickets.status_new
      });
    
    // Создаем уведомление в базе данных
    try {
      await notifyUser(
        currentTicket[0].id_user,
        'support_reply',
        'Новый ответ от поддержки',
        `Получен новый ответ по тикету: ${currentTicket[0].subject}`,
        {
          ticket_id: ticketId,
          support_message: comment.message,
          author: comment.author
        },
        'medium'
      );
    } catch (error) {
      console.error('❌ [WEBHOOK REPOSITORY] Failed to create database notification:', error);
    }

    // Отправляем WebSocket уведомление пользователю
    try {
      await sendNotificationToUser(currentTicket[0].id_user, {
        type: 'support_message',
        title: 'Новый ответ от поддержки',
        message: `Получен новый ответ по тикету: ${currentTicket[0].subject}`,
        metadata: {
          ticket_id: ticketId,
          support_message: comment.message,
          author: comment.author
        }
      });
    } catch (error) {
      console.error('❌ [WEBHOOK REPOSITORY] Failed to send WebSocket notification:', error);
    }
    
    return { 
      success: true, 
      ticketId: result[0].id_ticket,
      status: result[0].status,
      status_new: result[0].status_new
    };
  } catch (error: any) {
    console.error('❌ [WEBHOOK REPOSITORY] Error adding support comment:', error);
    return { success: false, error: error.message };
  }
}

// Получение тикета по ID для вебхуков
export async function getTicketForWebhook(ticketId: string) {
  try {
    
    const result = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.id_ticket, ticketId))
      .limit(1);
    
    if (result.length > 0) {
      return {
        success: true,
        ticket: {
          id: result[0].id_ticket,
          subject: result[0].subject,
          status: result[0].status,
          status_new: result[0].status_new,
          messages: result[0].messages,
          bitrix24TicketId: result[0].bitrix24_ticket_id,
          createdAt: result[0].created_at,
          updatedAt: result[0].updated_at
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден' };
    }
  } catch (error: any) {
    console.error('❌ [WEBHOOK REPOSITORY] Error getting ticket for webhook:', error);
    return { success: false, error: error.message };
  }
}

// Обновление статуса тикета после обработки вебхука
export async function updateTicketStatusAfterWebhook(ticketId: string, status: string) {
  try {
    
    const result = await db.update(support_tickets)
      .set({
        status: status as any,
        updated_at: new Date()
      })
      .where(eq(support_tickets.id_ticket, ticketId))
      .returning({ 
        id_ticket: support_tickets.id_ticket,
        status: support_tickets.status,
        status_new: support_tickets.status_new
      });
    
    if (result.length > 0) {
      return {
        success: true,
        ticket: {
          id: result[0].id_ticket,
          status: result[0].status,
          status_new: result[0].status_new
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден' };
    }
  } catch (error: any) {
    console.error('❌ [WEBHOOK REPOSITORY] Error updating ticket status:', error);
    return { success: false, error: error.message };
  }
}

// Отметить новый ответ как просмотренный
export async function markNewResponseAsViewed(ticketId: string, userId: string) {
  try {
    
    const result = await db.update(support_tickets)
      .set({
        status_new: 'Просмотрен',
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
          id: result[0].id_ticket,
          status: result[0].status,
          status_new: result[0].status_new
        }
      };
    } else {
      return { success: false, error: 'Тикет не найден' };
    }
  } catch (error: any) {
    console.error('❌ [WEBHOOK REPOSITORY] Error marking new response as viewed:', error);
    return { success: false, error: error.message };
  }
}
