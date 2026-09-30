// apps/backend/src/lib/unp-autofill.service.ts
// Общий сервис для автозаполнения данных компании по УНП

export interface UnpAutofillData {
  name_company?: string;
  entity_type?: 'ИП' | 'Предприятие';
  ur_address?: string | null;
  vkods?: string;
  // Дополнительные поля для CRM
  phone?: string;
  email?: string;
  site?: string;
}

/**
 * Получить данные компании по УНП из налоговой или DaData
 * @param unp - УНП для поиска
 * @returns Данные компании или null если не найдено
 */
export async function getCompanyInfoByUnp(unp: string): Promise<UnpAutofillData | null> {
  const clean = (v: unknown) =>
    (typeof v === 'string' ? v.replace(/\\/g, '').trim() : v === null ? null : String(v ?? '').replace(/\\/g, '').trim());

  // 1. Сначала пробуем запросить данные из налоговой
  const grpUrl = `http://grp.nalog.gov.by/api/grp-public/data?unp=${encodeURIComponent(unp)}&charset=UTF-8&type=json`;
  
  try {
    const grpResp = await fetch(grpUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 секунд таймаут
    });
    
    if (grpResp.ok) {
      const grpData = await grpResp.json().catch(() => null) as any;
      const row = grpData?.row;
      if (row) {
        const vnaimp = clean(row.vnaimp) as string;
        const vpadresRaw = clean(row.vpadres);
        const vkods = clean(row.vkods) as string;
        const tel = clean(row.vtel) as string | null;
        const email = clean(row.vemail) as string | null;
        const site = clean(row.vsite) as string | null;

        const hasAddress = !!(vpadresRaw && vpadresRaw.length > 0);
        const entity_type = hasAddress ? 'Предприятие' : 'ИП';
        const ur_address = hasAddress ? vpadresRaw : null;

        return {
          name_company: vnaimp,
          entity_type,
          ur_address,
          vkods,
          phone: tel || undefined,
          email: email || undefined,
          site: site || undefined,
        };
      }
      // Если ответ успешный, но row нет — компания не найдена
      return null;
    }
  } catch (grpErr: any) {
    // Если налоговая недоступна, пробуем DaData
    console.warn('⚠️ [UNP AUTOFILL] Налоговая недоступна, пробуем DaData:', grpErr?.message);
  }

  // 2. Если налоговая недоступна или не вернула данные, пробуем DaData
  try {
    const dadataUrl = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party_by';
    const dadataToken = process.env['DADATA_TOKEN'];
    
    if (!dadataToken) {
      console.warn('⚠️ [UNP AUTOFILL] DADATA_TOKEN не настроен');
      return null;
    }
    
    const dadataResp = await fetch(dadataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${dadataToken}`
      },
      body: JSON.stringify({ query: unp }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (dadataResp.ok) {
      const dadataData = await dadataResp.json().catch(() => null) as any;
      const suggestions = dadataData?.suggestions;
      if (suggestions && suggestions.length > 0) {
        const companyData = suggestions[0].data;
        
        const name_company = clean(companyData.full_name_ru) as string;
        const address = clean(companyData.address);
        const status = companyData.status;
        const phones = companyData.phones;
        const emails = companyData.emails;
        const site = companyData.ogrn;
        
        const hasAddress = !!(address && address.length > 0);
        const entity_type = hasAddress ? 'Предприятие' : 'ИП';
        const ur_address = hasAddress ? address : null;
        const vkods = status === 'ACTIVE' ? 'Действующий' : status;
        
        // Извлекаем первый телефон и email
        const phone = phones && phones.length > 0 ? clean(phones[0].value) as string : undefined;
        const email = emails && emails.length > 0 ? clean(emails[0].value) as string : undefined;

        return {
          name_company,
          entity_type,
          ur_address,
          vkods,
          phone,
          email,
          site: site || undefined,
        };
      }
      // Если DaData вернул успешный ответ, но нет suggestions - компания не найдена
      return null;
    }
  } catch (dadataErr: any) {
    console.error('❌ [UNP AUTOFILL] Ошибка при запросе к DaData:', dadataErr);
  }

  // Если ни один сервис не вернул данные
  return null;
}

/**
 * Проверка существования компании по УНП
 * @param unp - УНП для проверки
 * @returns true если компания найдена, false если не найдена
 */
export async function validateUnpExists(unp: string): Promise<boolean> {
  const data = await getCompanyInfoByUnp(unp);
  return data !== null;
}

