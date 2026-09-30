'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Mail, Shield, User } from 'lucide-react';

interface SecurityCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorType?: 'recaptcha' | 'email_verification' | 'phone_verification' | '2fa' | 'general';
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
}

export function SecurityCheckModal({
  isOpen,
  onClose,
  onRetry,
  errorType = 'general',
  errorMessage,
  retryCount = 0,
  maxRetries = 3
}: SecurityCheckModalProps) {
  if (!isOpen) return null;

  const getErrorInfo = () => {
    switch (errorType) {
      case 'recaptcha':
        return {
          icon: <Shield className="h-8 w-8 text-orange-500" />,
          title: 'Проверка безопасности не пройдена',
          description: 'reCAPTCHA не смогла подтвердить, что вы не робот',
          solutions: [
            'Убедитесь, что JavaScript включен в вашем браузере',
            'Проверьте подключение к интернету',
            'Попробуйте обновить страницу',
            'Если проблема повторяется, попробуйте другой браузер'
          ],
          actionText: 'Попробовать снова'
        };
      
      case 'email_verification':
        return {
          icon: <Mail className="h-8 w-8 text-blue-500" />,
          title: 'Email не подтвержден',
          description: 'Для продолжения необходимо подтвердить email адрес',
          solutions: [
            'Проверьте папку "Входящие" в вашей почте',
            'Проверьте папку "Спам" или "Нежелательная почта"',
            'Убедитесь, что email адрес указан правильно',
            'Запросите повторную отправку письма подтверждения'
          ],
          actionText: 'Отправить письмо повторно'
        };
      
      case 'phone_verification':
        return {
          icon: <User className="h-8 w-8 text-green-500" />,
          title: 'Телефон не подтвержден',
          description: 'Для повышения безопасности необходимо подтвердить номер телефона',
          solutions: [
            'Проверьте SMS сообщения на вашем телефоне',
            'Убедитесь, что номер телефона указан правильно',
            'Попробуйте запросить код повторно',
            'Если код не приходит, обратитесь в поддержку'
          ],
          actionText: 'Отправить код повторно'
        };
      
      case '2fa':
        return {
          icon: <Shield className="h-8 w-8 text-purple-500" />,
          title: 'Двухфакторная аутентификация',
          description: 'Для входа необходимо подтверждение через 2FA',
          solutions: [
            'Откройте приложение аутентификатора на телефоне',
            'Введите 6-значный код для LogistGo.pro',
            'Убедитесь, что время на телефоне синхронизировано',
            'Если код не работает, попробуйте следующий'
          ],
          actionText: 'Попробовать снова'
        };
      
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: 'Ошибка безопасности',
          description: errorMessage || 'Произошла ошибка при проверке безопасности',
          solutions: [
            'Проверьте подключение к интернету',
            'Обновите страницу и попробуйте снова',
            'Очистите кэш браузера',
            'Если проблема повторяется, обратитесь в поддержку'
          ],
          actionText: 'Попробовать снова'
        };
    }
  };

  const errorInfo = getErrorInfo();
  const canRetry = retryCount < maxRetries;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {errorInfo.title}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {errorInfo.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Решения */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              Что можно сделать:
            </h4>
            <ul className="space-y-1">
              {errorInfo.solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Счетчик попыток */}
          {retryCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Попыток: {retryCount}/{maxRetries}</span>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Закрыть
            </Button>
            {canRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {errorInfo.actionText}
              </Button>
            )}
          </div>

          {/* Дополнительная помощь */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Нужна помощь?{' '}
              <a 
                href="/support" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Обратитесь в поддержку
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
