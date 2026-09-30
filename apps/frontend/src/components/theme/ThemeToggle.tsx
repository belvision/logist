'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isPublicPath } from '@/shared/lib/public-paths';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
    setMounted(true);

    // На публичных страницах не применяем сохраненную тему
    if (isPublic) {
      return;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && !isCurrentlyDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedTheme === 'light' && isCurrentlyDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, [isPublic]);

  useEffect(() => {
    // Синхронизируем состояние с DOM при изменении пути
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
  }, [pathname]);

  const toggleTheme = () => {
    // На публичных страницах переключение темы отключено
    if (isPublic) {
      return;
    }

    const newIsDark = !isDark;
    setIsDark(newIsDark);

    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');

    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={isPublic}
      className={`w-full h-full flex items-center justify-center ${isPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isPublic ? 'Тема зафиксирована на светлой' : `Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
      title={isPublic ? 'На этой странице доступна только светлая тема' : `Текущая тема: ${isDark ? 'темная' : 'светлая'}`}
    >
      {isDark ? (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
