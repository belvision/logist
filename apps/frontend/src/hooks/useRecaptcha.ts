'use client';

import { useRecaptcha } from '@/components/auth/RecaptchaProvider';
import { useCallback } from 'react';

export function useRecaptchaToken() {
  const { executeRecaptcha, config, isLoaded } = useRecaptcha();

  const getRecaptchaToken = useCallback(async (action: string): Promise<string | null> => {
    if (!config?.enabled || !isLoaded) {
      return null;
    }

    try {
      const token = await executeRecaptcha(action);
      return token;
    } catch (error) {
      console.error('Failed to get reCAPTCHA token:', error);
      return null;
    }
  }, [executeRecaptcha, config, isLoaded]);

  return {
    getRecaptchaToken,
    isEnabled: config?.enabled || false,
    isLoaded
  };
}
