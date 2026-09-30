'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from './useSidebar';

/**
 * Хук для автоматического закрытия сайдбара при навигации на мобильных устройствах
 */
export const useAutoCloseSidebar = () => {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    // Закрываем сайдбар только на мобильных устройствах при изменении маршрута
    if (isOpen && window.innerWidth < 768) {
      closeSidebar();
    }
  }, [pathname, isOpen, closeSidebar]);
};
