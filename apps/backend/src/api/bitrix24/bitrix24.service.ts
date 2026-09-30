import { SupportRequestDto } from './bitrix24.schema';
import { createSupportTicket } from './bitrix24.repository';

export class Bitrix24Service {
  private baseUrl: string;
  
  // Функция для очистки названия компании от лишних символов
  private cleanCompanyName(name: string): string {
    if (!name) return '';
    
    // Убираем экранированные символы
    let cleaned = name
      .replace(/\\"/g, '"')  // Убираем экранированные кавычки \"
      .replace(/\\/g, '')    // Убираем оставшиеся обратные слеши
      .trim();
    
    console.log('🔍 [BITRIX24 SERVICE] Cleaning company name:');
    console.log('🔍 [BITRIX24 SERVICE] Original:', name);
    console.log('🔍 [BITRIX24 SERVICE] After cleaning:', cleaned);
    
    return cleaned;
  }
  private retryAttempts = 5;
  private retryDelay = 20000; // 20 секунд

  constructor() {
    this.baseUrl = process.env.BITRIX24_URL || 'https://integro.bitrix24.by/rest/1/REDACTED_SECRET/';
  }

  private async makeFormRequest(endpoint: string, formData: URLSearchParams): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔍 [BITRIX24] Making form request to:', url);
    
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
        console.log(`🔍 [BITRIX24] Making request to: ${url}`);
        console.log(`🔍 [BITRIX24] Request data:`, data);

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
        console.log(`✅ [BITRIX24] Response:`, result);

        if (result.error) {
          if (result.error === 'QUERY_LIMIT_EXCEEDED' && attempt < this.retryAttempts) {
            console.log(`⏳ [BITRIX24] Rate limit exceeded, waiting ${this.retryDelay}ms before retry ${attempt + 1}/${this.retryAttempts}`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            continue;
          }
          throw new Error(result.error_description || result.error);
        }

        return result;
      } catch (error: any) {
        console.error(`❌ [BITRIX24] Attempt ${attempt}/${this.retryAttempts} failed:`, error.message);
        
        if (attempt === this.retryAttempts) {
          throw error;
        }

        if (error.message.includes('QUERY_LIMIT_EXCEEDED') || error.message.includes('timeout')) {
          console.log(`⏳ [BITRIX24] Waiting ${this.retryDelay}ms before retry ${attempt + 1}/${this.retryAttempts}`);
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

  async findContactByPhone(phone: string): Promise<any> {
    try {
      const result = await this.makeRequest('crm.contact.list.json', {
        filter: { PHONE: phone },
        select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE']
      });
      
      return result.result && result.result.length > 0 ? result.result[0] : null;
    } catch (error) {
      console.error('❌ [BITRIX24] Error finding contact by phone:', error);
      return null;
    }
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

  async findCompanyByUnp(unp: string): Promise<any> {
    try {
      console.log('🔍 [BITRIX24] Searching for company by UNP using requisites:', unp);
      
      // Ищем только по RQ_INN (как в рабочем примере)
      const result = await this.makeRequest('crm.requisite.list.json', {
        filter: { RQ_INN: unp, ENTITY_TYPE_ID: "4" },
        select: ['ENTITY_ID']
      });

      console.log('🔍 [BITRIX24] Search result:', result);

      if (result.result && result.result.length > 0) {
        const row = result.result[0];
        console.log('✅ [BITRIX24] Company found with ENTITY_ID:', row.ENTITY_ID);
        return {
          id: row.ENTITY_ID,
          title: 'Found Company'
        };
      }

      console.log('❌ [BITRIX24] No company found with UNP:', unp);
      return null;
    } catch (error: any) {
      console.error('❌ [BITRIX24] Error finding company by UNP:', error);
      return null;
    }
  }

  async getCompanyById(companyId: string): Promise<any> {
    try {
      console.log('🔍 [BITRIX24] Getting company by ID:', companyId);
      const result = await this.makeRequest('crm.company.get.json', {
        id: companyId
      });
      
      console.log('🔍 [BITRIX24] Company get response:', result);
      return result.result;
    } catch (error) {
      console.error('❌ [BITRIX24] Error getting company by ID:', error);
      return null;
    }
  }

  async getCompanyFields(): Promise<any> {
    try {
      console.log('🔍 [BITRIX24] Getting company fields...');
      const result = await this.makeRequest('crm.company.fields.json');
      
      console.log('🔍 [BITRIX24] Company fields response:', result);
      console.log('🔍 [BITRIX24] All available fields:');
      
      if (result.result) {
        // Выводим все поля с их типами и описаниями
        Object.keys(result.result).forEach(fieldKey => {
          const field = result.result[fieldKey];
          console.log(`🔍 [BITRIX24] Field: ${fieldKey}`);
          console.log(`   - Type: ${field.type}`);
          console.log(`   - Title: ${field.title}`);
          console.log(`   - Required: ${field.isRequired}`);
          if (field.items) {
            console.log(`   - Items: ${JSON.stringify(field.items)}`);
          }
          console.log('---');
        });
        
        // Ищем поля, связанные с УНП/ИНН
        console.log('🔍 [BITRIX24] Searching for UNP/INN related fields:');
        Object.keys(result.result).forEach(fieldKey => {
          const field = result.result[fieldKey];
          if (fieldKey.toLowerCase().includes('unp') || 
              fieldKey.toLowerCase().includes('inn') || 
              fieldKey.toLowerCase().includes('tax') ||
              fieldKey.toLowerCase().includes('reg') ||
              (field.title && field.title.toLowerCase().includes('унп')) ||
              (field.title && field.title.toLowerCase().includes('инн'))) {
            console.log(`🎯 [BITRIX24] Found UNP/INN field: ${fieldKey}`);
            console.log(`   - Type: ${field.type}`);
            console.log(`   - Title: ${field.title}`);
            console.log(`   - Required: ${field.isRequired}`);
          }
        });
      }
      
      return result.result;
    } catch (error) {
      console.error('❌ [BITRIX24] Error getting company fields:', error);
      return null;
    }
  }


  async createCompany(companyData: {
    name: string;
    unp: string;
    phone?: string;
    address?: string;
    company_type?: string;
    tip_company_name?: string;
    email?: string;
  }): Promise<any> {
    console.log('🔍 [BITRIX24 SERVICE] createCompany called with data:', companyData);
    
    // Очищаем название компании
    const cleanedName = this.cleanCompanyName(companyData.name);
    console.log('🔍 [BITRIX24 SERVICE] Original name:', companyData.name);
    console.log('🔍 [BITRIX24 SERVICE] Cleaned name:', cleanedName);
    
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
      UF_CRM_1758877328990: companyData.tip_company_name || ''
    };

    console.log('🔍 [BITRIX24 SERVICE] Fields for company creation:', fields);
    console.log('🔍 [BITRIX24 SERVICE] Company data tip_company_name:', companyData.tip_company_name);
    console.log('🔍 [BITRIX24 SERVICE] UF_CRM_1758877328990 value:', companyData.tip_company_name);
    console.log('🔍 [BITRIX24 SERVICE] Calling crm.company.add.json...');

    try {
      const result = await this.makeRequest('crm.company.add.json', { fields });
      console.log('🔍 [BITRIX24 SERVICE] crm.company.add.json response:', result);
      console.log('🔍 [BITRIX24 SERVICE] Result type:', typeof result);
      console.log('🔍 [BITRIX24 SERVICE] Result.result:', result.result);
      console.log('🔍 [BITRIX24 SERVICE] Result.result type:', typeof result.result);
      
      // Проверяем, что результат содержит ID созданной компании
      let companyId = null;
      if (result.result && typeof result.result === 'number') {
        companyId = result.result;
        console.log('✅ [BITRIX24 SERVICE] Company created successfully with ID:', companyId);
      } else if (result.result && result.result.id) {
        companyId = result.result.id;
        console.log('✅ [BITRIX24 SERVICE] Company created successfully with ID:', companyId);
      } else {
        console.log('❌ [BITRIX24 SERVICE] Unexpected result format:', result);
        return null;
      }

      return { id: companyId, title: cleanedName };
    } catch (error: any) {
      console.error('❌ [BITRIX24 SERVICE] Error in createCompany:', error);
      console.error('❌ [BITRIX24 SERVICE] Error details:', error.message);
      console.error('❌ [BITRIX24 SERVICE] Error stack:', error.stack);
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
      console.log('🔍 [BITRIX24] Creating company requisite for company ID:', companyId);
      console.log('🔍 [BITRIX24] Requisite data:', requisiteData);
      
      const PRESET_ID = this.getCompanyRequisitePresetId();
      console.log('🔍 [BITRIX24] Using PRESET_ID:', PRESET_ID);

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

      console.log('🔍 [BITRIX24] Form data for requisite creation:', formData.toString());
      console.log('🔍 [BITRIX24] Calling crm.requisite.add.json...');

      // Используем form-data запрос
      const result = await this.makeFormRequest('crm.requisite.add.json', formData);
      console.log('🔍 [BITRIX24] Requisite creation response:', result);
      
      if (result.result) {
        console.log('✅ [BITRIX24] Requisite created successfully:', result.result);
        return result.result;
      }
      return null;
    } catch (error: any) {
      console.error('❌ [BITRIX24] Error creating company requisite:', error);
      throw error;
    }
  }
}

export async function createSupportRequestService(dto: SupportRequestDto, companyData: any, userData?: any) {
  try {
    console.log('🔍 [BITRIX24 SERVICE] Starting support request creation');
    console.log('🔍 [BITRIX24 SERVICE] DTO:', dto);
    console.log('🔍 [BITRIX24 SERVICE] Company data:', companyData);
    console.log('🔍 [BITRIX24 SERVICE] User data:', userData);
    
    const bitrix24Service = new Bitrix24Service();
    
    // 0. Получаем поля компании для отладки
    try {
      console.log('🔍 [BITRIX24 SERVICE] Getting company fields for debugging...');
      const fields = await bitrix24Service.getCompanyFields();
      console.log('🔍 [BITRIX24 SERVICE] Available company fields:', fields);
    } catch (error) {
      console.log('❌ [BITRIX24 SERVICE] Could not get company fields:', error);
    }
    
    // 1. Проверяем, есть ли компания в Bitrix24 по ID из БД
    console.log('🔍 [BITRIX24 SERVICE] Step 1: Checking company by ID from DB:', companyData.id_company);
    console.log('🔍 [BITRIX24 SERVICE] Company data details:', {
      id_company: companyData.id_company,
      name_company: companyData.name_company,
      unp: companyData.unp,
      tel_1: companyData.tel_1,
      ur_address: companyData.ur_address,
      email: companyData.email,
      tip_company_name: companyData.tip_company_name
    });
    
    let bitrixCompany = null;
    let bitrixContact = null;
    
    // 1. Создаем контакт в Bitrix24
    console.log('🔍 [BITRIX24 SERVICE] Step 1: Creating contact in Bitrix24');
    try {
      console.log('🔍 [BITRIX24 SERVICE] Contact creation data:', {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: userData?.email || 'user@example.com',
        phone: userData?.phone || '+375111111111'
      });
      
      bitrixContact = await bitrix24Service.createContact({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: userData?.email || 'user@example.com',
        phone: userData?.phone || '+375111111111',
        role: 'Пользователь'
      });
      
      console.log('✅ [BITRIX24 SERVICE] Contact created successfully:', bitrixContact);
    } catch (error: any) {
      console.error('❌ [BITRIX24 SERVICE] Error creating contact:', error);
      console.error('❌ [BITRIX24 SERVICE] Error details:', error.message);
      console.error('❌ [BITRIX24 SERVICE] Error stack:', error.stack);
    }
    
    // 2. Сначала пробуем найти компанию по ID из БД (если у нас есть связь)
    // Пока что пропускаем этот шаг, так как у нас нет связи между БД и Bitrix24 ID
    
    // Затем ищем по УНП
    if (companyData.unp) {
      try {
        console.log('🔍 [BITRIX24 SERVICE] Searching for company with UNP:', companyData.unp);
        bitrixCompany = await bitrix24Service.findCompanyByUnp(companyData.unp);
        if (bitrixCompany) {
          console.log('✅ [BITRIX24 SERVICE] Company found in Bitrix24 by UNP:', bitrixCompany);
        } else {
          console.log('❌ [BITRIX24 SERVICE] Company not found in Bitrix24 by UNP');
        }
      } catch (error: any) {
        console.error('❌ [BITRIX24 SERVICE] Error checking company by UNP:', error);
        console.error('❌ [BITRIX24 SERVICE] Error details:', error.message);
        console.error('❌ [BITRIX24 SERVICE] Error stack:', error.stack);
      }
    } else {
      console.log('❌ [BITRIX24 SERVICE] No UNP provided, cannot search for company');
    }
    
    // 3. Если компания не найдена, создаем ее
    if (!bitrixCompany && companyData.unp) {
      console.log('🔍 [BITRIX24 SERVICE] Step 3: Creating company in Bitrix24');
      console.log('🔍 [BITRIX24 SERVICE] Company creation data:', {
        name: companyData.name_company,
        unp: companyData.unp,
        phone: companyData.tel_1,
        address: companyData.ur_address,
        email: companyData.email,
        company_type: companyData.tip_company_name || 'Предприятие'
      });
      
      try {
        console.log('🔍 [BITRIX24 SERVICE] Calling createCompany method...');
        bitrixCompany = await bitrix24Service.createCompany({
          name: companyData.name_company,
          unp: companyData.unp,
          phone: companyData.tel_1,
          address: companyData.ur_address,
          email: companyData.email,
          company_type: companyData.tip_company_name || 'Предприятие'
        });
        
        console.log('🔍 [BITRIX24 SERVICE] createCompany result:', bitrixCompany);
        console.log('🔍 [BITRIX24 SERVICE] createCompany result type:', typeof bitrixCompany);
        console.log('🔍 [BITRIX24 SERVICE] createCompany result is null:', bitrixCompany === null);
        console.log('🔍 [BITRIX24 SERVICE] createCompany result is undefined:', bitrixCompany === undefined);
        
        if (bitrixCompany) {
          console.log('✅ [BITRIX24 SERVICE] Company created successfully:', bitrixCompany);
          
          // Теперь добавляем реквизиты к созданной компании
          if (bitrixCompany.id && companyData.unp) {
            try {
              console.log('🔍 [BITRIX24 SERVICE] Adding requisites to company ID:', bitrixCompany.id);
              const requisiteResult = await bitrix24Service.createCompanyRequisite(bitrixCompany.id, {
                RQ_COMPANY_NAME: companyData.name_company,
                RQ_UNP: companyData.unp,      // <-- ключевой момент
                RQ_INN: companyData.unp       // можно дублировать, если используете оба поля
              });
              
              if (requisiteResult) {
                console.log('✅ [BITRIX24 SERVICE] Company requisites added successfully:', requisiteResult);
              } else {
                console.log('❌ [BITRIX24 SERVICE] Failed to add company requisites');
              }
            } catch (error: any) {
              console.error('❌ [BITRIX24 SERVICE] Error adding company requisites:', error);
              console.error('❌ [BITRIX24 SERVICE] Error details:', error.message);
              console.error('❌ [BITRIX24 SERVICE] Error stack:', error.stack);
            }
          }
        } else {
          console.log('❌ [BITRIX24 SERVICE] Failed to create company - result is null/undefined');
        }
      } catch (error: any) {
        console.error('❌ [BITRIX24 SERVICE] Error creating company:', error);
        console.error('❌ [BITRIX24 SERVICE] Error details:', error.message);
        console.error('❌ [BITRIX24 SERVICE] Error stack:', error.stack);
      }
    } else if (!companyData.unp) {
      console.log('❌ [BITRIX24 SERVICE] Cannot create company - no UNP provided');
    } else {
      console.log('✅ [BITRIX24 SERVICE] Company already exists, skipping creation');
    }
    
    // 4. Создаем тикет в Bitrix24
    console.log('🔍 [BITRIX24 SERVICE] Step 4: Creating support ticket');
    const result = await createSupportTicket();
    
    if (result.success) {
      return { 
        ok: true as const, 
        status: 200, 
        message: 'Запрос в поддержку отправлен успешно',
        contact: bitrixContact,
        company: bitrixCompany
      };
    } else {
      return { ok: false as const, status: 500, error: 'Ошибка при отправке запроса в поддержку' };
    }
  } catch (error: any) {
    console.error('Error in createSupportRequestService:', error);
    return { ok: false as const, status: 500, error: 'Внутренняя ошибка сервера' };
  }
}
