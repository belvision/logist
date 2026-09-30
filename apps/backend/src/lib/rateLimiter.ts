// apps/backend/src/lib/rateLimiter.ts
import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number; // Время окна в миллисекундах
  maxRequests: number; // Максимальное количество запросов
  message?: string; // Сообщение при превышении лимита
  skipSuccessfulRequests?: boolean; // Пропускать успешные запросы
  skipFailedRequests?: boolean; // Пропускать неудачные запросы
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blockedUntil?: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Очистка старых записей каждые 5 минут
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Проверяет лимит для ключа
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Получаем или создаем запись для ключа
    let record = this.store[key];
    
    if (!record || record.resetTime < now) {
      // Создаем новую запись
      record = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.store[key] = record;
    }

    // Проверяем, не заблокирован ли ключ
    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      };
    }

    // Увеличиваем счетчик
    record.count++;

    const allowed = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    // Если превышен лимит, блокируем на время окна
    if (!allowed) {
      record.blockedUntil = record.resetTime;
    }

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
      retryAfter: !allowed ? Math.ceil((record.resetTime - now) / 1000) : undefined
    };
  }

  /**
   * Очищает старые записи
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      const record = this.store[key];
      if (record.resetTime < now && (!record.blockedUntil || record.blockedUntil < now)) {
        delete this.store[key];
      }
    });
  }

  /**
   * Сбрасывает лимит для ключа
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Получает статистику для ключа
   */
  getStats(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
    blockedUntil?: number;
  } | null {
    const record = this.store[key];
    if (!record) return null;

    const now = Date.now();
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    return {
      count: record.count,
      remaining,
      resetTime: record.resetTime,
      blockedUntil: record.blockedUntil
    };
  }
}

// Создаем экземпляры rate limiter для разных эндпоинтов
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  maxRequests: 20, // 20 попыток входа (увеличено для удобства пользователей)
  message: 'Слишком много попыток входа. Попробуйте позже.'
});

export const registrationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  maxRequests: 3, // 3 регистрации в час
  message: 'Слишком много попыток регистрации. Попробуйте позже.'
});

export const generalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  maxRequests: 100, // 100 запросов
  message: 'Слишком много запросов. Попробуйте позже.'
});

/**
 * Middleware для rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter, getKey?: (c: Context) => string) {
  return async (c: Context, next: Next) => {
    // Получаем ключ для rate limiting
    const key = getKey ? getKey(c) : getDefaultKey(c);
    
    // Проверяем лимит
    const result = limiter.check(key);
    
    // Добавляем заголовки
    c.header('X-RateLimit-Limit', limiter['config'].maxRequests.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (result.retryAfter) {
      c.header('Retry-After', result.retryAfter.toString());
    }
    
    if (!result.allowed) {
      return c.json({
        error: limiter['config'].message || 'Rate limit exceeded',
        retryAfter: result.retryAfter
      }, 429);
    }
    
    return await next();
  };
}

/**
 * Получает ключ по умолчанию (IP + User-Agent)
 */
function getDefaultKey(c: Context): string {
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

/**
 * Получает ключ для авторизации (IP + email)
 */
export function getAuthKey(c: Context): string {
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';
  
  try {
    const body = c.req.raw.body;
    if (body) {
      // Для POST запросов с JSON телом
      return `${ip}:auth`;
    }
  } catch (error) {
    // Игнорируем ошибки парсинга
  }
  
  return `${ip}:auth`;
}

/**
 * Получает ключ для регистрации (IP)
 */
export function getRegistrationKey(c: Context): string {
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';
  
  return `${ip}:registration`;
}
