'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AddCompanyModal } from '@/components/company/AddCompanyModal';
import useCompanyStore from '@/store/company-store';
import { useAuth } from '@/shared/context/auth-context';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useNotifications } from '@/shared/context/notifications-context';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  submenu?: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
  badge?: number | undefined;
}

interface ManagementItem {
  name: string;
  href: string;
  icon: string;
  count?: number;
  badge?: number;
}

export const Sidebar = ({ className, isOpen = false, onClose }: SidebarProps) => {
  const { companies, selectedCompany, getCompanies, createCompany, setSelectedCompany } = useCompanyStore();
  const { user } = useAuth();
  const { hasNewSupportMessages, newMessagesCount, isWebSocketConnected, connectionStatus } = useNotifications();

  // Временно отключаем хук для отладки
  const teamCount = 2; // Временное значение
  const teamCountLoading = false;
  

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    const handleResize = () => {
      // Закрываем сайдбар только при переходе с мобильного на десктоп
      if (window.innerWidth >= 768 && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);

  const companyHref = (suffix: string) => selectedCompany ? `/company/${selectedCompany.id_company}${suffix}` : '#';

  const handleAddCompany = async (companyData: {
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
      await createCompany(companyData);
      setIsAddCompanyModalOpen(false);
      if (window.innerWidth < 768) {
        onClose?.();
      }
    } catch (error) {
      console.error('Ошибка при создании компании:', error);
      throw error;
    }
  };

  const navigationItems: NavigationItem[] = [
    { name: 'Главная', href: companyHref('/main'), icon: '🏠' },
    {
      name: 'Грузы',
      href: companyHref('/cargo'),
      icon: '📦',
      submenu: [
        { name: 'Мои грузы', href: companyHref('/cargo'), icon: '📋' },
        { name: 'Поиск попутных грузов', href: companyHref('/cargo-search'), icon: '🔍' },
      ]
    },
    { name: 'Маршруты', href: companyHref('/routes'), icon: '🗺️' },
    {
      name: 'Автопарк',
      href: companyHref('/fleet'),
      icon: '🚛',
      submenu: [
        { name: 'Мой автопарк', href: companyHref('/fleet'), icon: '🚗' },
        { name: 'Поиск автомобилей', href: companyHref('/car-search'), icon: '🔍' },
      ]
    },
    // TODO: Добавить мессенджер и документы
    // { name: 'Мессенджер', href: companyHref('/messenger'), icon: '💬' },
    // { name: 'Документы', href: companyHref('/documents'), icon: '📄' },
    { name: 'Уведомления', href: '/notifications', icon: '🔔' },
    { 
      name: 'Поддержка', 
      href: '/support', 
      icon: '🆘',
      badge: hasNewSupportMessages ? newMessagesCount : undefined
    },
  ];

  const managementItems: ManagementItem[] = [
    // TODO: Добавить настройки
    // { name: 'Настройки', href: companyHref('/settings'), icon: '⚙️' },
    { name: 'Команда', href: companyHref('/team'), icon: '👥', count: teamCount },
  ];
  

  useEffect(() => {
    const fetchCompanies = async () => {
      await getCompanies();
    };
    fetchCompanies();
  }, [getCompanies]);

  if (!user) return null;

  return (
    <>
      {/* Overlay для мобильных устройств */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/40 to-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Сайдбар */}
      <div className={cn(
        'fixed top-0 left-0 h-screen w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col z-[60]',
        'transform transition-all duration-500 ease-out shadow-2xl',
        'md:translate-x-0 md:static md:z-auto md:w-80 md:shadow-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        {/* Логотип и название компании */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center justify-between pl-16 md:pl-0">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-300">
              LogistGo.pro
            </Link>
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {companies?.length > 0 ? (
            <div className="p-2 border-b border-gray-700/50">
              <div
                className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 cursor-pointer transition-all duration-300 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
                    🏢
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{selectedCompany?.name_company}</div>
                    <div className="text-sm text-gray-500">{selectedCompany?.entity_type}</div>
                  </div>
                </div>
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isCompanyDropdownOpen && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Выпадающий список компаний */}
              {isCompanyDropdownOpen && (
                <div className="mt-3 bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl overflow-hidden backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  {companies.map((company) => (
                    <div
                      key={company.id_company}
                      className="flex items-center space-x-4 p-4 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 cursor-pointer transition-all duration-300"
                      onClick={() => {
                        setSelectedCompany(company);
                        setIsCompanyDropdownOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-sm">
                        🏢
                      </div>
                      <div>
                        <div className="font-medium text-white">{company.name_company}</div>
                        <div className="text-xs text-gray-500">{company.entity_type}</div>
                      </div>
                    </div>
                  ))}
                  <div
                    className="flex items-center space-x-4 p-4 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 cursor-pointer transition-all duration-300 border-t border-gray-700/50"
                    onClick={() => {
                      setIsAddCompanyModalOpen(true);
                      setIsCompanyDropdownOpen(false);
                      // Закрываем сайдбар на мобильных устройствах при открытии модального окна
                      if (window.innerWidth < 768) {
                        onClose?.();
                      }
                    }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg">
                      +
                    </div>
                    <div className="font-medium text-white">Добавить компанию</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Состояние когда нет компаний */
            <div className="p-6 border-b border-gray-700/50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                  <span className="text-4xl">🏢</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Нет компаний</h3>
                <p className="text-base text-gray-300 mb-8">Создайте компанию для начала работы</p>
                <button
                  onClick={() => {
                    setIsAddCompanyModalOpen(true);
                    // Закрываем сайдбар на мобильных устройствах при открытии модального окна
                    if (window.innerWidth < 768) {
                      onClose?.();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-base font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Создать компанию
                </button>
              </div>
            </div>
          )}

          {/* Основная навигация - показываем только если есть компании */}
          {companies?.length > 0 && (
            <div className="p-6">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href));
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isSubmenuOpen = openSubmenu === item.name;

                  return (
                    <div key={item.name}>
                      {hasSubmenu ? (
                        <div>
                        <button
                          onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.name)}
                          className={cn(
                            'w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all duration-300',
                            isActive
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg'
                              : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md'
                          )}
                        >
                            <div className="flex items-center space-x-4">
                              <span className="text-xl">{item.icon}</span>
                              <span className="text-lg font-medium">{item.name}</span>
                            </div>
                            <svg
                              className={cn(
                                'w-4 h-4 transition-transform',
                                isSubmenuOpen && 'rotate-180'
                              )}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Подменю */}
                          {isSubmenuOpen && (
                            <div className="ml-4 mt-1 space-y-1">
                              {item.submenu?.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className={cn(
                                      'flex items-center space-x-3 px-3 pl-6 py-2 rounded-lg transition-colors text-sm',
                                      isSubActive
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    )}
                                  >
                                       <span className="text-xl">{subItem.icon}</span>
                                       <span className="text-lg font-medium">{subItem.name}</span>
                                    {/* <span className="text-sm">{subItem.icon}</span>
                                    <span className="font-medium">{subItem.name}</span> */}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between px-6 py-4 rounded-xl transition-all duration-300',
                            isActive
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg'
                              : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md'
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-lg font-medium">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[24px] text-center shadow-lg animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Управление проектом */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 px-3 py-2 rounded-lg">
                  Управление компанией
                </h3>
                <nav className="space-y-1">
                  {managementItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center justify-between px-6 py-4 rounded-xl transition-all duration-300',
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30 shadow-lg'
                            : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md'
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-lg font-medium">{item.name}</span>
                        </div>
                        {(item.badge || item.count) && (
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[24px] text-center shadow-lg">
                            {item.badge || item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Данные пользователя */}
        <div className="p-0 px-4  border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <Link
            href="/profile"
            className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 transition-all duration-300"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 min-w-12 min-h-12 object-cover rounded-xl border-2 border-blue-500/30 shadow-lg" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg border border-blue-500/30">
                {(user.lastName?.[0] || '') + (user.firstName?.[0] || '')}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-white truncate">{user?.lastName} {user?.firstName}</div>
              <div className="text-sm text-gray-300 truncate">{user.email}</div>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Модальное окно для добавления компании */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onSubmit={handleAddCompany}
      />
    </>
  );
};