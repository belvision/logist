import { WebhookDto, SanitizedWebhookDto } from './webhook.schema';
import { Bitrix24Service } from './bitrix24.service';
import { WebhookProcessingResult, SmartProcessComment, Bitrix24TimelineComment, Bitrix24ItemData } from './webhook.types';
import { findTicketByBitrixId, addSupportCommentToTicket } from './webhook.repository';

export async function processWebhookFromBitrix24(dto: SanitizedWebhookDto): Promise<WebhookProcessingResult> {
  try {
    console.log('🔍 [WEBHOOK SERVICE] ===== PROCESSING WEBHOOK =====');
    console.log('🔍 [WEBHOOK SERVICE] Webhook data:', dto);
    
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
      console.log('❌ [WEBHOOK SERVICE] No smart process ID found in webhook');
      return { success: false, error: 'ID смарт-процесса не найден в вебхуке' };
    }
    
    console.log('🔍 [WEBHOOK SERVICE] Smart process ID:', smartProcessId);
    
    // Получаем данные из смарт-процесса Bitrix24
    const bitrix24Service = new Bitrix24Service();
    const smartProcessData = await getSmartProcessData(bitrix24Service, smartProcessId);
    
    if (!smartProcessData) {
      console.log('❌ [WEBHOOK SERVICE] Failed to get smart process data');
      return { success: false, error: 'Не удалось получить данные смарт-процесса' };
    }
    
    console.log('🔍 [WEBHOOK SERVICE] Smart process data:', smartProcessData);
    
    // Ищем тикет в БД по bitrix24_ticket_id (может не быть)
    const ticketData = await findTicketByBitrixId(smartProcessId);
    
    if (ticketData) {
      console.log('🔍 [WEBHOOK SERVICE] Found existing ticket:', ticketData.id_ticket);
      
      // Если тикет существует, добавляем комментарий
      if (smartProcessData.lastComment) {
        const addCommentResult = await addSupportCommentToTicket(ticketData.id_ticket, {
          message: smartProcessData.lastComment.message,
          author: smartProcessData.lastComment.author || 'Поддержка',
          timestamp: smartProcessData.lastComment.timestamp
        });
        
        if (addCommentResult.success) {
          console.log('✅ [WEBHOOK SERVICE] Comment added to existing ticket');
          return {
            success: true,
            ticketId: ticketData.id_ticket,
            messageAdded: true
          };
        }
      }
    } else {
      console.log('🔍 [WEBHOOK SERVICE] No existing ticket found, creating new one or logging data');
      // Здесь можно создать новый тикет или просто залогировать данные
      // Пока просто возвращаем успех без ticketId
      return {
        success: true,
        messageAdded: false
      };
    }
    
    console.log('✅ [WEBHOOK SERVICE] Smart process processed successfully');
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
    console.log('🔍 [WEBHOOK SERVICE] Getting smart process data for ID:', smartProcessId);
    
    // Получаем данные смарт-процесса
    const itemResult = await bitrix24Service['makeRequest']('crm.item.get', {
      entityTypeId: 1038,
      id: smartProcessId,
      select: ['*'] // Получаем все поля
    });
    
    console.log('🔍 [WEBHOOK SERVICE] Smart process item result:', itemResult);
    
    if (!itemResult.result) {
      console.log('❌ [WEBHOOK SERVICE] No smart process data found');
      return null;
    }
    
    // Получаем комментарии из таймлайна
    console.log('🔍 [WEBHOOK SERVICE] Requesting timeline comments for entity:', 'DYNAMIC_1038', 'ID:', smartProcessId);
    const timelineResult = await bitrix24Service['makeRequest']('crm.timeline.comment.list', {
      filter: {
        ENTITY_TYPE: 'DYNAMIC_1038',
        ENTITY_ID: smartProcessId
      },
      order: { ID: 'DESC' },
      select: ['ID', 'COMMENT', 'CREATED', 'AUTHOR_ID']
    });
    
    console.log('🔍 [WEBHOOK SERVICE] Timeline result:', JSON.stringify(timelineResult, null, 2));
    
    let lastComment = null;
    if (timelineResult.result && timelineResult.result.length > 0) {
      const comment = timelineResult.result[0];
      lastComment = {
        message: comment.COMMENT || '',
        author: comment.AUTHOR_ID || 'Поддержка',
        timestamp: comment.CREATED || new Date()
      };
      console.log('🔍 [WEBHOOK SERVICE] Found timeline comment:', lastComment);
    } else {
      console.log('🔍 [WEBHOOK SERVICE] No timeline comments found, trying alternative method...');
      
      // Альтернативный способ: получаем комментарии через crm.timeline.list
      try {
        const alternativeResult = await bitrix24Service['makeRequest']('crm.timeline.list', {
          filter: {
            ENTITY_TYPE: 'DYNAMIC_1038',
            ENTITY_ID: smartProcessId
          },
          order: { ID: 'DESC' },
          select: ['ID', 'COMMENT', 'CREATED', 'AUTHOR_ID', 'TYPE_ID']
        });
        
        console.log('🔍 [WEBHOOK SERVICE] Alternative timeline result:', JSON.stringify(alternativeResult, null, 2));
        
        if (alternativeResult.result && alternativeResult.result.length > 0) {
          // Ищем комментарии (TYPE_ID = 4 для комментариев)
          const commentItem = alternativeResult.result.find((item: any) => item.TYPE_ID === '4');
          if (commentItem) {
            lastComment = {
              message: commentItem.COMMENT || '',
              author: commentItem.AUTHOR_ID || 'Поддержка',
              timestamp: commentItem.CREATED || new Date()
            };
            console.log('🔍 [WEBHOOK SERVICE] Found alternative comment:', lastComment);
          }
        }
      } catch (altError) {
        console.error('❌ [WEBHOOK SERVICE] Alternative comment method failed:', altError);
      }
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
