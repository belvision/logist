import React from 'react';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col items-center justify-center p-4">
      <div className="fixed top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card className="border-primary/10 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/95">
          <div className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-6 text-center text-sm">
                {footer}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
