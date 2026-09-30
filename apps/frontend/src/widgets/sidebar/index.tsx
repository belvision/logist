'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AddCompanyModal } from '@/components/company/AddCompanyModal';
import useCompanyStore from '@/store/company-store';
import { useAuth } from '@/shared/context/auth-context';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}


export const Sidebar = ({ className, isOpen = false, onClose }: SidebarProps) => {
  const { companies, selectedCompany, getCompanies, createCompany, setSelectedCompany } = useCompanyStore();
  const { user } = useAuth();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      onClose?.();
    }
  }, [pathname, isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
    } catch (error) {
      console.error('Ошибка при создании компании:', error);
      throw error;
    }
  };

  const navigationItems = [
    { name: 'Главная', href: companyHref('/main'), icon: '🏠' },
    { 
      name: 'Грузы', 
      href: companyHref('/cargo'), 
      icon: '📦',
      submenu: [
        { name: 'Мои грузы', href: companyHref('/cargo'), icon: '📋' },
        { name: 'Поиск попутных грузов', href: '/cargo-search', icon: '🔍' },
      ]
    },
    { name: 'Маршруты', href: companyHref('/routes'), icon: '🗺️' },
    { 
      name: 'Автопарк', 
      href: companyHref('/fleet'), 
      icon: '🚛',
      submenu: [
        { name: 'Мой автопарк', href: companyHref('/fleet'), icon: '🚗' },
        { name: 'Поиск автомобилей', href: '/car-search', icon: '🔍' },
      ]
    },
  ];

  const managementItems = [
    { name: 'Настройки', href: companyHref('/settings'), icon: '⚙️' },
    { name: 'Команда', href: companyHref('/team'), icon: '👥', count: 5 },
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Сайдбар */}
      <div className={cn(
        'fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-50',
        'transform transition-transform duration-300 ease-in-out',
        'md:translate-x-0 md:static md:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        {/* Логотип и название компании */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">LogisticPro</h1>
            {/* Кнопка закрытия для мобильных устройств */}
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto pb-30 hide-scrollbar">

      {/* Селектор компании */}
      {companies?.length > 0 ? (
        <div className="p-4 border-b border-gray-700">
          <div
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-sm">
                🏢
              </div>
              <div>
                <div className="font-medium">{selectedCompany?.name_company}</div>
                <div className="text-xs text-gray-400">{selectedCompany?.entity_type}</div>
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
            <div className="mt-2 bg-gray-800 rounded-lg overflow-hidden">
              {companies.map((company) => (
                <div
                  key={company.id_company}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCompany(company);
                    setIsCompanyDropdownOpen(false);
                  }}
                >
                  {/* <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs">
                    {company.icon}
                  </div> */}
                  <div>
                    <div className="font-medium">{company.name_company}</div>
                    <div className="text-xs text-gray-400">{company.entity_type}</div>
                  </div>
                </div>
              ))}
              <div
                className="flex items-center space-x-3 p-3 hover:bg-gray-700 cursor-pointer transition-colors border-t border-gray-700"
                onClick={() => {
                  setIsAddCompanyModalOpen(true);
                  setIsCompanyDropdownOpen(false);
                }}
              >
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-xs">
                  +
                </div>
                <div className="font-medium">Добавить компанию</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Состояние когда нет компаний */
        <div className="p-4 border-b border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Нет компаний</h3>
            <p className="text-xs text-gray-400 mb-4">Создайте компанию для начала работы</p>
            <button
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Создать компанию
            </button>
          </div>
        </div>
      )}

      {/* Основная навигация - показываем только если есть компании */}
      {companies?.length > 0 && (
        <div className="flex-1 p-4">
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
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium">{item.name}</span>
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
                          {item.submenu.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm',
                                  isSubActive
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                )}
                              >
                                <span className="text-sm">{subItem.icon}</span>
                                <span className="font-medium">{subItem.name}</span>
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
                        'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Управление проектом */}
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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
                      'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      </div >

      {/* Поддержка */}
      <div className="px-4 py-2">
        <Link
          href="/support"
          className={cn(
            "flex items-center space-x-3 p-2 rounded-lg transition-colors",
            pathname === '/support' 
              ? "bg-blue-600 text-white" 
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
          <span className="text-sm font-medium">Поддержка</span>
        </Link>
      </div>

      {/* Данные пользователя */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-900 border-gray-700">
        <Link
          href="/profile"
          className="flex items-center space-x-3 mb-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.lastName[0] + user.firstName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.lastName} {user?.firstName}</div>
            <div className="text-xs text-gray-400 truncate">{user.email}</div>
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