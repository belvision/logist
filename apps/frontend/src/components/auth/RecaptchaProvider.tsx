'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

interface RecaptchaProviderProps {
  children: React.ReactNode;
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const [config, setConfig] = useState<RecaptchaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем конфигурацию reCAPTCHA
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const isProduction = process.env.NODE_ENV === 'production';
        
        // В локальной разработке всегда отключаем reCAPTCHA
        if (!isProduction) {
          console.log('[RECAPTCHA] Disabled in development mode');
          setConfig({
            enabled: false,
            siteKey: null,
            version: 'v3',
            minScore: 0.5
          });
          setLoading(false);
          return;
        }
        
        // Проверяем, отключена ли reCAPTCHA через переменную окружения (для продакшена)
        if (process.env['NEXT_PUBLIC_DISABLE_RECAPTCHA'] === 'true') {
          console.log('[RECAPTCHA] Disabled via NEXT_PUBLIC_DISABLE_RECAPTCHA environment variable');
          setConfig({
            enabled: false,
            siteKey: null,
            version: 'v3',
            minScore: 0.5
          });
          setLoading(false);
          return;
        }
        
        // Используем централизованную конфигурацию API
        const { API_BASE } = await import('@/lib/config');
        
        console.log('[RECAPTCHA] Using API_BASE:', API_BASE);
        console.log('[RECAPTCHA] Requesting config from:', `${API_BASE}/api/auth/recaptcha-config`);
        
        // Создаем AbortController для timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/api/auth/recaptcha-config`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[RECAPTCHA] Config received:', data);
        setConfig(data);
        
        // Загружаем reCAPTCHA скрипт только если он включен
        if (data.enabled && data.siteKey) {
          console.log('[RECAPTCHA] Loading reCAPTCHA script with siteKey:', data.siteKey);
          await loadRecaptchaScript(data.siteKey);
        } else {
          console.log('[RECAPTCHA] reCAPTCHA disabled or no siteKey provided');
        }
      } catch (err: any) {
        console.warn('Recaptcha config error:', err);
        
        // Логируем детали ошибки для отладки
        if (err.name === 'AbortError') {
          console.warn('[RECAPTCHA] Request timeout - backend may be unavailable');
        } else if (err.message?.includes('502')) {
          console.warn('[RECAPTCHA] Backend unavailable (502 Bad Gateway)');
        } else if (err.message?.includes('404')) {
          console.warn('[RECAPTCHA] Endpoint not found (404)');
        } else {
          console.warn('[RECAPTCHA] Network error:', err.message);
        }
        
        // В случае ошибки устанавливаем конфигурацию по умолчанию (отключенную)
        setConfig({
          enabled: false,
          siteKey: null,
          version: 'v3',
          minScore: 0.5
        });
        setError(null); // Не показываем ошибку пользователю, просто отключаем reCAPTCHA
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Загружаем скрипт reCAPTCHA
  const loadRecaptchaScript = useCallback((siteKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Проверяем, не загружен ли уже скрипт
      if (window.grecaptcha) {
        setIsLoaded(true);
        resolve();
        return;
      }

      // Проверяем, не загружается ли уже скрипт
      if (document.querySelector('script[src*="recaptcha"]')) {
        // Ждем загрузки существующего скрипта
        const checkLoaded = () => {
          if (window.grecaptcha) {
            setIsLoaded(true);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Ждем инициализации grecaptcha
        const initRecaptcha = () => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(() => {
              setIsLoaded(true);
              resolve();
            });
          } else {
            setTimeout(initRecaptcha, 100);
          }
        };
        initRecaptcha();
      };
      
      script.onerror = () => {
        setError('Ошибка загрузки reCAPTCHA');
        reject(new Error('Failed to load reCAPTCHA script'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // Выполняем reCAPTCHA
  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!config?.enabled || !config.siteKey || !isLoaded || !window.grecaptcha) {
      console.warn('reCAPTCHA not available');
      return null;
    }

    try {
      // Добавляем таймаут для выполнения reCAPTCHA
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('reCAPTCHA timeout')), 10000);
      });
      
      const tokenPromise = window.grecaptcha.execute(config.siteKey, { action });
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (!token) {
        console.warn('reCAPTCHA returned empty token');
        return null;
      }
      
      return token;
    } catch (err) {
      console.error('reCAPTCHA execution error:', err);
      // Не устанавливаем ошибку в состояние, чтобы не блокировать пользователя
      return null;
    }
  }, [config, isLoaded]);

  const value: RecaptchaContextType = {
    config,
    loading,
    error,
    executeRecaptcha,
    isLoaded
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

// Типы для глобального объекта grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
