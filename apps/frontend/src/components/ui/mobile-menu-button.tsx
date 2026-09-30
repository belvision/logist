'use client';

import { cn } from '@/lib/utils';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileMenuButton = ({ isOpen, onClick, className }: MobileMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'md:hidden fixed top-4 left-4 z-[60] p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white',
        'hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-xl border border-gray-600/30',
        'backdrop-blur-sm',
        className
      )}
      aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
    >
      <svg
        className={cn(
          'w-6 h-6 transition-transform duration-300',
          isOpen && 'rotate-180'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isOpen ? (
          // Иконка закрытия (X)
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          // Иконка гамбургера
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
};
