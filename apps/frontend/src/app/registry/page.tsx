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
import { Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
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
      // router.push('/login');
    } catch (error) {
      handleApiError(error, t('auth.register.errorDefault'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          <span className="text-muted-foreground">{t('auth.register.hasAccount')} </span>
          <a href="/login" className="font-semibold text-primary hover:text-accent transition-colors">
            {t('auth.register.loginLink')}
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              {t('auth.register.firstName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder={t('auth.register.firstNamePlaceholder')}
              value={formData.firstName}
              onChange={handleInputChange}
              className="bg-card border-input hover:border-primary/30 focus:border-primary"
              required
            />
            {errors['firstName'] && (
              <p className="text-sm text-destructive flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors['firstName']}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              {t('auth.register.lastName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder={t('auth.register.lastNamePlaceholder')}
              value={formData.lastName}
              onChange={handleInputChange}
              className="bg-card border-input hover:border-primary/30 focus:border-primary"
              required
            />
            {errors['lastName'] && (
              <p className="text-sm text-destructive flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors['lastName']}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t('auth.register.email')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            value={formData.email}
            onChange={handleInputChange}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
          {errors['email'] && (
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['email']}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">
            {t('auth.register.username')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder={t('auth.register.usernamePlaceholder')}
            value={formData.username}
            onChange={handleInputChange}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
          {errors['username'] && (
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['username']}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t('auth.register.password')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t('auth.register.passwordPlaceholder')}
            value={formData.password}
            onChange={handleInputChange}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
          {errors['password'] && (
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['password']}
            </p>
          )}
          <PasswordStrengthIndicator
            password={formData.password}
            onStrengthChange={setPasswordStrength}
            showSuggestions={true}
          />
        </div>

        <PasswordGenerateButton
          onPasswordGenerated={handlePasswordGenerated}
        />

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            {t('auth.register.confirmPassword')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
          {errors['confirmPassword'] && (
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors['confirmPassword']}
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMsg}
            </p>
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 h-10"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.register.buttonLoading')}
            </>
          ) : (
            t('auth.register.button')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
