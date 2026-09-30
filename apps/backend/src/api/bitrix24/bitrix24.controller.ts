import { SupportRequestSchema, sanitizeSupportRequestDto, AddCommentSchema, sanitizeAddCommentDto, CloseTicketSchema, sanitizeCloseTicketDto, MarkViewedSchema, sanitizeMarkViewedDto } from './bitrix24.schema';
import { createSupportRequestService, addCommentToExistingSmartProcess, updateSmartProcessStage } from './bitrix24.service';
import { getOpenTickets, getAllTickets, addCommentToTicket, getTicketById, closeTicket, markTicketAsViewed } from './bitrix24.repository';
import db from '../../db/client';
import { company, tip_company, support_tickets } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function createSupportRequestHandler(c: any) {
  console.log('🔍 [BITRIX24 CONTROLLER] ===== CREATE SUPPORT REQUEST HANDLER CALLED =====');
  const auth = c.get('user') as any;
  console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
  const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
  console.log('🔍 [BITRIX24 CONTROLLER] User ID:', userId);
  if (!userId) return c.json({ error: 'Требуется авторизация' }, 401);

  const body = await c.req.json().catch(() => ({}));
  console.log('🔍 [BITRIX24 CONTROLLER] Request body:', body);
  const parsed = SupportRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.log('❌ [BITRIX24 CONTROLLER] Validation failed:', parsed.error);
    return c.json({ 
      error: 'Ошибка валидации', 
      details: parsed.error.flatten() 
    }, 400);
  }

  const dto = sanitizeSupportRequestDto(parsed.data);
  console.log('🔍 [BITRIX24 CONTROLLER] Sanitized DTO:', dto);
  
  try {
    let companyData = null;
    
    // Получаем данные компании из БД по ID только если companyId предоставлен
    if (dto.companyId) {
      console.log('🔍 [BITRIX24 CONTROLLER] Getting company data for ID:', dto.companyId);
      const companyResult = await db.select({
        id_company: company.id_company,
        name_company: company.name_company,
        unp: company.unp,
        tel_1: company.tel_1,
        tel_2: company.tel_2,
        email: company.email,
        ur_address: company.ur_address,
        id_tip_company: company.id_tip_company,
        tip_company_name: tip_company.name_tip_company
      })
      .from(company)
      .leftJoin(tip_company, eq(company.id_tip_company, tip_company.id_tip_company))
      .where(eq(company.id_company, dto.companyId))
      .limit(1);

      if (companyResult.length === 0) {
        return c.json({ error: 'Компания не найдена' }, 404);
      }

      const companyDataRaw = companyResult[0];
      console.log('🔍 [BITRIX24 CONTROLLER] Company data:', companyDataRaw);
      console.log('🔍 [BITRIX24 CONTROLLER] tip_company_name from JOIN:', companyDataRaw?.tip_company_name);
      console.log('🔍 [BITRIX24 CONTROLLER] id_tip_company from DB:', companyDataRaw?.id_tip_company);
      console.log('🔍 [BITRIX24 CONTROLLER] Full company data JSON:', JSON.stringify(companyDataRaw, null, 2));

      let tipCompanyName = companyDataRaw?.tip_company_name;

      // fallback: если название типа компании не подтянулось через join, достанем напрямую
      if (!tipCompanyName && companyDataRaw?.id_tip_company) {
        console.log('🔍 [BITRIX24 CONTROLLER] tip_company_name is empty, fetching directly by id_tip_company');
        const tipCompanyResult = await db
          .select({ name_tip_company: tip_company.name_tip_company })
          .from(tip_company)
          .where(eq(tip_company.id_tip_company, companyDataRaw?.id_tip_company))
          .limit(1);

        if (tipCompanyResult.length > 0) {
          tipCompanyName = tipCompanyResult[0].name_tip_company;
          console.log('✅ [BITRIX24 CONTROLLER] tip_company_name fetched manually:', tipCompanyName);
        } else {
          console.log('❌ [BITRIX24 CONTROLLER] tip_company_name not found even after manual fetch');
        }
      }

      companyData = { ...companyDataRaw, tip_company_name: tipCompanyName };
      console.log('🔍 [BITRIX24 CONTROLLER] Final companyData:', companyData);
      console.log('🔍 [BITRIX24 CONTROLLER] Final tip_company_name:', companyData.tip_company_name);
    } else {
      console.log('🔍 [BITRIX24 CONTROLLER] No company ID provided, proceeding without company');
    }

    // Подготавливаем данные пользователя
    const userData = {
      id_user: auth.id_user,
      firstName: auth.firstName,
      lastName: auth.lastName,
      email: auth.email,
      phone: auth.phone
    };
    console.log('🔍 [BITRIX24 CONTROLLER] User data:', userData);
    console.log('🔍 [BITRIX24 CONTROLLER] Company data:', companyData);

    // Создаем запрос поддержки с данными компании и пользователя
    console.log('🔍 [BITRIX24 CONTROLLER] Calling createSupportRequestService...');
    console.log('🔍 [BITRIX24 CONTROLLER] Company data passed to service:', companyData);
    const res = await createSupportRequestService(dto, companyData, userData);
    console.log('🔍 [BITRIX24 CONTROLLER] Service response:', res);
    
    return c.json(res.ok ? { 
      success: true, 
      message: res.message,
      contact: res.contact,
      company: res.company,
      smartProcess: res.smartProcess,
      dbTicket: res.dbTicket,
      isExistingTicket: res.isExistingTicket,
      ticketId: res.ticketId,
      bitrix24TicketId: res.bitrix24TicketId,
      commentAdded: res.commentAdded
    } : { error: res.error }, res.status);
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error:', error);
    return c.json({ error: 'Ошибка создания запроса поддержки' }, 500);
  }
}

// Получение открытых тикетов пользователя
export async function getOpenTicketsHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== GET OPEN TICKETS HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    console.log('🔍 [BITRIX24 CONTROLLER] Getting open tickets for user:', userId);
    const result = await getOpenTickets(userId);
    
    if (result.success) {
      console.log('✅ [BITRIX24 CONTROLLER] Open tickets retrieved:', result.tickets?.length || 0);
      return c.json({
        success: true,
        tickets: result.tickets || []
      });
    } else {
      console.error('❌ [BITRIX24 CONTROLLER] Error getting open tickets:', result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error getting open tickets:', error);
    return c.json({ error: 'Ошибка получения открытых тикетов' }, 500);
  }
}

// Получение всех тикетов пользователя (архив)
export async function getAllTicketsHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== GET ALL TICKETS HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    console.log('🔍 [BITRIX24 CONTROLLER] Getting all tickets for user:', userId);
    const result = await getAllTickets(userId);
    
    if (result.success) {
      console.log('✅ [BITRIX24 CONTROLLER] All tickets retrieved:', result.tickets?.length || 0);
      return c.json({
        success: true,
        tickets: result.tickets || []
      });
    } else {
      console.error('❌ [BITRIX24 CONTROLLER] Error getting all tickets:', result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error getting all tickets:', error);
    return c.json({ error: 'Ошибка получения тикетов' }, 500);
  }
}

// Добавление комментария к существующему тикету
export async function addCommentHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== ADD COMMENT HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const body = await c.req.json();
    console.log('🔍 [BITRIX24 CONTROLLER] Request body:', body);

    // Валидация данных
    const validationResult = AddCommentSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [BITRIX24 CONTROLLER] Validation failed:', validationResult.error);
      return c.json({ 
        error: 'Ошибка валидации',
        details: validationResult.error.flatten()
      }, 400);
    }

    const dto = sanitizeAddCommentDto(validationResult.data);
    console.log('🔍 [BITRIX24 CONTROLLER] Sanitized DTO:', dto);

    // Получаем данные тикета из БД
    const ticket = await db.select()
      .from(support_tickets)
      .where(eq(support_tickets.id_ticket, dto.ticketId))
      .limit(1);

    if (ticket.length === 0) {
      console.log('❌ [BITRIX24 CONTROLLER] Ticket not found:', dto.ticketId);
      return c.json({ error: 'Тикет не найден' }, 404);
    }

    const ticketData = ticket[0];
    console.log('🔍 [BITRIX24 CONTROLLER] Ticket data:', ticketData);

    // Проверяем, что тикет принадлежит пользователю
    if (ticketData?.id_user !== userId) {
      console.log('❌ [BITRIX24 CONTROLLER] Ticket does not belong to user');
      return c.json({ error: 'Нет доступа к тикету' }, 403);
    }

    // Сначала работаем с Bitrix24, если есть ID
    let bitrixSuccess = true;
    if (ticketData?.bitrix24_ticket_id) {
      // Добавляем комментарий к смарт-процессу в Bitrix24 с данными пользователя
      const bitrixResult = await addCommentToExistingSmartProcess(
        ticketData?.bitrix24_ticket_id, 
        dto.message,
        {
          firstName: auth.firstName,
          lastName: auth.lastName,
          email: auth.email
        }
      );
      
      console.log('🔍 [BITRIX24 CONTROLLER] Bitrix24 comment result:', bitrixResult);
      
      // Изменяем стадию смарт-процесса на "Вопрос" после добавления комментария
      if (bitrixResult.success) {
        const stageResult = await updateSmartProcessStage(
          ticketData?.bitrix24_ticket_id,
          'DT1038_11:NEW' // Стадия "Вопрос"
        );
        
        console.log('🔍 [BITRIX24 CONTROLLER] Stage update result:', stageResult);
        bitrixSuccess = stageResult.success;
      } else {
        bitrixSuccess = false;
      }
    }

    // Затем обновляем БД
    const dbResult = await addCommentToTicket(
      dto.ticketId, 
      dto.message, 
      `${auth.firstName || 'Пользователь'} ${auth.lastName || ''}`
    );

    if (!dbResult.success) {
      console.error('❌ [BITRIX24 CONTROLLER] Failed to add comment to ticket:', dbResult.error);
      return c.json({ error: 'Ошибка добавления комментария в БД' }, 500);
    }

    // Получаем обновленные данные тикета для возврата
    const updatedTicketResult = await getTicketById(dto.ticketId, userId);
    const updatedTicket = updatedTicketResult.success ? updatedTicketResult.ticket : null;

    return c.json({
      success: true,
      message: 'Комментарий добавлен успешно',
      ticketId: dto.ticketId,
      bitrixSuccess: bitrixSuccess,
      updatedTicket: updatedTicket
    });
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error adding comment:', error);
    return c.json({ error: 'Ошибка добавления комментария' }, 500);
  }
}

// Получение конкретного тикета по ID
export async function getTicketByIdHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== GET TICKET BY ID HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const ticketId = c.req.param('id');
    if (!ticketId) {
      console.log('❌ [BITRIX24 CONTROLLER] No ticket ID provided');
      return c.json({ error: 'ID тикета обязателен' }, 400);
    }

    console.log('🔍 [BITRIX24 CONTROLLER] Getting ticket:', ticketId, 'for user:', userId);
    const result = await getTicketById(ticketId, userId);
    
    if (result.success) {
      console.log('✅ [BITRIX24 CONTROLLER] Ticket retrieved successfully');
      return c.json({
        success: true,
        ticket: result.ticket
      });
    } else {
      console.error('❌ [BITRIX24 CONTROLLER] Error getting ticket:', result.error);
      return c.json({ error: result.error }, 404);
    }
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error getting ticket:', error);
    return c.json({ error: 'Ошибка получения тикета' }, 500);
  }
}

export async function closeTicketHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== CLOSE TICKET HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    console.log('🔍 [BITRIX24 CONTROLLER] Request body:', body);
    
    const parsed = CloseTicketSchema.safeParse(body);
    if (!parsed.success) {
      console.log('❌ [BITRIX24 CONTROLLER] Validation failed:', parsed.error);
      return c.json({ 
        error: 'Ошибка валидации', 
        details: parsed.error 
      }, 400);
    }

    const dto = sanitizeCloseTicketDto(parsed.data);
    console.log('🔍 [BITRIX24 CONTROLLER] Sanitized DTO:', dto);

    // Проверяем, что тикет принадлежит пользователю
    const ticketData = await getTicketById(dto.ticketId, userId);
    if (!ticketData.success) {
      console.log('❌ [BITRIX24 CONTROLLER] Ticket not found or access denied');
      return c.json({ error: 'Тикет не найден или нет доступа' }, 404);
    }

    // Проверяем, что тикет не уже закрыт
    if (ticketData.ticket?.status === 'Закрыто') {
      console.log('❌ [BITRIX24 CONTROLLER] Ticket already closed');
      return c.json({ error: 'Тикет уже закрыт' }, 400);
    }

    // Закрываем тикет в БД
    const result = await closeTicket(dto.ticketId, userId);
    
    if (result.success) {
      console.log('✅ [BITRIX24 CONTROLLER] Ticket closed in DB successfully');
      
      // Обновляем стадию смарт-процесса в Bitrix24, если есть ID
      let bitrixSuccess = true;
      if (result.ticket?.bitrix24TicketId) {
        console.log('🔍 [BITRIX24 CONTROLLER] Updating Bitrix24 smart process stage to SUCCESS');
        const stageResult = await updateSmartProcessStage(
          result.ticket.bitrix24TicketId,
          'DT1038_11:SUCCESS' // Стадия "Успех"
        );
        
        console.log('🔍 [BITRIX24 CONTROLLER] Bitrix24 stage update result:', stageResult);
        bitrixSuccess = stageResult.success;
      }
      
      return c.json({
        success: true,
        message: 'Обращение закрыто успешно',
        ticket: result.ticket,
        bitrixSuccess: bitrixSuccess
      });
    } else {
      console.error('❌ [BITRIX24 CONTROLLER] Failed to close ticket:', result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error closing ticket:', error);
    return c.json({ error: 'Ошибка закрытия тикета' }, 500);
  }
}

export async function markTicketAsViewedHandler(c: any) {
  try {
    console.log('🔍 [BITRIX24 CONTROLLER] ===== MARK TICKET AS VIEWED HANDLER CALLED =====');
    const auth = c.get('user') as any;
    console.log('🔍 [BITRIX24 CONTROLLER] Auth data:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    if (!userId) {
      console.log('❌ [BITRIX24 CONTROLLER] No user ID found');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    console.log('🔍 [BITRIX24 CONTROLLER] Request body:', body);
    
    const parsed = MarkViewedSchema.safeParse(body);
    if (!parsed.success) {
      console.log('❌ [BITRIX24 CONTROLLER] Validation failed:', parsed.error);
      return c.json({ 
        error: 'Ошибка валидации', 
        details: parsed.error 
      }, 400);
    }

    const dto = sanitizeMarkViewedDto(parsed.data);
    console.log('🔍 [BITRIX24 CONTROLLER] Sanitized DTO:', dto);

    // Отмечаем тикет как просмотренный
    const result = await markTicketAsViewed(dto.ticketId, userId);
    
    if (result.success) {
      console.log('✅ [BITRIX24 CONTROLLER] Ticket marked as viewed successfully');
      return c.json({
        success: true,
        message: 'Тикет отмечен как просмотренный',
        ticket: result.ticket
      });
    } else {
      console.error('❌ [BITRIX24 CONTROLLER] Failed to mark ticket as viewed:', result.error);
      return c.json({ error: result.error }, 500);
    }
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error marking ticket as viewed:', error);
    return c.json({ error: 'Ошибка отметки тикета как просмотренного' }, 500);
  }
}

