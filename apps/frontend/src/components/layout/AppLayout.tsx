'use client';

import { Sidebar } from '@/widgets/sidebar';
import { MobileMenuButton } from '@/components/ui';
import { useSidebar, useCompanyRedirect } from '@/shared/hooks';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  
  // Используем хук для автоматического перенаправления при смене компании
  useCompanyRedirect();

  // Не показываем сайдбар на публичных страницах
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/registry' || pathname.startsWith('/invite') || pathname === '/cargo-search' || pathname === '/car-search';

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      {/* Сайдбар */}
      <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      
      {/* Основной контент */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Мобильная кнопка меню */}
        <MobileMenuButton isOpen={isOpen} onClick={toggleSidebar} />
        
        {/* Контент страницы */}
        <main className="flex-1 overflow-auto md:ml-0">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
