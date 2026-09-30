export interface TeamMember {
  id: string;
  name: string;
  position: string;
  role: 'manager' | 'driver' | 'logistics';
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  department: string;
  experience: number; // в годах
  skills: string[];
  lastActive: string;
}

export const mockTeamData: TeamMember[] = [
  {
    id: '1',
    name: 'Анна Петрова',
    position: 'Руководитель отдела логистики',
    role: 'manager',
    email: 'anna.petrova@logisticpro.ru',
    phone: '+7 (495) 123-45-67',
    status: 'active',
    joinDate: '2022-03-15',
    department: 'Логистика',
    experience: 8,
    skills: ['Управление проектами', 'Аналитика', 'CRM', 'Excel'],
    lastActive: '2024-01-16'
  },
  {
    id: '2',
    name: 'Михаил Соколов',
    position: 'Старший менеджер по клиентам',
    role: 'manager',
    email: 'mikhail.sokolov@logisticpro.ru',
    phone: '+7 (495) 123-45-68',
    status: 'active',
    joinDate: '2021-11-20',
    department: 'Продажи',
    experience: 6,
    skills: ['Работа с клиентами', 'Переговоры', 'Контракты', 'PowerBI'],
    lastActive: '2024-01-16'
  },
  {
    id: '3',
    name: 'Елена Волкова',
    position: 'Менеджер по операциям',
    role: 'manager',
    email: 'elena.volkova@logisticpro.ru',
    phone: '+7 (495) 123-45-69',
    status: 'active',
    joinDate: '2023-01-10',
    department: 'Операции',
    experience: 4,
    skills: ['Планирование маршрутов', 'Координация', 'Отчетность', '1C'],
    lastActive: '2024-01-15'
  },
  {
    id: '4',
    name: 'Дмитрий Козлов',
    position: 'Водитель-экспедитор',
    role: 'driver',
    email: 'dmitry.kozlov@logisticpro.ru',
    phone: '+7 (495) 123-45-70',
    status: 'active',
    joinDate: '2020-05-12',
    department: 'Транспорт',
    experience: 12,
    skills: ['Вождение категории C', 'Экспедирование', 'GPS навигация', 'Документооборот'],
    lastActive: '2024-01-16'
  },
  {
    id: '5',
    name: 'Сергей Морозов',
    position: 'Водитель грузовика',
    role: 'driver',
    email: 'sergey.morozov@logisticpro.ru',
    phone: '+7 (495) 123-45-71',
    status: 'active',
    joinDate: '2019-08-03',
    department: 'Транспорт',
    experience: 15,
    skills: ['Вождение категории C+E', 'Дальние рейсы', 'Техническое обслуживание', 'Безопасность'],
    lastActive: '2024-01-16'
  },
  {
    id: '6',
    name: 'Алексей Новиков',
    position: 'Водитель-курьер',
    role: 'driver',
    email: 'alexey.novikov@logisticpro.ru',
    phone: '+7 (495) 123-45-72',
    status: 'active',
    joinDate: '2022-02-14',
    department: 'Транспорт',
    experience: 5,
    skills: ['Вождение категории B', 'Курьерская доставка', 'Клиентский сервис', 'Мобильные приложения'],
    lastActive: '2024-01-16'
  },
  {
    id: '7',
    name: 'Игорь Лебедев',
    position: 'Водитель-экспедитор',
    role: 'driver',
    email: 'igor.lebedev@logisticpro.ru',
    phone: '+7 (495) 123-45-73',
    status: 'active',
    joinDate: '2021-09-01',
    department: 'Транспорт',
    experience: 7,
    skills: ['Вождение категории C', 'Междугородние перевозки', 'Работа с документами', 'Контроль груза'],
    lastActive: '2024-01-15'
  },
  {
    id: '8',
    name: 'Владимир Смирнов',
    position: 'Водитель-курьер',
    role: 'driver',
    email: 'vladimir.smirnov@logisticpro.ru',
    phone: '+7 (495) 123-45-74',
    status: 'active',
    joinDate: '2023-04-20',
    department: 'Транспорт',
    experience: 3,
    skills: ['Вождение категории B', 'Городская доставка', 'Навигация', 'Связь с клиентами'],
    lastActive: '2024-01-16'
  },
  {
    id: '9',
    name: 'Ольга Федорова',
    position: 'Старший логист',
    role: 'logistics',
    email: 'olga.fedorova@logisticpro.ru',
    phone: '+7 (495) 123-45-75',
    status: 'active',
    joinDate: '2020-12-01',
    department: 'Логистика',
    experience: 10,
    skills: ['Планирование маршрутов', 'Оптимизация перевозок', 'WMS системы', 'Анализ данных'],
    lastActive: '2024-01-16'
  },
  {
    id: '10',
    name: 'Наталья Кузнецова',
    position: 'Логист по складским операциям',
    role: 'logistics',
    email: 'natalia.kuznetsova@logisticpro.ru',
    phone: '+7 (495) 123-45-76',
    status: 'active',
    joinDate: '2022-06-15',
    department: 'Логистика',
    experience: 6,
    skills: ['Складской учет', 'Инвентаризация', '1C:Склад', 'Контроль качества'],
    lastActive: '2024-01-15'
  },
  {
    id: '11',
    name: 'Андрей Попов',
    position: 'Водитель-экспедитор',
    role: 'driver',
    email: 'andrey.popov@logisticpro.ru',
    phone: '+7 (495) 123-45-77',
    status: 'on_leave',
    joinDate: '2021-03-10',
    department: 'Транспорт',
    experience: 9,
    skills: ['Вождение категории C', 'Дальние рейсы', 'Экспедирование', 'Документооборот'],
    lastActive: '2024-01-10'
  },
  {
    id: '12',
    name: 'Мария Соколова',
    position: 'Водитель-курьер',
    role: 'driver',
    email: 'maria.sokolova@logisticpro.ru',
    phone: '+7 (495) 123-45-78',
    status: 'inactive',
    joinDate: '2023-07-01',
    department: 'Транспорт',
    experience: 2,
    skills: ['Вождение категории B', 'Курьерская доставка', 'Клиентский сервис'],
    lastActive: '2024-01-05'
  }
];

export const getRoleStats = (teamData: TeamMember[]) => {
  const stats = {
    managers: teamData.filter(member => member.role === 'manager' && member.status === 'active').length,
    drivers: teamData.filter(member => member.role === 'driver' && member.status === 'active').length,
    logistics: teamData.filter(member => member.role === 'logistics' && member.status === 'active').length,
    total: teamData.filter(member => member.status === 'active').length
  };
  return stats;
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'manager':
      return 'Менеджер';
    case 'driver':
      return 'Водитель';
    case 'logistics':
      return 'Логист';
    default:
      return role;
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Активен';
    case 'inactive':
      return 'Неактивен';
    case 'on_leave':
      return 'В отпуске';
    default:
      return status;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
