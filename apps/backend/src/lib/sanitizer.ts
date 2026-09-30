// apps/backend/src/lib/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * Класс для санитизации входных данных
 */
export class DataSanitizer {
  /**
   * Санитизирует строку от потенциально опасного контента
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Удаляем HTML теги и потенциально опасные символы
    let sanitized = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Дополнительная очистка от SQL инъекций
    sanitized = this.removeSQLInjectionPatterns(sanitized);
    
    // Удаляем управляющие символы
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Нормализуем пробелы
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Санитизирует email
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    // Приводим к нижнему регистру и обрезаем пробелы
    let sanitized = email.toLowerCase().trim();
    
    // Удаляем потенциально опасные символы
    sanitized = sanitized.replace(/[<>\"'%;()&+]/g, '');
    
    // Проверяем базовый формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      return '';
    }
    
    return sanitized;
  }

  /**
   * Санитизирует пароль
   */
  static sanitizePassword(password: string): string {
    if (typeof password !== 'string') {
      return '';
    }

    // Удаляем только HTML теги, но сохраняем специальные символы
    let sanitized = DOMPurify.sanitize(password, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Удаляем управляющие символы, но сохраняем печатные
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    return sanitized;
  }

  /**
   * Удаляет паттерны SQL инъекций
   */
  private static removeSQLInjectionPatterns(input: string): string {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
      /(UNION\s+SELECT)/gi,
      /(DROP\s+TABLE)/gi,
      /(INSERT\s+INTO)/gi,
      /(DELETE\s+FROM)/gi,
      /(UPDATE\s+SET)/gi,
      /(CREATE\s+TABLE)/gi,
      /(ALTER\s+TABLE)/gi,
      /(EXEC\s*\()/gi,
      /(SCRIPT\s*\()/gi
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  /**
   * Валидирует и санитизирует объект
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          sanitized[key as keyof T] = this.sanitizeEmail(value) as T[keyof T];
        } else if (key.toLowerCase().includes('password')) {
          sanitized[key as keyof T] = this.sanitizePassword(value) as T[keyof T];
        } else {
          sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Проверяет, содержит ли строка потенциально опасный контент
   */
  static isDangerous(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /@import/gi,
      /eval\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Ограничивает длину строки
   */
  static limitLength(input: string, maxLength: number): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input.length > maxLength ? input.substring(0, maxLength) : input;
  }

  /**
   * Нормализует строку для поиска
   */
  static normalizeForSearch(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Удаляем специальные символы
      .replace(/\s+/g, ' '); // Нормализуем пробелы
  }
}

