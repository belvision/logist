'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authRegister } from '@/shared/api/auth';
import { AuthLayout } from '@/components/auth';
import { showToast, handleApiError } from '@/lib/toast';
import { PasswordGenerateButton } from '@/components/auth/PasswordGenerateButton';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useRecaptchaToken } from '@/hooks/useRecaptcha';

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export default function RegistryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSearchParams();
  const inviteToken = search?.get('invite') || undefined;
  const [formData, setFormData] = useState<Form>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; level: string; isValid: boolean } | null>(null);
  const { getRecaptchaToken, isEnabled: recaptchaEnabled } = useRecaptchaToken();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordGenerated = (password: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      password,
      confirmPassword: password // Автоматически заполняем поле подтверждения
    }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData['firstName'].trim()) e['firstName'] = t('auth.register.errorFirstNameRequired');
    if (!formData['lastName'].trim()) e['lastName'] = t('auth.register.errorLastNameRequired');
    if (!formData['email'].trim()) e['email'] = t('auth.register.errorEmailRequired');
    else if (!/\S+@\S+\.\S+/.test(formData['email'])) e['email'] = t('auth.register.errorEmailInvalid');
    const u = formData['username'].trim();
    if (!u) e['username'] = t('auth.register.errorUsernameRequired');
    else if (!/^[a-zA-Zа-яА-Я0-9]{3,}$/.test(u)) e['username'] = t('auth.register.errorUsernameInvalid');
    if (!formData['password']) e['password'] = t('auth.register.errorPasswordRequired');
    else if (formData['password'].length < 8) e['password'] = t('auth.register.errorPasswordTooShort');
    else if (passwordStrength && !passwordStrength.isValid) e['password'] = t('auth.register.errorPasswordWeak');
    if (formData['password'] !== formData['confirmPassword']) e['confirmPassword'] = t('auth.register.errorPasswordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // Получаем reCAPTCHA токен если включен
      let recaptchaToken: string | undefined;
      if (recaptchaEnabled) {
        try {
          recaptchaToken = await getRecaptchaToken('register') || undefined;
          if (!recaptchaToken) {
            console.warn('🔍 [REGISTER] reCAPTCHA token is null, but continuing with registration attempt');
            // Не блокируем регистрацию, если reCAPTCHA не сработала
            // Backend сам решит, что делать с отсутствующим токеном
          }
        } catch (error) {
          console.error('🔍 [REGISTER] reCAPTCHA error:', error);
          // Не блокируем регистрацию при ошибке reCAPTCHA
        }
      }

      await authRegister({
        email: formData['email'].trim(),
        password: formData['password'],
        firstName: formData['firstName'].trim(),
        lastName: formData['lastName'].trim(),
        username: formData['username'].trim(),
        inviteToken,
        ...(recaptchaToken && { recaptchaToken })
      });
      showToast.success(t('auth.register.successRegister'));
      router.push('/login');
    } catch (error) {
      handleApiError(error, t('auth.register.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          {t('auth.register.hasAccount')}{' '}
          <a href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
            {t('auth.register.loginLink')}
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.register.firstName')} {t('auth.register.required')}
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData['firstName']}
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.register.firstNamePlaceholder')}
            />
            {errors['firstName'] && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors['firstName']}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.register.lastName')} {t('auth.register.required')}
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData['lastName']}
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.register.lastNamePlaceholder')}
            />
            {errors['lastName'] && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors['lastName']}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.email')} {t('auth.register.required')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData['email']}
            onChange={handleInputChange}
            className="h-12 px-4 bg-white/80 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={t('auth.register.emailPlaceholder')}
          />
          {errors['email'] && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['email']}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.username')} {t('auth.register.required')}
          </Label>
          <Input
            id="username"
            name="username"
            value={formData['username']}
            onChange={handleInputChange}
            className="h-12 px-4 bg-white/80 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={t('auth.register.usernamePlaceholder')}
          />
          {errors['username'] && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['username']}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.register.password')} {t('auth.register.required')}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData['password']}
              onChange={handleInputChange}
              className="h-12 px-4 bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.register.passwordPlaceholder')}
            />
            {errors['password'] && (
              <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors['password']}
              </p>
            )}
            
            {/* Индикатор силы пароля */}
            <PasswordStrengthIndicator
              password={formData['password']}
              onStrengthChange={setPasswordStrength}
              showSuggestions={true}
            />
          </div>

          {/* Кнопка генерации пароля */}
          <PasswordGenerateButton
            onPasswordGenerated={handlePasswordGenerated}
            className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.confirmPassword')} {t('auth.register.required')}
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData['confirmPassword']}
            onChange={handleInputChange}
            className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
          />
          {errors['confirmPassword'] && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['confirmPassword']}
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMsg}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] border-2 border-blue-500 dark:border-blue-400"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('auth.register.buttonLoading')}
            </div>
          ) : (
            t('auth.register.button')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
