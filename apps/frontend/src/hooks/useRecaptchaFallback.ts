'use client';

import { useCallback } from 'react';

export function useRecaptchaToken() {
  const getRecaptchaToken = useCallback(async (_action: string): Promise<string | null> => {
    // reCAPTCHA отключена - возвращаем null
    return null;
  }, []);

  return {
    getRecaptchaToken,
    isEnabled: false,
    isLoaded: true
  };
}
