'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useCompanyStore from '@/store/company-store';

export const useCompanyRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCompany, isCompanyChanging } = useCompanyStore();

  useEffect(() => {
    // Если нет выбранной компании, ничего не делаем
    if (!selectedCompany) return;

    // Публичные страницы не требуют перенаправления
    const publicPaths = ['/login', '/registry', '/invite/confirm'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Если мы на главной странице, перенаправляем на маршруты компании
    if (pathname === '/') {
      router.push(`/company/${selectedCompany.id_company}/routes`);
      return;
    }

    // Если мы на странице профиля, не перенаправляем
    if (pathname === '/profile') {
      return;
    }

    // Проверяем, находимся ли мы на странице компании
    const companyRoutePattern = /^\/company\/([^\/]+)/;
    const match = pathname.match(companyRoutePattern);
    
    if (match) {
      const currentCompanyId = match[1];
      // Если ID компании в URL не совпадает с выбранной компанией, перенаправляем
      if (currentCompanyId !== selectedCompany.id_company) {
        // Сохраняем текущий путь и заменяем ID компании
        const newPath = pathname.replace(`/company/${currentCompanyId}`, `/company/${selectedCompany.id_company}`);
        router.push(newPath);
      }
    }
  }, [selectedCompany, pathname, router, isCompanyChanging]);
};
