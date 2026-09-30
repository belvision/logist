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
  } catch (error) {
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
    return await res.json();
  } catch (error) {
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

export const getCompanyUsers = async (companyId: string) => {
  try {
    const res = await clientAuth.company[companyId].users.$get();
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