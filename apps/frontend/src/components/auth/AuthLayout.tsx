import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>}
        </div>

        <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
          </CardContent>
          {footer && (
            <div className="px-6 pb-6">
              {footer}
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 LogisticPro. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
