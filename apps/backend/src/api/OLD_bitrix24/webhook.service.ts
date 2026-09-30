import { WebhookDto, SanitizedWebhookDto } from './webhook.schema';
import { Bitrix24Service } from './bitrix24.service';
import { WebhookProcessingResult, SmartProcessComment, Bitrix24TimelineComment, Bitrix24ItemData } from './webhook.types';
import { findTicketByBitrixId, addSupportCommentToTicket } from './webhook.repository';

export async function processWebhookFromBitrix24(dto: SanitizedWebhookDto): Promise<WebhookProcessingResult> {
  try {
    
    // Извлекаем ID смарт-процесса из вебхука
    let smartProcessId: string | null = null;
    
    // Новый способ: извлекаем из sanitized данных
    if (dto.smartProcessId) {
      smartProcessId = dto.smartProcessId;
    }
    // Старый способ: для совместимости
    else if (dto.data?.FIELDS?.ID) {
      smartProcessId = dto.data.FIELDS.ID;
    } else if (dto.data?.ITEM?.ID) {
      smartProcessId = dto.data.ITEM.ID;
    }
    
    if (!smartProcessId) {
      return { success: false, error: 'ID смарт-процесса не найден в вебхуке' };
    }
    
    // Получаем данные из смарт-процесса Bitrix24
    const bitrix24Service = new Bitrix24Service();
    const smartProcessData = await getSmartProcessData(bitrix24Service, smartProcessId);
    
    if (!smartProcessData) {
      return { success: false, error: 'Не удалось получить данные смарт-процесса' };
    }
    
    // Ищем тикет в БД по bitrix24_ticket_id (может не быть)
    const ticketData = await findTicketByBitrixId(smartProcessId);
    
    if (ticketData) {
      
      // Если тикет существует, добавляем комментарий
      if (smartProcessData.lastComment) {
        const addCommentResult = await addSupportCommentToTicket(ticketData.id_ticket, {
          message: smartProcessData.lastComment.message,
          author: smartProcessData.lastComment.author || 'Поддержка',
          timestamp: smartProcessData.lastComment.timestamp
        });
        
        if (addCommentResult.success) {
          return {
            success: true,
            ticketId: ticketData.id_ticket,
            messageAdded: true
          };
        }
      }
    } else {
      // Здесь можно создать новый тикет или просто залогировать данные
      // Пока просто возвращаем успех без ticketId
      return {
        success: true,
        messageAdded: false
      };
    }
    
    const response: WebhookProcessingResult = {
      success: true,
      messageAdded: false,
    };
    if (ticketData?.id_ticket) {
      response.ticketId = ticketData.id_ticket;
    }
    return response;
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK SERVICE] Error processing webhook:', error);
    return { success: false, error: error.message };
  }
}

async function getSmartProcessData(bitrix24Service: Bitrix24Service, smartProcessId: string): Promise<any> {
  try {
    
    // Получаем данные смарт-процесса
    const itemResult = await bitrix24Service['makeRequest']('crm.item.get', {
      entityTypeId: 1038,
      id: smartProcessId,
      select: ['*'] // Получаем все поля
    });
    
    if (!itemResult.result) {
      return null;
    }
    
    // Получаем комментарии из таймлайна
    const timelineResult = await bitrix24Service['makeRequest']('crm.timeline.comment.list', {
      filter: {
        ENTITY_TYPE: 'DYNAMIC_1038',
        ENTITY_ID: smartProcessId
      },
      order: { ID: 'DESC' },
      select: ['ID', 'COMMENT', 'CREATED', 'AUTHOR_ID']
    });
    
    let lastComment = null;
    if (timelineResult.result && timelineResult.result.length > 0) {
      const comment = timelineResult.result[0];
      lastComment = {
        message: comment.COMMENT || '',
        author: comment.AUTHOR_ID || 'Поддержка',
        timestamp: comment.CREATED || new Date()
      };
    }
    
    return {
      item: itemResult.result,
      lastComment: lastComment,
      timelineComments: timelineResult.result || []
    };
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK SERVICE] Error getting smart process data:', error);
    return null;
  }
}

async function getLastCommentFromSmartProcess(bitrix24Service: Bitrix24Service, smartProcessId: string): Promise<SmartProcessComment | null> {
  try {
    
    // Получаем комментарии из таймлайна смарт-процесса
    const timelineResult = await bitrix24Service['makeRequest']('crm.timeline.comment.list', {
      filter: {
        ENTITY_TYPE: 'DYNAMIC_1038',
        ENTITY_ID: smartProcessId
      },
      order: { ID: 'DESC' },
      select: ['ID', 'COMMENT', 'CREATED', 'AUTHOR_ID']
    });
    
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
