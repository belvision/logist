import { SupportRequestDto } from './bitrix24.schema';
import { createSupportTicket, createSupportTicketInDB, findExistingTicket, addCommentToTicket } from './bitrix24.repository';

export class Bitrix24Service {
  private baseUrl: string;
  
  // Функция для очистки названия компании от лишних символов
  private cleanCompanyName(name: string): string {
    if (!name) return '';
    
    // Убираем экранированные символы
    const cleaned = name
      .replace(/\\"/g, '"')  // Убираем экранированные кавычки \"
      .replace(/\\/g, '')    // Убираем оставшиеся обратные слеши
      .trim();
    
    return cleaned;
  }
  private retryAttempts = 5;
  private retryDelay = 20000; // 20 секунд

  constructor() {
    this.baseUrl = process.env.BITRIX24_URL || 'https://integro.bitrix24.by/rest/1/REDACTED_SECRET/';
  }

  private async makeFormRequest(endpoint: string, formData: URLSearchParams): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private async makeRequest(endpoint: string, data: any = {}): Promise<any> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as any;

        if (result.error) {
          if (result.error === 'QUERY_LIMIT_EXCEEDED' && attempt < this.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            continue;
          }
          throw new Error(result.error_description || result.error);
        }

        return result;
      } catch (error: any) {
        if (attempt === this.retryAttempts) {
          throw error;
        }

        if (error.message.includes('QUERY_LIMIT_EXCEEDED') || error.message.includes('timeout')) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  private escapeJsonString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // Хелпер для конвертации текста в формат, понятный Bitrix24 таймлайну
  private toTimelineText(text: string): string {
    if (!text) return "";
    
    // 1) Превращаем ЛИТЕРАЛЫ "\n" в настоящий перенос
    let processed = text
      .replace(/\\r\\n/g, '\n')  // Windows-style переносы
      .replace(/\\n/g, '\n')     // Unix-style переносы
      .replace(/\r\n/g, '\n');   // Нормализуем все в \n
    
    // 2) Конвертируем реальные переносы в HTML (Bitrix24 понимает <br>)
    processed = processed.replace(/\n/g, '<br>');
    
    // 3) Экранируем для JSON (но НЕ трогаем <br>)
    processed = processed
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    
    return processed;
  }

  // Альтернативный хелпер - просто отправляем \n как есть
  private toTimelineTextSimple(text: string): string {
    if (!text) return "";
    
    // Просто экранируем для JSON, оставляя \n как есть
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
  }

  async findContactByPhone(phone: string): Promise<any> {
    const maxRetries = 5;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
    try {
      const result = await this.makeRequest('crm.contact.list.json', {
        filter: { PHONE: phone },
        select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE']
      });
      
        if (result.result && result.result.length > 0) {
          return result.result[0];
        } else {
          return null;
        }
      } catch (error: any) {
        // Проверяем на ошибку QUERY_LIMIT_EXCEEDED
        if (error.message && error.message.includes('QUERY_LIMIT_EXCEEDED')) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 20000)); // Пауза 20 секунд
            continue;
          } else {
      return null;
          }
        } else {
          // Если ошибка другая, выбрасываем исключение
          throw error;
        }
      }
    }
    
    return null;
  }

  async createContact(userData: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    role?: string;
  }): Promise<any> {
    const fields = {
      NAME: this.escapeJsonString(userData.firstName || ''),
      LAST_NAME: this.escapeJsonString(userData.lastName || ''),
      EMAIL: [{ VALUE: this.escapeJsonString(userData.email), VALUE_TYPE: 'WORK' }],
      PHONE: [{ VALUE: this.escapeJsonString(userData.phone || ''), VALUE_TYPE: 'WORK' }],
      UF_CRM_1758876705038: this.escapeJsonString(userData.role || 'Пользователь'),
      SOURCE_ID: 'UC_QP7UNJ'
    };

    const result = await this.makeRequest('crm.contact.add.json', { fields });
    
    return result.result;
  }

  async linkContactToCompany(contactId: string, companyId: string): Promise<any> {
    try {
      const result = await this.makeRequest('crm.contact.company.add', {
        id: parseInt(contactId),
        fields: {
          COMPANY_ID: parseInt(companyId),
          IS_PRIMARY: "Y",
          SORT: 1000
        }
      });
      
      if (result.result === true) {
        return { success: true, contactId, companyId };
      } else {
        return { success: false, error: 'Failed to link contact to company' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSmartProcessTypes(): Promise<any> {
    try {
      const result = await this.makeRequest('crm.type.list', {});
      
      if (result.result) {
        return result.result;
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    }
  }

  async getSmartProcessFields(entityTypeId: number): Promise<any> {
    try {
      const result = await this.makeRequest('crm.item.fields', {
        entityTypeId: entityTypeId
      });
      
      if (result.result) {
        return result.result;
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    }
  }

  async createSmartProcess(processData: {
    title: string;
    contactId?: string;
    companyId?: string;
    stageId?: string;
    message?: string;
  }): Promise<any> {
    try {
      const fields: any = {
        title: this.escapeJsonString(processData.title)
      };

      // Привязываем контакт, если указан
      if (processData.contactId) {
        fields.contactId = parseInt(processData.contactId);
      }

      // Привязываем компанию, если указана
      if (processData.companyId) {
        fields.companyId = parseInt(processData.companyId);
      }

      // Устанавливаем стадию, если указана
      if (processData.stageId) {
        fields.stageId = processData.stageId;
      }
      
      const result = await this.makeRequest('crm.item.add', {
        entityTypeId: 1038, // Правильный ID смарт-процесса "Поддержка с сайта logistgo.by"
        fields: fields
      });
      
      if (result.result) {
        // Извлекаем ID из результата
        let smartProcessId = result.result;
        if (typeof result.result === 'object' && result.result.item && result.result.item.id) {
          smartProcessId = result.result.item.id;
        } else if (typeof result.result === 'object' && result.result.id) {
          smartProcessId = result.result.id;
        } else if (typeof result.result === 'object' && result.result.ID) {
          smartProcessId = result.result.ID;
        }
        
        // Добавляем комментарий с сообщением, если оно указано
        if (processData.message) {
          try {
            const commentResult = await this.addCommentToSmartProcess(smartProcessId.toString(), processData.message);
          } catch (commentError: any) {
            // Игнорируем ошибки комментариев
          }
        }
        
        return { success: true, id: smartProcessId, item: result.result.item ?? result.result };
      } else {
        return { success: false, error: 'Failed to create smart process' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addCommentToSmartProcess(itemId: string, message: string, userData?: { firstName?: string; lastName?: string; email?: string }): Promise<any> {
    try {
      
      // Проверяем, что itemId является валидным числом
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        console.error(`❌ [BITRIX24] Invalid itemId: ${itemId} (not a number)`);
        return { success: false, error: `Invalid itemId: ${itemId}` };
      }
      
      // Сначала проверяем существование элемента через crm.item.get
      try {
        const checkResult = await this.makeRequest('crm.item.get', {
          entityTypeId: 1038,
          id: numericId
        });
        
        if (!checkResult.result) {
          console.error(`❌ [BITRIX24] Smart process item not found with ID: ${numericId}`);
          return { success: false, error: `Smart process item not found with ID: ${numericId}` };
        }
        
      } catch (checkError: any) {
        console.error(`❌ [BITRIX24] Error checking smart process item:`, checkError.message);
        return { success: false, error: `Failed to verify smart process item: ${checkError.message}` };
      }
      
      // Формируем сообщение с ссылкой на пользователя
      let finalMessage = message;
      if (userData && (userData.firstName || userData.lastName || userData.email)) {
        const userName = userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.firstName || userData.lastName || userData.email || 'Пользователь';
        
        // Создаем ссылку на пользователя в формате Bitrix24
        const userLink = `[USER=${userData.email || 'user@example.com'}]${userName}[/USER]`;
        finalMessage = `${userLink}:\n${message}`;
      }
      
      // Теперь добавляем комментарий в таймлайн с правильным форматом
      try {
        
        // Обрабатываем сообщение для корректного отображения в Bitrix24 таймлайне
        // Попробуем простой подход - отправляем \n как есть
        const processedMessage = this.toTimelineTextSimple(finalMessage);
        
        const result = await this.makeRequest('crm.timeline.comment.add', {
          fields: {
            ENTITY_TYPE: "DYNAMIC_1038",  // Правильный формат: строка DYNAMIC_<entityTypeId>
            ENTITY_ID: numericId,         // ID элемента
            COMMENT: processedMessage      // Уже обработанный текст с BBCode
          }
        });
        
        if (result.result) {
          return { success: true, id: result.result };
        } else {
        }
      } catch (timelineError: any) {
      }
      
      // Если не получилось в ленту, пишем в поля карточки как fallback
      try {
        // Для полей карточки используем обычные переводы строк (не BBCode)
        const processedMessage = finalMessage
          .replace(/\\n/g, '\n')  // Заменяем экранированные \n на реальные переводы строк
          .replace(/\\r/g, '\r')  // Заменяем экранированные \r на реальные возвраты каретки
          .replace(/\\t/g, '\t')  // Заменяем экранированные \t на реальные табуляции
          .replace(/\\\\/g, '\\'); // Заменяем двойные слеши на одинарные
        
        const bothFieldsResult = await this.makeRequest('crm.item.update', {
          entityTypeId: 1038,
          id: numericId,
          fields: {
            COMMENTS: this.escapeJsonString(processedMessage),
            DESCRIPTION: this.escapeJsonString(processedMessage)
          }
        });
        if (bothFieldsResult.result) {
          return { success: true, id: bothFieldsResult.result };
        }
      } catch (bothErr: any) {
        console.error('❌ [BITRIX24] Update with both fields failed, trying individually...', bothErr);
        // Пытаемся по одному полю
        try {
          const processedMessage = finalMessage
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
            
          const updateComments = await this.makeRequest('crm.item.update', {
            entityTypeId: 1038,
            id: numericId,
            fields: { COMMENTS: this.escapeJsonString(processedMessage) }
          });
          if (updateComments.result) {
            return { success: true, id: updateComments.result };
          }
        } catch (cErr: any) {
          console.error('❌ [BITRIX24] Update COMMENTS only failed:', cErr);
        }
        try {
          const processedMessage = finalMessage
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
            
          const updateDescription = await this.makeRequest('crm.item.update', {
            entityTypeId: 1038,
            id: numericId,
            fields: { DESCRIPTION: this.escapeJsonString(processedMessage) }
          });
          if (updateDescription.result) {
            return { success: true, id: updateDescription.result };
          }
        } catch (dErr: any) {
          console.error('❌ [BITRIX24] Update DESCRIPTION only failed:', dErr);
        }
      }
      
      return { success: false, error: 'All comment methods failed' };
    } catch (error: any) {
      console.error('❌ [BITRIX24] Error adding comment to smart process:', error);
      console.error('❌ [BITRIX24] Error details:', error.message);
      return { success: false, error: error.message };
    }
  }

  async findCompanyByUnp(unp: string): Promise<any> {
    try {
      
      // Ищем только по RQ_INN (как в рабочем примере)
      const result = await this.makeRequest('crm.requisite.list.json', {
        filter: { RQ_INN: unp, ENTITY_TYPE_ID: "4" },
        select: ['ENTITY_ID']
      });

      if (result.result && result.result.length > 0) {
        const row = result.result[0];
        return {
          id: row.ENTITY_ID,
          title: 'Found Company'
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ [BITRIX24] Error finding company by UNP:', error);
      return null;
    }
  }

  async getCompanyById(companyId: string): Promise<any> {
    try {
      const result = await this.makeRequest('crm.company.get.json', {
        id: companyId
      });
      
      return result.result;
    } catch (error) {
      return null;
    }
  }

  async getCompanyFields(): Promise<any> {
    try {
      const result = await this.makeRequest('crm.company.fields.json');
      return result.result;
    } catch (error) {
      return null;
    }
  }

  // Отправка исходящего вебхука в Bitrix24
  async sendOutgoingWebhook(data: any): Promise<any> {
    try {
      
      const webhookToken = process.env.BITRIX24_WEBHOOK_TOKEN;
      if (!webhookToken) {
        console.error('❌ [BITRIX24 SERVICE] BITRIX24_WEBHOOK_TOKEN not configured');
        return { success: false, error: 'Webhook token not configured' };
      }
      
      const webhookUrl = `${this.baseUrl}?token=${webhookToken}`;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, result };
    } catch (error: any) {
      console.error('❌ [BITRIX24 SERVICE] Error sending outgoing webhook:', error);
      return { success: false, error: error.message };
    }
  }

  async createCompany(companyData: {
    name: string;
    unp: string;
    phone?: string;
    address?: string;
    companyType?: string;
    email?: string;
  }): Promise<any> {
    // Очищаем название компании
    const cleanedName = this.cleanCompanyName(companyData.name);
    
    const fields = {
      TITLE: cleanedName, // Не экранируем название компании
      COMPANY_TYPE: "UC_BHV35W", // Фиксированный тип компании
      PHONE: companyData.phone ? [{ VALUE: this.escapeJsonString(companyData.phone), VALUE_TYPE: 'WORK' }] : [],
      EMAIL: companyData.email ? [{ VALUE: this.escapeJsonString(companyData.email), VALUE_TYPE: 'WORK' }] : [],
      OPENED: "Y",
      ASSIGNED_BY_ID: 1,
      // Добавляем стандартные поля для адреса
      ...(companyData.address && { ADDRESS: companyData.address }), // Используем стандартное поле ADDRESS для адреса
      INDUSTRY: "UC_GY527B", // Сфера деятельности (как в примере)
      // Добавляем кастомное поле для экспедитора
      UF_CRM_1758877328990: companyData.companyType || ''
    };

    try {
    const result = await this.makeRequest('crm.company.add.json', { fields });
      
      // Проверяем, что результат содержит ID созданной компании
      let companyId = null;
      if (result.result && typeof result.result === 'number') {
        companyId = result.result;
      } else if (result.result && result.result.id) {
        companyId = result.result.id;
      } else {
        return null;
      }

      return { id: companyId, title: cleanedName };
    } catch (error: any) {
      throw error;
    }
  }

  // Используем фиксированный PRESET_ID = 1 (как в рабочем примере)
  private getCompanyRequisitePresetId(): string {
    return "1";
  }

  async createCompanyRequisite(companyId: string, requisiteData: {
    RQ_COMPANY_NAME: string;
    RQ_INN?: string;
    RQ_UNP?: string;
  }): Promise<any> {
    try {
      const PRESET_ID = this.getCompanyRequisitePresetId();

      // Используем form-data подход как в рабочем примере
      const formData = new URLSearchParams();
      formData.append('fields[ENTITY_TYPE_ID]', '4');
      formData.append('fields[ENTITY_ID]', companyId);
      formData.append('fields[PRESET_ID]', PRESET_ID);
      formData.append('fields[NAME]', 'Основные реквизиты');
      formData.append('fields[RQ_COMPANY_NAME]', requisiteData.RQ_COMPANY_NAME || '');
      if (requisiteData.RQ_INN) {
        formData.append('fields[RQ_INN]', requisiteData.RQ_INN);
      }
      if (requisiteData.RQ_UNP) {
        formData.append('fields[RQ_UNP]', requisiteData.RQ_UNP);
      }

      // Используем form-data запрос
      const result = await this.makeFormRequest('crm.requisite.add.json', formData);
      
      if (result.result) {
    return result.result;
      }
      return null;
    } catch (error: any) {
      throw error;
    }
  }
}

// Функция для изменения стадии смарт-процесса
export async function updateSmartProcessStage(smartProcessId: string, stageId: string = 'DT1038_11:NEW') {
  try {
    
    const bitrix24Service = new Bitrix24Service();
    
    const payload = {
      entityTypeId: 1038,
      id: smartProcessId,
      fields: {
        categoryId: 11,
        stageId: stageId
      }
    };
    
    const response = await bitrix24Service['makeRequest']('crm.item.update.json', payload);
    
    if (response.result) {
      return { success: true, stageId: stageId };
    } else {
      return { success: false, error: response.error };
    }
  } catch (error: any) {
    console.error('❌ [BITRIX24 SERVICE] Error updating smart process stage:', error);
    return { success: false, error: error.message };
  }
}

// Функция для добавления комментария к существующему смарт-процессу
export async function addCommentToExistingSmartProcess(smartProcessId: string, message: string, userData?: { firstName?: string; lastName?: string; email?: string }) {
  try {
    
    const bitrix24Service = new Bitrix24Service();
    
    // Добавляем комментарий к существующему смарт-процессу
    const commentResult = await bitrix24Service.addCommentToSmartProcess(smartProcessId, message, userData);
    
    if (commentResult.success) {
      return { success: true, commentId: commentResult.id };
    } else {
      return { success: false, error: commentResult.error };
    }
  } catch (error: any) {
    console.error('❌ [BITRIX24 SERVICE] Error adding comment to smart process:', error);
    return { success: false, error: error.message };
  }
}

export async function createSupportRequestService(dto: SupportRequestDto, companyData: any, userData?: any) {
  try {
    
    // Сначала проверяем, есть ли уже открытый тикет с такой же темой
    if (userData?.id_user) {
      const existingTicket = await findExistingTicket(userData.id_user, dto.subject);
      
      if (existingTicket) {
        
        // Добавляем комментарий к существующему тикету в БД
        const dbResult = await addCommentToTicket(
          existingTicket.id_ticket, 
          dto.message, 
          `${userData.firstName} ${userData.lastName}`
        );
        
        if (dbResult.success && existingTicket.bitrix24_ticket_id) {
          // Добавляем комментарий к смарт-процессу в Bitrix24 с данными пользователя
          const bitrixResult = await addCommentToExistingSmartProcess(
            existingTicket.bitrix24_ticket_id, 
            dto.message,
            {
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email
            }
          );
          
          return {
            ok: true as const,
            status: 200,
            message: 'Комментарий добавлен к существующему тикету',
            isExistingTicket: true,
            ticketId: existingTicket.id_ticket,
            bitrix24TicketId: existingTicket.bitrix24_ticket_id,
            commentAdded: bitrixResult.success
          };
        } else {
          console.error('❌ [BITRIX24 SERVICE] Failed to add comment to existing ticket');
          return { ok: false as const, status: 500, error: 'Ошибка добавления комментария' };
        }
      }
    }
    
    const bitrix24Service = new Bitrix24Service();
    
    let bitrixCompany = null;
    let bitrixContact = null;
    
    // 1. Ищем или создаем контакт в Bitrix24
    const userPhone = userData?.phone || '+375111111111';
    
    try {
      // Сначала ищем существующий контакт по телефону
      bitrixContact = await bitrix24Service.findContactByPhone(userPhone);
      
      if (!bitrixContact) {
        bitrixContact = await bitrix24Service.createContact({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: userData?.email || 'user@example.com',
          phone: userPhone,
          role: 'Пользователь'
        });
        
        // Если result.result это просто число (ID), создаем объект с ID
        if (typeof bitrixContact === 'number') {
          bitrixContact = { ID: bitrixContact.toString() };
        }
      }
    } catch (error: any) {
      // Игнорируем ошибки контактов
    }
    
    // 2. Ищем компанию по УНП (только если есть данные компании)
    if (companyData && companyData.unp) {
      try {
        bitrixCompany = await bitrix24Service.findCompanyByUnp(companyData.unp);
      } catch (error: any) {
        // Игнорируем ошибки поиска
      }
    }
    
    // 3. Если компания не найдена, создаем ее (только если есть данные компании)
    if (!bitrixCompany && companyData && companyData.unp) {
      try {
        bitrixCompany = await bitrix24Service.createCompany({
          name: companyData.name_company,
          unp: companyData.unp,
          phone: companyData.tel_1,
          address: companyData.ur_address,
          email: companyData.email,
          companyType: companyData.tip_company_name || 'Предприятие'
        });
        
        if (bitrixCompany && bitrixCompany.id && companyData.unp) {
          try {
            await bitrix24Service.createCompanyRequisite(bitrixCompany.id, {
              RQ_COMPANY_NAME: companyData.name_company,
              RQ_UNP: companyData.unp,
              RQ_INN: companyData.unp
            });
          } catch (error: any) {
            // Игнорируем ошибки реквизитов
          }
        }
      } catch (error: any) {
        // Игнорируем ошибки создания компании
      }
    }
    
    // 4. Привязываем контакт к компании (если оба существуют)
    if (bitrixContact && bitrixCompany) {
      try {
        const contactId = bitrixContact.ID || bitrixContact.id;
        const companyId = bitrixCompany.ID || bitrixCompany.id;
        
        if (contactId && companyId) {
          await bitrix24Service.linkContactToCompany(contactId, companyId);
        }
      } catch (error: any) {
        // Игнорируем ошибки связывания
      }
    }
    
    // 5. Создаем смарт-процесс (если есть контакт, компания опциональна)
    let smartProcess = null;
    if (bitrixContact) {
      try {
        const contactId = bitrixContact.ID || bitrixContact.id;
        const companyId = bitrixCompany ? (bitrixCompany.ID || bitrixCompany.id) : null;
        
        if (contactId) {
          const processTitle = `Запрос в поддержку: ${dto.subject}`;
          
          // Формируем сообщение с ссылкой на пользователя
          let messageWithUser = dto.message;
          if (userData && (userData.firstName || userData.lastName || userData.email)) {
            const userName = userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : userData.firstName || userData.lastName || userData.email || 'Пользователь';
            
            // Создаем ссылку на пользователя в формате Bitrix24
            const userLink = `[USER=${userData.email || 'user@example.com'}]${userName}[/USER]`;
            messageWithUser = `${userLink}:\n${dto.message}`;
          }
          
          smartProcess = await bitrix24Service.createSmartProcess({
            title: processTitle,
            contactId: contactId,
            companyId: companyId, // Может быть null
            message: messageWithUser
          });
        }
      } catch (error: any) {
        // Игнорируем ошибки создания смарт-процесса
      }
    }
    
    // 6. Создаем запись в БД с данными о Bitrix24
    let dbTicket = null;
    try {
      const contactId = bitrixContact?.ID || bitrixContact?.id;
      const companyId = bitrixCompany?.ID || bitrixCompany?.id;
      const smartProcessId = smartProcess?.id;
      
      if (!userData?.id_user) {
        console.error('❌ [BITRIX24 SERVICE] No user ID provided, cannot create DB ticket');
      } else {
        dbTicket = await createSupportTicketInDB({
          id_user: userData.id_user,
          id_company: companyData?.id_company,
          subject: dto.subject,
          message: dto.message,
          bitrix24_contact_id: contactId,
          bitrix24_company_id: companyId,
          bitrix24_smart_process_id: smartProcessId
        });
        
      }
    } catch (error: any) {
      console.error('❌ [BITRIX24 SERVICE] Error creating DB ticket:', error);
    }
    
    // 7. Создаем тикет в Bitrix24 (legacy)
    const result = await createSupportTicket();
    
    if (result.success) {
      return { 
        ok: true as const, 
        status: 200, 
        message: 'Запрос в поддержку отправлен успешно',
        contact: bitrixContact,
        company: bitrixCompany,
        smartProcess: smartProcess,
        dbTicket: dbTicket
      };
    } else {
      return { ok: false as const, status: 500, error: 'Ошибка при отправке запроса в поддержку' };
    }
  } catch (error: any) {
    return { ok: false as const, status: 500, error: 'Внутренняя ошибка сервера' };
  }
}
