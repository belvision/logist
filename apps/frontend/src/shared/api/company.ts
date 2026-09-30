import { clientAuth } from ".";
import { handleApiError } from "@/lib/toast";

export const getCompanies = async () => {
  try {
    const res = await clientAuth.company.$get();
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки компаний');
    throw error;
  }
};

export const createCompany = async (company: {
  name_company: string;
  unp: string;
  entity_type: 'ИП' | 'Предприятие';
  ur_address: string;
  tel_1: string;
  tel_2: string | null;
  email: string | null;
  id_tip_company: number;
}) => {  
  try {
    const res = await clientAuth.company.$post({
      json: company
    });
    return await res.json();
  } catch (error: any) {
    // Если это ошибка с кодом, пробрасываем её как есть для специальной обработки
    if (error?.response?.status === 409 && error?.response?.data?.code) {
      throw {
        code: error.response.data.code,
        error: error.response.data.error,
        message: error.response.data.error
      };
    }
    handleApiError(error, 'Ошибка создания компании');
    throw error;
  }
};

export const getCompanyTypes = async () => {
  try {
    const res = await clientAuth.company.type.$get();
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки типов компаний');
    throw error;
  }
};

export const companyInfoByUnp = async (unp: string) => {
  try {
    const res = await clientAuth.company.grp.$get({
      query: { unp }
    });
    
    // Проверяем статус ответа
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.log('API Error Response:', { status: res.status, data: errorData });
      
      if (res.status === 404 && errorData?.code === 'NO_COMPANY_BY_UNP') {
        throw { code: 'NO_COMPANY_BY_UNP', message: errorData.message || 'С таким УНП нет зарегистрированной компании' };
      }
      if (res.status === 502 && errorData?.code === 'SERVICES_UNAVAILABLE') {
        throw { code: 'SERVICES_UNAVAILABLE', message: errorData.message || 'Сервисы поиска компаний недоступны. Попробуйте позже.' };
      }
      
      throw new Error(`HTTP ${res.status}: ${errorData.error || 'Ошибка сервера'}`);
    }
    
    return await res.json();
  } catch (error: any) {
    console.log('companyInfoByUnp error:', error);
    
    // Если это уже наша нормализованная ошибка, пробрасываем как есть
    if (error?.code === 'NO_COMPANY_BY_UNP' || error?.code === 'SERVICES_UNAVAILABLE') {
      throw error;
    }
    
    handleApiError(error, 'Ошибка получения информации о компании по УНП');
    throw error;
  }
};

export const addUserToCompany = async (companyId: string, request: { email: string; role: string }) => {
  try {
    const res = await clientAuth.company[companyId].users.$post({
      json: request
    });
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка добавления пользователя в компанию');
    throw error;
  }
};

export const inviteUserToCompany = async (companyId: string, request: { email: string; role: string; message?: string }) => {
  try {
    const res = await clientAuth.company[companyId].invite.$post({
      json: request
    });
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка отправки приглашения');
    throw error;
  }
};

export const getCompanyUsers = async (companyId: string, filters?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  try {
    // Подготавливаем query параметры для Hono
    const query: Record<string, string> = {};
    
    if (filters?.page) query.page = filters.page.toString();
    if (filters?.limit) query.limit = filters.limit.toString();
    if (filters?.role) query.role = filters.role;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) query.search = filters.search;
    if (filters?.sortBy) query.sortBy = filters.sortBy;
    if (filters?.sortOrder) query.sortOrder = filters.sortOrder;
    
    const res = await clientAuth.company[companyId].users.$get({
      query
    });
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки пользователей компании');
    throw error;
  }
};

export const removeUserFromCompany = async (companyId: string, userId: string) => {
  try {
    const res = await clientAuth.company[companyId].users[userId].$delete();
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка удаления пользователя из компании');
    throw error;
  }
};

export const updateUserRole = async (companyId: string, userId: string, role: string) => {
  try {
    const res = await clientAuth.company[companyId].users[userId].role.$put({
      json: { role }
    });
    return await res.json();
  } catch (error) {
    handleApiError(error, 'Ошибка обновления роли пользователя');
    throw error;
  }
};