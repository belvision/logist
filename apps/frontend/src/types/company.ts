// Типы данных на основе бэкенда

export interface CompanyUser {
  id_user: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: 'Владелец' | 'Администратор' | 'Пользователь';
  joinedAt: string; // ID связи как временная дата
  id_company?: string; // ID компании (для внутреннего использования, не отображается в UI)
}

export interface Company {
  id_company: string;
  name_company: string;
  unp: string;
  entity_type: 'ИП' | 'Предприятие';
  ur_address: string;
  tel_1: string;
  tel_2: string | null;
  email: string | null;
  id_tip_company: number;
  docs_approved: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string; // Роль текущего пользователя в компании
}

export interface CompanyType {
  id_tip_company: number;
  name_tip_company: string;
  status: boolean;
}

export interface AddUserToCompanyRequest {
  email: string;
  role: 'Администратор' | 'Пользователь';
}

export interface InviteUserToCompanyRequest {
  email: string;
  role: 'Администратор' | 'Пользователь';
  message?: string;
}

export interface UpdateUserRoleRequest {
  role: 'Администратор' | 'Пользователь';
}

// Статистика команды
export interface TeamStats {
  total: number;
  owners: number;
  admins: number;
  users: number;
}

// Функции для работы со статистикой
export const getTeamStats = (users: CompanyUser[]): TeamStats => {
  return {
    total: users.length,
    owners: users.filter(user => user.role === 'Владелец').length,
    admins: users.filter(user => user.role === 'Администратор').length,
    users: users.filter(user => user.role === 'Пользователь').length,
  };
};

// Функции для получения лейблов ролей
export const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'Владелец':
      return 'Владелец';
    case 'Администратор':
      return 'Администратор';
    case 'Пользователь':
      return 'Пользователь';
    default:
      return role;
  }
};

// Функции для получения цветов ролей
export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'Владелец':
      return 'bg-purple-100 text-purple-800';
    case 'Администратор':
      return 'bg-blue-100 text-blue-800';
    case 'Пользователь':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Функции для получения цветов статуса
export const getStatusColor = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800';
};

export const getStatusLabel = (isActive: boolean): string => {
  return isActive ? 'Активен' : 'Неактивен';
};
