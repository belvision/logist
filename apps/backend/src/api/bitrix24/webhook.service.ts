import { WebhookDto } from './webhook.schema';
import { Bitrix24Service } from './bitrix24.service';
import { WebhookProcessingResult, SmartProcessComment, Bitrix24TimelineComment, Bitrix24ItemData } from './webhook.types';
import { findTicketByBitrixId, addSupportCommentToTicket } from './webhook.repository';

export async function processWebhookFromBitrix24(dto: WebhookDto): Promise<WebhookProcessingResult> {
  try {
    console.log('🔍 [WEBHOOK SERVICE] ===== PROCESSING WEBHOOK =====');
    console.log('🔍 [WEBHOOK SERVICE] Webhook data:', dto);
    
    // Извлекаем ID смарт-процесса из вебхука
    let smartProcessId: string | null = null;
    
    if (dto.data?.FIELDS?.ID) {
      smartProcessId = dto.data.FIELDS.ID;
    } else if (dto.data?.ITEM?.ID) {
      smartProcessId = dto.data.ITEM.ID;
    }
    
    if (!smartProcessId) {
      console.log('❌ [WEBHOOK SERVICE] No smart process ID found in webhook');
      return { success: false, error: 'ID смарт-процесса не найден в вебхуке' };
    }
    
    console.log('🔍 [WEBHOOK SERVICE] Smart process ID:', smartProcessId);
    
    // Ищем тикет в БД по bitrix24_ticket_id
    const ticketData = await findTicketByBitrixId(smartProcessId);
    
    if (!ticketData) {
      console.log('❌ [WEBHOOK SERVICE] Ticket not found for smart process ID:', smartProcessId);
      return { success: false, error: 'Тикет не найден для данного смарт-процесса' };
    }
    
    console.log('🔍 [WEBHOOK SERVICE] Found ticket:', ticketData.id_ticket);
    
    // Получаем последний комментарий из смарт-процесса
    const bitrix24Service = new Bitrix24Service();
    const lastComment = await getLastCommentFromSmartProcess(bitrix24Service, smartProcessId);
    
    if (!lastComment) {
      console.log('❌ [WEBHOOK SERVICE] No comment found in smart process');
      return { success: false, error: 'Комментарий не найден в смарт-процессе' };
    }
    
    console.log('🔍 [WEBHOOK SERVICE] Last comment:', lastComment);
    
    // Добавляем комментарий в БД через репозиторий
    const addCommentResult = await addSupportCommentToTicket(ticketData.id_ticket, {
      message: lastComment.message,
      author: lastComment.author || 'Поддержка',
      timestamp: lastComment.timestamp
    });
    
    if (!addCommentResult.success) {
      console.log('❌ [WEBHOOK SERVICE] Failed to add comment to ticket');
      return { success: false, error: addCommentResult.error };
    }
    
    console.log('✅ [WEBHOOK SERVICE] Ticket updated successfully');
    return {
      success: true,
      ticketId: ticketData.id_ticket,
      messageAdded: true
    };
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK SERVICE] Error processing webhook:', error);
    return { success: false, error: error.message };
  }
}

async function getLastCommentFromSmartProcess(bitrix24Service: Bitrix24Service, smartProcessId: string): Promise<SmartProcessComment | null> {
  try {
    console.log('🔍 [WEBHOOK SERVICE] Getting last comment from smart process:', smartProcessId);
    
    // Получаем комментарии из таймлайна смарт-процесса
    const timelineResult = await bitrix24Service['makeRequest']('crm.timeline.comment.list', {
      filter: {
        ENTITY_TYPE: 'DYNAMIC_1038',
        ENTITY_ID: smartProcessId
      },
      order: { ID: 'DESC' },
      select: ['ID', 'COMMENT', 'CREATED', 'AUTHOR_ID']
    });
    
    console.log('🔍 [WEBHOOK SERVICE] Timeline result:', timelineResult);
    
    if (timelineResult.result && timelineResult.result.length > 0) {
      const lastComment = timelineResult.result[0];
      return {
        message: lastComment.COMMENT || '',
        author: lastComment.AUTHOR_ID || 'Поддержка',
        timestamp: lastComment.CREATED || new Date()
      };
    }
    
    // Если не получилось получить из таймлайна, пробуем получить из полей карточки
    const itemResult = await bitrix24Service['makeRequest']('crm.item.get', {
      entityTypeId: 1038,
      id: smartProcessId,
      select: ['COMMENTS', 'DESCRIPTION']
    });
    
    console.log('🔍 [WEBHOOK SERVICE] Item result:', itemResult);
    
    if (itemResult.result) {
      const comments = itemResult.result.COMMENTS || '';
      const description = itemResult.result.DESCRIPTION || '';
      
      // Берем последнее непустое поле
      const lastMessage = comments || description;
      if (lastMessage) {
        return {
          message: lastMessage,
          author: 'Поддержка',
          timestamp: new Date()
        };
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ [WEBHOOK SERVICE] Error getting last comment:', error);
    return null;
  }
}
