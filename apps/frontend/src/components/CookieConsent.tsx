'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie, ExternalLink } from "lucide-react";
import Link from "next/link";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, дал ли пользователь согласие на куки
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Показываем баннер через небольшую задержку
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Мы используем файлы cookie
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  Мы используем файлы cookie для улучшения работы нашего сайта, персонализации контента 
                  и анализа трафика. Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                  <Link 
                    href="/privacy-policy" 
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Политикой конфиденциальности
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {' '}и{' '}
                  <Link 
                    href="/offer-agreement" 
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Договором оферты
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  .
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleAccept}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Принять все
                  </Button>
                  <Button 
                    onClick={handleDecline}
                    size="sm"
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Отклонить
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleDecline}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
