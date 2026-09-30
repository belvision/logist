import { SupportRequestSchema, sanitizeSupportRequestDto } from './bitrix24.schema';
import { createSupportRequestService } from './bitrix24.service';
import db from '../../db/client';
import { company, tip_company } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function createSupportRequestHandler(c: any) {
  const auth = c.get('user') as any;
  const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
  if (!userId) return c.json({ error: 'Требуется авторизация' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const parsed = SupportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ 
      error: 'Ошибка валидации', 
      details: parsed.error.flatten() 
    }, 400);
  }

  const dto = sanitizeSupportRequestDto(parsed.data);
  
  try {
    // Получаем данные компании из БД по ID
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

    const companyData = companyResult[0];
    console.log('🔍 [BITRIX24 CONTROLLER] Company data:', companyData);
    console.log('🔍 [BITRIX24 CONTROLLER] tip_company_name from DB:', companyData.tip_company_name);
    console.log('🔍 [BITRIX24 CONTROLLER] id_tip_company from DB:', companyData.id_tip_company);

    // Подготавливаем данные пользователя
    const userData = {
      firstName: auth.firstName,
      lastName: auth.lastName,
      email: auth.email,
      phone: auth.phone
    };
    console.log('🔍 [BITRIX24 CONTROLLER] User data:', userData);

    // Создаем запрос поддержки с данными компании и пользователя
    const res = await createSupportRequestService(dto, companyData, userData);
    
    return c.json(res.ok ? { 
      success: true, 
      message: res.message,
      contact: res.contact,
      company: res.company
    } : { error: res.error }, res.status);
  } catch (error) {
    console.error('❌ [BITRIX24 CONTROLLER] Error:', error);
    return c.json({ error: 'Ошибка создания запроса поддержки' }, 500);
  }
}
