'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { authLogin } from '@/shared/api/auth';
import { setCookie } from 'cookies-next';
import { AuthLayout } from '@/components/auth';
import { showToast } from '@/lib/toast';
import { useRecaptchaToken } from '@/hooks/useRecaptcha';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { getRecaptchaToken, isEnabled: recaptchaEnabled } = useRecaptchaToken();


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pending) {
      return;
    }
    
    setError(null);
    setPending(true);

    try {
      let recaptchaToken: string | undefined;
      if (recaptchaEnabled) {
        try {
          recaptchaToken = await getRecaptchaToken('login') || undefined;
        } catch (error) {
          throw error;
        }
      }

      const res = await authLogin({
        email: email.trim(), 
        password, 
        ...(recaptchaToken && { recaptchaToken })
      });
      

      if (!res.success || !res.data?.accessToken) {
        const errorMessage = res.error || t('auth.login.errorDefault');
        setError(errorMessage);
        showToast.error(errorMessage);
        return;
      }
      setCookie('access_token', res.data.accessToken, {
        path: '/',
        maxAge: 15 * 60,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      if (res.data?.refreshToken) {
        setCookie('refresh_token', res.data.refreshToken, {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }

      showToast.success(t('auth.login.successLogin'));
      router.push('/profile');
    } catch (err: any) {
      const errorMessage = err.error || err.message || t('auth.login.errorLogin');
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          <span className="text-muted-foreground">{t('auth.login.noAccount')} </span>
          <a href="/registry" className="font-semibold text-primary hover:text-accent transition-colors">
            {t('auth.login.registerLink')}
          </a>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t('auth.login.email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t('auth.login.password')}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-card border-input hover:border-primary/30 focus:border-primary"
            required
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 h-10"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.login.buttonLoading')}
            </>
          ) : (
            t('auth.login.button')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
