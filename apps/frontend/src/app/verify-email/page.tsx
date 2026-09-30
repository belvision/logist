'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { emailVerificationApi } from '@/shared/api/email-verification';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения отсутствует');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const data = await emailVerificationApi.verifyEmail(token);

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email успешно подтвержден');
        
        // Перенаправляем в личный кабинет через 3 секунды
        // setTimeout(() => {
        //   router.push('/login');
        // }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Ошибка подтверждения email');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setStatus('error');
      setMessage('Произошла ошибка при подтверждении email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
            {status === 'loading' && 'Подтверждение email...'}
            {status === 'success' && 'Email подтвержден!'}
            {status === 'error' && 'Ошибка подтверждения'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>

          {status === 'success' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Вы будете автоматически перенаправлены на страницу входа...
            </p>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-3 mt-6">
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white">
                  Перейти к входу
                </Button>
              </Link>
              <Link href="/registry">
                <Button variant="outline" className="w-full border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  Регистрация
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

