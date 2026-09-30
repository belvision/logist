// apps/backend/src/lib/recaptcha.ts
import { recaptchaFallback } from './recaptcha-fallback';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  score?: number;
  action?: string;
}

interface RecaptchaConfig {
  secretKey: string;
  minScore: number;
  timeout: number;
}

class RecaptchaService {
  private config: RecaptchaConfig;

  constructor() {
    this.config = {
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
      minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.3'), // Более мягкая проверка по умолчанию
      timeout: parseInt(process.env.RECAPTCHA_TIMEOUT || '5000')
    };

    if (!this.config.secretKey) {
      console.warn('[RECAPTCHA] Secret key not configured. reCAPTCHA validation will be disabled.');
    }
  }

  /**
   * Проверяет токен reCAPTCHA v3
   */
  async verifyToken(token: string, expectedAction?: string): Promise<{
    success: boolean;
    score?: number;
    error?: string;
  }> {
    // Проверяем fallback режим
    if (recaptchaFallback.shouldUseFallback()) {
      console.warn('[RECAPTCHA] Using fallback mode due to previous failures');
      return { success: true, score: 0.5 };
    }

    if (!this.config.secretKey) {
      // В режиме разработки без ключа пропускаем проверку
      console.warn('[RECAPTCHA] Skipping verification - no secret key configured');
      return { success: true, score: 1.0 };
    }

    if (!token || token.trim().length === 0) {
      console.warn('[RECAPTCHA] No token provided, but allowing request to continue');
      return { success: true, score: 1.0 }; // Более мягкая обработка отсутствующего токена
    }

    try {
      const response = await this.makeRecaptchaRequest(token, expectedAction);
      
      if (!response.success) {
        const errorCodes = response['error-codes'] || [];
        console.warn('[RECAPTCHA] Verification failed, recording failure');
        recaptchaFallback.recordFailure();
        return {
          success: false,
          error: `reCAPTCHA verification failed: ${errorCodes.join(', ')}`
        };
      }

      // Регистрируем успешную попытку
      recaptchaFallback.recordSuccess();

      // Проверяем минимальный score для v3
      if (response.score !== undefined && response.score < this.config.minScore) {
        return {
          success: false,
          error: `reCAPTCHA score too low: ${response.score} (minimum: ${this.config.minScore})`
        };
      }

      // Проверяем action для v3 (если указан)
      if (expectedAction && response.action && response.action !== expectedAction) {
        return {
          success: false,
          error: `reCAPTCHA action mismatch: expected '${expectedAction}', got '${response.action}'`
        };
      }

      return {
        success: true,
        score: response.score
      };

    } catch (error) {
      console.error('[RECAPTCHA] Verification error:', error);
      // Регистрируем неудачу при сетевой ошибке
      recaptchaFallback.recordFailure();
      // В случае сетевой ошибки, не блокируем пользователя
      console.warn('[RECAPTCHA] Network error, allowing request to continue');
      return {
        success: true,
        score: 0.5 // Средний score при ошибке сети
      };
    }
  }

  /**
   * Выполняет запрос к Google reCAPTCHA API
   */
  private async makeRecaptchaRequest(token: string, expectedAction?: string): Promise<RecaptchaResponse> {
    const formData = new URLSearchParams();
    formData.append('secret', this.config.secretKey);
    formData.append('response', token);
    
    if (expectedAction) {
      formData.append('action', expectedAction);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as RecaptchaResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[RECAPTCHA] Request error:', error);
      // Не выбрасываем ошибку, а возвращаем неуспешный результат
      return {
        success: false,
        'error-codes': ['network-error']
      } as RecaptchaResponse;
    }
  }

  /**
   * Проверяет, настроен ли reCAPTCHA
   */
  isConfigured(): boolean {
    return !!this.config.secretKey;
  }

  /**
   * Получает минимальный score
   */
  getMinScore(): number {
    return this.config.minScore;
  }
}

// Экспортируем singleton
export const recaptchaService = new RecaptchaService();

/**
 * Middleware для проверки reCAPTCHA
 */
export function createRecaptchaMiddleware(expectedAction?: string) {
  return async (c: any, next: any) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // В локальной разработке всегда пропускаем проверку reCAPTCHA
    if (!isProduction) {
      return await next();
    }
    
    // Пропускаем проверку в продакшене, если reCAPTCHA не настроена
    if (!recaptchaService.isConfigured()) {
      console.warn('[RECAPTCHA] Skipping verification - not configured in production');
      return await next();
    }

    const token = c.req.header('x-recaptcha-token') || 
                  (await c.req.json().catch(() => ({}))).recaptchaToken;

    if (!token) {
      return c.json({ 
        error: 'reCAPTCHA token is required',
        code: 'RECAPTCHA_MISSING'
      }, 400);
    }

    const verification = await recaptchaService.verifyToken(token, expectedAction);
    
    if (!verification.success) {
      return c.json({ 
        error: verification.error || 'reCAPTCHA verification failed',
        code: 'RECAPTCHA_FAILED',
        score: verification.score
      }, 400);
    }

    // Добавляем информацию о reCAPTCHA в контекст
    c.set('recaptcha', {
      verified: true,
      score: verification.score
    });

    return await next();
  };
}

/**
 * Утилита для проверки reCAPTCHA в контроллерах
 */
export async function verifyRecaptchaToken(token: string, action?: string): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  return await recaptchaService.verifyToken(token, action);
}
