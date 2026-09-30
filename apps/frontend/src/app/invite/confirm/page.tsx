'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authRegister } from '@/shared/api/auth';
import { ThemeToggle } from '@/components/theme';

type InviteData = {
  email: string;
  companyId: string;
  role: string;
};

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export default function InviteConfirmPage() {
  const router = useRouter();
  const search = useSearchParams();
  const inviteToken = search?.get('token') || undefined;

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Form>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Проверяем валидность токена при загрузке
  useEffect(() => {
    if (!inviteToken) {
      setError('Токен приглашения отсутствует');
      setLoading(false);
      return;
    }

    const verifyInvite = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/company/invite/verify?token=${encodeURIComponent(inviteToken)}`);
        const data = await response.json();
        
        if (data.ok) {
          setInviteData(data.payload);
          setFormData(prev => ({ ...prev, email: data.payload.email }));
        } else {
          setError(data.error || 'Неверный токен приглашения');
        }
      } catch {
        setError('Ошибка проверки приглашения');
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [inviteToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim()) e.firstName = 'Имя обязательно';
    if (!formData.lastName.trim()) e.lastName = 'Фамилия обязательна';
    if (!formData.email.trim()) e.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Некорректный email';
    const u = formData.username.trim();
    if (!u) e.username = 'Логин обязателен';
    else if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(u)) e.username = 'Логин: 3–24 символа, латиница/цифры/._-';
    if (!formData.password) e.password = 'REDACTED_SECRET';
    else if (formData.password.length < 6) e.password = 'REDACTED_SECRET';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'REDACTED_SECRET';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      await authRegister({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        inviteToken,
      });

      router.push('/login');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Сбой сети');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ThemeToggle />
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Проверяем приглашение</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Пожалуйста, подождите...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ThemeToggle />
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ошибка</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Произошла ошибка при проверке приглашения</p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
            
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              Перейти к входу
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ThemeToggle />
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Приглашение не найдено</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Не удалось найти данные приглашения</p>
            
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              Перейти к входу
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ThemeToggle />
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-3xl mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Присоединиться к компании</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Вас пригласили в компанию с ролью <span className="font-semibold text-blue-600 dark:text-blue-400">{inviteData.role}</span>
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="p-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Информация о приглашении
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Роль:</span> {inviteData.role}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Email:</span> {inviteData.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Имя *
            </Label>
            <Input 
              id="firstName" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Введите ваше имя"
              style={{ colorScheme: 'light' }}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Фамилия *
            </Label>
            <Input 
              id="lastName" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Введите вашу фамилию"
              style={{ colorScheme: 'light' }}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email *
          </Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleInputChange}
            disabled
            className="h-12 px-4 bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
            style={{ colorScheme: 'light' }}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Email заблокирован согласно приглашению</p>
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Логин *
          </Label>
          <Input 
            id="username" 
            name="username" 
            value={formData.username} 
            onChange={handleInputChange}
            className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Введите логин"
            style={{ colorScheme: 'light' }}
          />
          {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Пароль *
            </Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Введите пароль"
              style={{ colorScheme: 'light' }}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Подтверждение пароля *
            </Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Подтвердите пароль"
              style={{ colorScheme: 'light' }}
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Создаём аккаунт...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Присоединиться к компании
                  </div>
                )}
              </Button>
            </form>
          </div>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 LogisticPro. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
