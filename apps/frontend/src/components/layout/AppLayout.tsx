'use client';

import { Sidebar } from '@/widgets/sidebar';
import { MobileMenuButton } from '@/components/ui';
import { useSidebar, useCompanyRedirect, useAutoCloseSidebar } from '@/shared/hooks';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  
  useCompanyRedirect();
  
  useAutoCloseSidebar();

  const isPublicPage = pathname === '/' || 
    pathname === '/login' || 
    pathname === '/registry' || 
    pathname.startsWith('/invite') || 
    pathname === '/cargo-owners' || 
    pathname === '/carriers' ||
    pathname === '/carriers/7-steps' ||
    pathname === '/carriers/add-transport' ||
    pathname === '/carriers/licenses' ||
    pathname === '/team' ||
    pathname === '/api-docs' ||
    pathname === '/privacy-policy' ||
    pathname === '/offer-agreement' ||
    pathname.startsWith('/countries/');

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      
      <div className="flex-1 flex flex-col h-screen">
        <MobileMenuButton isOpen={isOpen} onClick={toggleSidebar} />
        
        <main className="flex-1 overflow-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 pt-20 md:pt-6 md:p-6">
              {children}
            </div>

            <footer className="text-xs text-gray-500 dark:text-gray-400 px-4 py-6 text-center mt-auto">
              <div className="mb-2">
                Сайт защищён reCAPTCHA, применяются&nbsp;
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-foreground transition-colors"
                >
                  Политика конфиденциальности Google
                </a>
                &nbsp;и&nbsp;
                <a 
                  href="https://policies.google.com/terms" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-foreground transition-colors"
                >
                  Условия использования
                </a>.
              </div>
              <div className="text-xs text-muted-foreground">
                © 2024 LogistGo.pro. Все права защищены.
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
