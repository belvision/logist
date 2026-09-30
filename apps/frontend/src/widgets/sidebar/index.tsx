'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Home,
  Package,
  Route,
  Truck,
  AlertTriangle,
  Headphones,
  LogOut,
  Users,
  Plus,
  Building2,
} from 'lucide-react';
import { AddCompanyModal } from '@/components/company/AddCompanyModal';
import useCompanyStore from '@/store/company-store';
import { useAuth } from '@/shared/context/auth-context';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useNotifications } from '@/shared/context/notifications-context';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ className, isOpen = false, onClose }: SidebarProps) => {
  const { companies, selectedCompany, getCompanies, createCompany, setSelectedCompany } = useCompanyStore();
  const { user, logout } = useAuth();
  const { hasNewSupportMessages, newMessagesCount } = useNotifications();
  const router = useRouter();
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

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
      throw error;
    }
  };

  const navigationItems = [
    { name: 'Главная', href: companyHref('/main'), icon: Home, hasSubmenu: false },
    {
      name: 'Грузы',
      href: companyHref('/cargo'),
      icon: Package,
      hasSubmenu: true,
      submenu: [
        { name: 'Мои грузы', href: companyHref('/cargo') },
        { name: 'Поиск попутных грузов', href: companyHref('/cargo-search'), hidden: selectedCompany?.id_tip_company === 1 },
        { name: 'Грузы из соц.сетей', href: companyHref('/social-cargo'), hidden: selectedCompany?.id_tip_company === 1 },
      ]
    },
    { 
      name: 'Маршруты', 
      href: companyHref('/routes'), 
      icon: Route, 
      hasSubmenu: false, 
      hidden: selectedCompany?.id_tip_company === 1 
    },
    {
      name: 'Автопарк',
      href: companyHref('/fleet'),
      icon: Truck,
      hasSubmenu: true,
      submenu: [
        { name: 'Мой автопарк', href: companyHref('/fleet') },
        { name: 'Поиск автомобилей', href: companyHref('/car-search') },
      ],
      hidden: selectedCompany?.id_tip_company === 1,
    },
    { name: 'Уведомления', href: '/notifications', icon: AlertTriangle, hasSubmenu: false },
    { 
      name: 'Поддержка', 
      href: '/support', 
      icon: Headphones,
      hasSubmenu: false,
      badge: hasNewSupportMessages ? newMessagesCount : undefined
    },
  ];

  const managementItems = [
    { name: 'Команда', href: companyHref('/team'), icon: Users },
  ];
  

  useEffect(() => {
    const fetchCompanies = async () => {
      await getCompanies();
    };
    fetchCompanies();
  }, [getCompanies]);

  if (!user) return null;

  const userName = `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.email;
  const userEmail = user.email;

  return (
    <>
      {/* Overlay для мобильных устройств */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Сайдбар */}
      <div className={cn(
        'fixed top-0 left-0 h-screen w-full md:w-64 bg-card border-r border-border flex flex-col z-[60]',
        'transform transition-all duration-300 ease-out shadow-2xl',
        'md:translate-x-0 md:static md:z-auto md:shadow-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        {/* Logo with Notification Badge */}
        <div className="p-6 border-b border-border pt-16 md:pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">LogistGo.pro</h1>
            <div className="relative">
              <NotificationCenter />
              {hasNewSupportMessages && newMessagesCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/support"
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          onClose?.();
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                    >
                      {newMessagesCount}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    Новые сообщения в поддержке ({newMessagesCount})
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* User Profile - Clickable */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
            className="w-full flex items-center gap-3 hover:bg-accent/10 p-2 rounded-lg transition-colors"
          >
            <Building2 className="w-8 h-8 rounded-lg " />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm truncate">{selectedCompany?.name_company || 'Не выбрана'}</p>
              <p className="text-xs text-muted-foreground truncate">{selectedCompany?.entity_type || 'Пользователь'}</p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isUserPanelOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isUserPanelOpen && (
            <div className="mt-2 space-y-2 pb-2 border-t border-border pt-2">
              {companies && companies.length > 0 && (
                <div
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  onClick={() => {
                    setIsAddCompanyModalOpen(true);
                    setIsUserPanelOpen(false);
                    if (window.innerWidth < 768) {
                      onClose?.();
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Добавить компанию
                </div>
              )}
              {companies && companies.length > 1 && (
                <div className="space-y-1">
                  {companies.map((company) => (
                    <div
                      key={company.id_company}
                      className={cn(
                        "px-2 py-1 rounded-lg cursor-pointer transition-colors",
                        selectedCompany?.id_company === company.id_company
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/10"
                      )}
                      onClick={() => {
                        setSelectedCompany(company);
                        setIsUserPanelOpen(false);
                      }}
                    >
                      <p className="text-sm font-medium">{company.name_company}</p>
                      <p className="text-xs text-muted-foreground">{company.entity_type}</p>
                    </div>
                  ))}
                </div>
              )}
              {(!companies || companies.length === 0) && (
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => {
                    setIsAddCompanyModalOpen(true);
                    setIsUserPanelOpen(false);
                    if (window.innerWidth < 768) {
                      onClose?.();
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Создать компанию
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.filter((item) => !item.hidden).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href));
            const isSubmenuOpen = expandedMenu === item.name;

            if (item.hasSubmenu && item.submenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 rounded-lg text-foreground text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent/10"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isSubmenuOpen && "rotate-180")} />
                  </button>
                  {isSubmenuOpen && (
                    <div className="pl-8 space-y-1 mt-1">
                      {item.submenu.filter((subItem: any) => !subItem.hidden).map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                onClose?.();
                              }
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 rounded-lg text-foreground text-sm flex items-center gap-2 transition-colors",
                              isSubActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-accent/10"
                            )}
                          >
                            <div className="w-1 h-1 rounded-full bg-foreground" />
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose?.();
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 rounded-lg text-foreground text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent/10"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.name}
                </span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Company Management Section */}
        {companies && companies.length > 0 && (
          <div className="p-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">УПРАВЛЕНИЕ КОМПАНИЕЙ</p>
            {managementItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onClose?.();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 rounded-lg text-foreground text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent/10"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* User Footer */}
        <div className="p-4 border-t border-border space-y-2">
        <Link href="/profile" className="flex-1" onClick={() => {
              if (window.innerWidth < 768) {
                onClose?.();
              }
            }}>
          <div className="flex items-center gap-2">
        {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Avatar" 
                className="w-10 h-10 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          <div className="text-sm">
            <p className="font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          </div>
          </Link>
          <div className="flex gap-2 py-2">
            <Button onClick={handleLogout} variant="outline" className="flex-1 text-sm gap-2 bg-transparent">
              <LogOut className="w-4 h-4" /> Выйти
            </Button>
          </div>
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