'use client';

import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let shouldBeDark = false;

        if (savedTheme === 'dark') {
          shouldBeDark = true;
        } else if (savedTheme === 'light') {
          shouldBeDark = false;
        } else {
          shouldBeDark = prefersDark;
        }

        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {
        document.documentElement.classList.remove('dark');
      }
    };

    initializeTheme();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
