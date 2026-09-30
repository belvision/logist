import type { Context } from 'hono';
import { SupportService } from './support.service';
import { Bitrix24Service } from '../bitrix24/bitrix24.service';
import { db } from '../../db/client';
import { company, tip_company } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';
import { 
  CreateSupportTicketSchema, 
  AddMessageSchema, 
  UpdateTicketStatusSchema,
  GetTicketsSchema 
} from './support.schema';

const supportService = new SupportService();
const bitrix24Service = new Bitrix24Service();

// Создать новый тикет
export async function createTicketHandler(c: Context) {
  try {
    console.log('🔍 [SUPPORT CONTROLLER] Starting createTicketHandler');
    
    const user = c.get('user');
    if (!user) {
      console.log('❌ [SUPPORT CONTROLLER] No user found');
      return c.json({ error: 'Не авторизован' }, 401);
    }

    console.log('🔍 [SUPPORT CONTROLLER] User found:', { id: user.id_user, email: user.email });
    console.log('🔍 [SUPPORT CONTROLLER] User object:', JSON.stringify(user, null, 2));
    console.log('🔍 [SUPPORT CONTROLLER] User type:', typeof user);
    console.log('🔍 [SUPPORT CONTROLLER] User keys:', Object.keys(user));
    console.log('🔍 [SUPPORT CONTROLLER] User id_user:', user.id_user);
    console.log('🔍 [SUPPORT CONTROLLER] User email:', user.email);
    console.log('🔍 [SUPPORT CONTROLLER] User phone:', user.phone);

    const body = await c.req.json();
    console.log('🔍 [SUPPORT CONTROLLER] Request body:', body);
    
    let validatedData;
    try {
      validatedData = CreateSupportTicketSchema.parse(body);
      console.log('🔍 [SUPPORT CONTROLLER] Validated data:', validatedData);
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
        console.log('🔍 [SUPPORT CONTROLLER] User role from DB:', userRole);
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
    
    console.log('🔍 [SUPPORT CONTROLLER] User object:', user);
    console.log('🔍 [SUPPORT CONTROLLER] User phone:', user.phone);
    console.log('🔍 [SUPPORT CONTROLLER] User phone type:', typeof user.phone);
    console.log('🔍 [SUPPORT CONTROLLER] User phone length:', user.phone?.length);
    console.log('🔍 [SUPPORT CONTROLLER] User firstName:', user.firstName);
    console.log('🔍 [SUPPORT CONTROLLER] User lastName:', user.lastName);
    console.log('🔍 [SUPPORT CONTROLLER] User email:', user.email);
    
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
        console.log('🔍 [SUPPORT CONTROLLER] Getting company data from DB for id:', validatedData.companyId);
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
          console.log('🔍 [SUPPORT CONTROLLER] Raw company data from DB:', companyInfo);
          companyData = {
            name: companyInfo.name_company,
            unp: companyInfo.unp,
            phone: companyInfo.tel_1,
            address: companyInfo.ur_address,
            company_type: companyInfo.tip_company_name || 'Предприятие',
            tip_company_name: companyInfo.tip_company_name
          };
          console.log('✅ [SUPPORT CONTROLLER] Processed company data:', companyData);
        } else {
          console.log('❌ [SUPPORT CONTROLLER] Company not found in DB');
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error getting company data:', error);
      }
    }

    console.log('🔍 [SUPPORT CONTROLLER] User data:', userData);
    console.log('🔍 [SUPPORT CONTROLLER] Company data:', companyData);

    console.log('🔍 [SUPPORT CONTROLLER] About to call supportService.createTicket...');
    
    // ШАГ 1: Работа с контактом в Bitrix24
    console.log('🔍 [SUPPORT CONTROLLER] ===== ШАГ 1: РАБОТА С КОНТАКТОМ =====');
    let contact = null;
    
    // ШАГ 1.1: Проверяем контакт в Bitrix24
    console.log('🔍 [SUPPORT CONTROLLER] Step 1.1: Checking contact in Bitrix24...');
    try {
      contact = await bitrix24Service.findContactByPhone(userData.phone);
      if (contact) {
        console.log('✅ [SUPPORT CONTROLLER] Contact found in Bitrix24:', contact);
      } else {
        console.log('❌ [SUPPORT CONTROLLER] Contact not found in Bitrix24');
      }
    } catch (error) {
      console.error('❌ [SUPPORT CONTROLLER] Error checking contact in Bitrix24:', error);
    }

    // ШАГ 1.2: Если контакт не найден, создаем его
    if (!contact) {
      console.log('🔍 [SUPPORT CONTROLLER] Step 1.2: Creating new contact in Bitrix24...');
      try {
        contact = await bitrix24Service.createContact({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role // Роль пользователя из БД
        });
        if (contact) {
          console.log('✅ [SUPPORT CONTROLLER] Contact created successfully:', contact);
        } else {
          console.log('❌ [SUPPORT CONTROLLER] Failed to create contact');
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error creating contact in Bitrix24:', error);
      }
    }
    
    console.log('🔍 [SUPPORT CONTROLLER] ===== ШАГ 1 ЗАВЕРШЕН =====');

    // ШАГ 2: Работа с компанией в Bitrix24 (если есть данные компании)
    console.log('🔍 [SUPPORT CONTROLLER] ===== ШАГ 2: РАБОТА С КОМПАНИЕЙ =====');
    let bitrixCompany = null;
    
    if (companyData && companyData.unp) {
      console.log('🔍 [SUPPORT CONTROLLER] Company data for Bitrix24:', {
        name: companyData.name,
        unp: companyData.unp,
        phone: companyData.phone,
        address: companyData.address,
        company_type: companyData.company_type,
        tip_company_name: companyData.tip_company_name
      });
      
      // ШАГ 2.1: Ищем компанию по УНП
      console.log('🔍 [SUPPORT CONTROLLER] Step 2.1: Searching company by UNP:', companyData.unp);
      try {
        bitrixCompany = await bitrix24Service.findCompanyByUnp(companyData.unp);
        if (bitrixCompany) {
          console.log('✅ [SUPPORT CONTROLLER] Company found in Bitrix24:', bitrixCompany);
        } else {
          console.log('❌ [SUPPORT CONTROLLER] Company not found in Bitrix24');
        }
      } catch (error) {
        console.error('❌ [SUPPORT CONTROLLER] Error searching company in Bitrix24:', error);
      }

      // ШАГ 2.2: Если компания не найдена, создаем ее
      if (!bitrixCompany) {
        console.log('🔍 [SUPPORT CONTROLLER] Step 2.2: Creating new company in Bitrix24...');
        console.log('🔍 [SUPPORT CONTROLLER] Company creation data:', {
          name: companyData.name,
          unp: companyData.unp,
          phone: companyData.phone,
          address: companyData.address,
          company_type: companyData.company_type,
          tip_company_name: companyData.tip_company_name
        });
        try {
          bitrixCompany = await bitrix24Service.createCompany({
            name: companyData.name,
            unp: companyData.unp,
            phone: companyData.phone,
            address: companyData.address,
            email: userData.email, // Email пользователя
            company_type: companyData.company_type,
            tip_company_name: companyData.tip_company_name
          });
          if (bitrixCompany) {
            console.log('✅ [SUPPORT CONTROLLER] Company created successfully:', bitrixCompany);
            console.log('✅ [SUPPORT CONTROLLER] Company ID:', bitrixCompany.id);
            console.log('✅ [SUPPORT CONTROLLER] Company title:', bitrixCompany.title);
          } else {
            console.log('❌ [SUPPORT CONTROLLER] Failed to create company - no result returned');
          }
        } catch (error) {
          console.error('❌ [SUPPORT CONTROLLER] Error creating company in Bitrix24:', error);
        }
      }
    } else {
      console.log('❌ [SUPPORT CONTROLLER] No company data or UNP missing:', {
        hasCompanyData: !!companyData,
        hasUnp: !!(companyData && companyData.unp)
      });
    }
    
    console.log('🔍 [SUPPORT CONTROLLER] ===== ШАГ 2 ЗАВЕРШЕН =====');
    
    // Упрощенная логика: только создание контакта и компании в Bitrix24
    try {
      const result = await supportService.testBitrix24Integration(userData, companyData);
      console.log('🔍 [SUPPORT CONTROLLER] Bitrix24 integration result:', result);
      
      return c.json({ 
        success: true, 
        message: 'Контакт и компания обработаны в Bitrix24',
        contact: result.contact,
        company: result.company
      }, 200);
    } catch (error) {
      console.error('❌ [SUPPORT CONTROLLER] Error in Bitrix24 integration:', error);
      return c.json({ 
        success: false, 
        error: 'Ошибка интеграции с Bitrix24' 
      }, 500);
    }
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

    console.log('🔍 [SUPPORT CONTROLLER] Getting tickets for user:', user.id_user);

    const query = c.req.query();
    const filters = GetTicketsSchema.parse({
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    });

    console.log('🔍 [SUPPORT CONTROLLER] Filters:', filters);

    const result = await supportService.getTicketsByUser(user.id_user, filters);
    
    console.log('🔍 [SUPPORT CONTROLLER] Result:', result);
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
