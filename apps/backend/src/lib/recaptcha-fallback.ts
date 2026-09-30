// apps/backend/src/lib/recaptcha-fallback.ts
/**
 * Fallback механизм для reCAPTCHA
 * Обеспечивает работу системы даже при проблемах с reCAPTCHA
 */

interface RecaptchaFallbackConfig {
  enabled: boolean;
  maxFailures: number;
  failureWindow: number; // в миллисекундах
  cooldownPeriod: number; // в миллисекундах
}

class RecaptchaFallbackService {
  private config: RecaptchaFallbackConfig;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private isInCooldown: boolean = false;

  constructor() {
    this.config = {
      enabled: process.env.RECAPTCHA_FALLBACK_ENABLED === 'true',
      maxFailures: parseInt(process.env.RECAPTCHA_MAX_FAILURES || '5'),
      failureWindow: parseInt(process.env.RECAPTCHA_FAILURE_WINDOW || '300000'), // 5 минут
      cooldownPeriod: parseInt(process.env.RECAPTCHA_COOLDOWN_PERIOD || '600000') // 10 минут
    };
  }

  /**
   * Проверяет, нужно ли использовать fallback режим
   */
  shouldUseFallback(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    
    // Сбрасываем счетчик, если прошло достаточно времени
    if (now - this.lastFailureTime > this.config.failureWindow) {
      this.failureCount = 0;
    }

    // Проверяем, находимся ли в периоде охлаждения
    if (this.isInCooldown && now - this.lastFailureTime < this.config.cooldownPeriod) {
      return true;
    }

    // Сбрасываем период охлаждения, если он истек
    if (this.isInCooldown && now - this.lastFailureTime >= this.config.cooldownPeriod) {
      this.isInCooldown = false;
      this.failureCount = 0;
    }

    return this.failureCount >= this.config.maxFailures;
  }

  /**
   * Регистрирует неудачную попытку reCAPTCHA
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.maxFailures) {
      this.isInCooldown = true;
      console.warn(`[RECAPTCHA FALLBACK] Too many failures (${this.failureCount}), entering cooldown period`);
    }
  }

  /**
   * Регистрирует успешную попытку reCAPTCHA
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.isInCooldown = false;
  }

  /**
   * Получает статус fallback режима
   */
  getStatus(): {
    isActive: boolean;
    failureCount: number;
    isInCooldown: boolean;
    timeUntilReset: number;
  } {
    const now = Date.now();
    const timeUntilReset = this.isInCooldown 
      ? Math.max(0, this.config.cooldownPeriod - (now - this.lastFailureTime))
      : Math.max(0, this.config.failureWindow - (now - this.lastFailureTime));

    return {
      isActive: this.shouldUseFallback(),
      failureCount: this.failureCount,
      isInCooldown: this.isInCooldown,
      timeUntilReset
    };
  }
}

// Экспортируем singleton
export const recaptchaFallback = new RecaptchaFallbackService();
