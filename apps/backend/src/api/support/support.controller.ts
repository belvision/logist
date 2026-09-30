import type { Context } from 'hono';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { Bitrix24Service } from '../bitrix24/bitrix24.service';
import db from '../../db/client';
import { company, tip_company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  CreateSupportTicketSchema, 
  AddMessageSchema, 
  UpdateTicketStatusSchema,
  GetTicketsSchema 
} from './support.schema';

const supportService = new SupportService();
const supportRepository = new SupportRepository();
const bitrix24Service = new Bitrix24Service();

// Создать новый тикет
export async function createTicketHandler(c: Context) {
  try {
    
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Не авторизован' }, 401);
    }

    const body = await c.req.json();
    
    let validatedData;
    try {
      validatedData = CreateSupportTicketSchema.parse(body);
    } catch (validationError) {
      console.error('❌ [SUPPORT CONTROLLER] Validation error:', validationError);
      return c.json({ 
        error: 'Ошибка валидации данных', 
        details: validationError instanceof Error ? validationError.message : 'Неизвестная ошибка валидации' 
      }, 400);
    }

    // Получить роль пользователя из БД
    let userRole = 'Пользователь'; // По умолчанию
    if (validatedData.companyId) {
      try {
        // TODO: Получить роль пользователя из таблицы users_company
        // Пока используем заглушку
        userRole = 'Пользователь';
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error getting user role:', error);
      }
    }

    // Подготовить данные пользователя
    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone, // Используем реальный номер из БД
      role: userRole,
    };
    
    // Проверяем, что номер телефона существует и не пустой
    if (!userData.phone || userData.phone.trim() === '') {
      console.error('❌ [SUPPORT CONTROLLER] User phone is missing or empty:', userData.phone);
      return c.json({ 
        success: false, 
        error: 'Номер телефона пользователя не найден или пустой' 
      }, 400);
    }

    // Получить данные компании из БД по companyId
    let companyData = undefined;
    if (validatedData.companyId) {
      try {
        const companyResult = await db.select({
          id_company: company.id_company,
          name_company: company.name_company,
          unp: company.unp,
          tel_1: company.tel_1,
          ur_address: company.ur_address,
          id_tip_company: company.id_tip_company,
          tip_company_name: tip_company.name_tip_company
        })
        .from(company)
        .leftJoin(tip_company, eq(company.id_tip_company, tip_company.id_tip_company))
        .where(eq(company.id_company, validatedData.companyId))
        .limit(1);

        if (companyResult.length > 0) {
          const companyInfo = companyResult[0];
          companyData = {
            name: companyInfo.name_company,
            unp: companyInfo.unp,
            phone: companyInfo.tel_1,
            address: companyInfo.ur_address,
            company_type: companyInfo.tip_company_name || 'Предприятие',
            tip_company_name: companyInfo.tip_company_name
          };
        } else {
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error getting company data:', error);
      }
    }

    // ШАГ 1: Работа с контактом в Bitrix24
    let contact = null;
    
    // ШАГ 1.1: Проверяем контакт в Bitrix24
    try {
      contact = await bitrix24Service.findContactByPhone(userData.phone);
      if (contact) {
      } else {
      }
    } catch (error) {
      console.error('❌ [SUPPORT CONTROLLER] Error checking contact in Bitrix24:', error);
    }

    // ШАГ 1.2: Если контакт не найден, создаем его
    if (!contact) {
      try {
        contact = await bitrix24Service.createContact({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role // Роль пользователя из БД
        });
        if (contact) {
        } else {
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error creating contact in Bitrix24:', error);
      }
    }
    
    // ШАГ 2: Работа с компанией в Bitrix24 (если есть данные компании)
    let bitrixCompany = null;
    
    if (companyData && companyData.unp) {
      
      // ШАГ 2.1: Ищем компанию по УНП
      try {
        bitrixCompany = await bitrix24Service.findCompanyByUnp(companyData.unp);
        if (bitrixCompany) {
        } else {
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error searching company in Bitrix24:', error);
      }

      // ШАГ 2.2: Если компания не найдена, создаем ее
      if (!bitrixCompany) {
        try {
          bitrixCompany = await bitrix24Service.createCompany({
            name: companyData.name,
            unp: companyData.unp,
            phone: companyData.phone,
            address: companyData.address,
            email: userData.email, // Email пользователя
            // company_type: companyData.company_type, // Удалено, так как не используется в Bitrix24
            companyType: companyData.tip_company_name || undefined
          });
          if (bitrixCompany) {
          } else {
          }
        } catch (error) {
          console.error('❌ [SUPPORT CONTROLLER] Error creating company in Bitrix24:', error);
        }
      }
    } else {
    }
    
    // ШАГ 3: Создание тикета в базе данных
    let ticket = null;
    try {
      ticket = await supportRepository.createTicket({
        id_user: user.id_user,
        id_company: validatedData.companyId || undefined,
        subject: validatedData.subject,
        message: validatedData.message,
        priority: validatedData.priority || 1
      });
    } catch (error) {
      console.error('❌ [SUPPORT CONTROLLER] Error creating ticket in DB:', error);
      return c.json({ 
        success: false, 
        error: 'Ошибка создания тикета в базе данных' 
      }, 500);
    }

    // ШАГ 4: Создание смарт-процесса в Bitrix24
    let bitrixTicket = null;
    try {
      if (contact && contact.id) {
        bitrixTicket = await bitrix24Service.createSmartProcess({
          title: validatedData.subject,
          message: validatedData.message,
          contactId: contact.id,
          companyId: bitrixCompany?.id
        });
        
        if (bitrixTicket && bitrixTicket.id) {
          
          // Обновляем тикет в БД с bitrix24_ticket_id
          await supportRepository.updateBitrix24Id(ticket.id_ticket, bitrixTicket.id);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('❌ [SUPPORT CONTROLLER] Error creating smart process in Bitrix24:', error);
      // Не прерываем процесс, если Bitrix24 недоступен
    }

    return c.json({ 
      success: true, 
      message: 'Тикет создан успешно',
      ticket: {
        id: ticket.id_ticket,
        subject: ticket.subject,
        status: ticket.status,
        bitrix24_ticket_id: bitrixTicket?.id || null
      },
      contact: contact,
      company: bitrixCompany
    }, 200);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return c.json({ 
      error: 'Ошибка создания тикета', 
      details: error.message 
    }, 400);
  }
}

// Получить тикет по ID
export async function getTicketHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Не авторизован' }, 401);
    }

    const id_ticket = c.req.param('id');
    if (!id_ticket) {
      return c.json({ error: 'ID тикета обязателен' }, 400);
    }

    const ticket = await supportService.getTicketById(id_ticket, user.id_user);
    if (!ticket) {
      return c.json({ error: 'Тикет не найден' }, 404);
    }

    return c.json({ ticket });
  } catch (error: any) {
    console.error('Error getting ticket:', error);
    return c.json({ 
      error: 'Ошибка получения тикета', 
      details: error.message 
    }, 500);
  }
}

// Получить тикеты пользователя
export async function getTicketsHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Не авторизован' }, 401);
    }

    const query = c.req.query();
    const filters = GetTicketsSchema.parse({
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    });

    const result = await supportService.getTicketsByUser(user.id_user, filters);
    
    return c.json(result);
  } catch (error: any) {
    console.error('❌ [SUPPORT CONTROLLER] Error getting tickets:', error);
    console.error('❌ [SUPPORT CONTROLLER] Error stack:', error.stack);
    return c.json({ 
      error: 'Ошибка получения тикетов', 
      details: error.message 
    }, 500);
  }
}

// Добавить сообщение в тикет
export async function addMessageHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Не авторизован' }, 401);
    }

    const id_ticket = c.req.param('id');
    if (!id_ticket) {
      return c.json({ error: 'ID тикета обязателен' }, 400);
    }

    const body = await c.req.json();
    const validatedData = AddMessageSchema.parse(body);

    const success = await supportService.addMessage(id_ticket, user.id_user, validatedData);
    if (!success) {
      return c.json({ error: 'Тикет не найден или ошибка добавления сообщения' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error adding message:', error);
    return c.json({ 
      error: 'Ошибка добавления сообщения', 
      details: error.message 
    }, 400);
  }
}

// Обновить статус тикета
export async function updateTicketStatusHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Не авторизован' }, 401);
    }

    const id_ticket = c.req.param('id');
    if (!id_ticket) {
      return c.json({ error: 'ID тикета обязателен' }, 400);
    }

    const body = await c.req.json();
    const validatedData = UpdateTicketStatusSchema.parse(body);

    const success = await supportService.updateTicketStatus(
      id_ticket, 
      user.id_user, 
      validatedData
    );
    
    if (!success) {
      return c.json({ error: 'Тикет не найден или ошибка обновления статуса' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    return c.json({ 
      error: 'Ошибка обновления статуса', 
      details: error.message 
    }, 400);
  }
}
