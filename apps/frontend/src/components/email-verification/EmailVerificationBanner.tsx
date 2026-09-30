'use client';

import { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, AlertTriangle, X } from 'lucide-react';
import { emailVerificationApi } from '@/shared/api/email-verification';

export function EmailVerificationBanner() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [message, setMessage] = useState('');

  const checkVerification = useCallback(async () => {
    try {
      const data = await emailVerificationApi.checkVerification();
      setIsVerified(data.verified);
    } catch (error) {
      console.error('📧 [EMAIL CHECK] Exception:', error);
    }
  }, []);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  const resendVerification = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await emailVerificationApi.resendVerification();

      if (data.success) {
        setMessage('Письмо отправлено! Проверьте вашу почту.');
      } else {
        setMessage(data.error || 'Ошибка отправки письма');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage('Произошла ошибка при отправке письма');
    } finally {
      setIsLoading(false);
    }
  };

  // Не показываем баннер если:
  // - email подтвержден
  // - баннер закрыт
  if (isVerified === true || isDismissed) {
    return null;
  }
  
  // Показываем баннер, если проверка завершена и email не подтвержден
  if (isVerified === false) {
    // Баннер будет показан
  } else {
    // Еще не проверили статус - не показываем
    return null;
  }

  return (
    <div className="mb-4">
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 relative">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
        <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold mb-2">
          Подтвердите ваш email
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <p className="mb-3">
            Ваш email не подтвержден. Некоторые функции сайта будут ограничены до тех пор, пока вы не подтвердите свой email адрес.
          </p>
          <p className="mb-3 text-sm">
            💡 <strong>Совет:</strong> Проверьте папку &quot;Спам&quot; или &quot;Нежелательная почта&quot; - письмо с подтверждением могло попасть туда.
          </p>
          {message && (
            <p className={`mb-3 text-sm font-medium ${message.includes('Ошибка') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {message}
            </p>
          )}
          <Button
            onClick={resendVerification}
            disabled={isLoading}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Отправка...' : 'Отправить письмо повторно'}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
