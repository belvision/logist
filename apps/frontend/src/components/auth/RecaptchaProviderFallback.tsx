'use client';

import React, { createContext, useContext } from 'react';

interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string | null;
  version: string;
  minScore: number;
}

interface RecaptchaContextType {
  config: RecaptchaConfig | null;
  loading: boolean;
  error: string | null;
  executeRecaptcha: (action: string) => Promise<string | null>;
  isLoaded: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType | null>(null);

interface RecaptchaProviderFallbackProps {
  children: React.ReactNode;
}

export function RecaptchaProviderFallback({ children }: RecaptchaProviderFallbackProps) {
  const value: RecaptchaContextType = {
    config: {
      enabled: false,
      siteKey: null,
      version: 'v3',
      minScore: 0.5
    },
    loading: false,
    error: null,
    executeRecaptcha: async () => null,
    isLoaded: true
  };

  return (
    <RecaptchaContext.Provider value={value}>
      {children}
    </RecaptchaContext.Provider>
  );
}

export function useRecaptcha() {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
}
