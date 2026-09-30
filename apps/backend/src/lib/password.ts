// apps/backend/src/lib/password.ts
import crypto from 'crypto';

/**
 * Класс для валидации и генерации паролей
 */
export class PasswordManager {
  /**
   * Проверяет сложность пароля
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number; // 0-100
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Минимальная длина
    if (password.length < 8) {
      errors.push('Пароль должен содержать минимум 8 символов');
    } else if (password.length >= 12) {
      score += 20;
    } else {
      score += 10;
    }

    // Проверка на наличие заглавных букв
    if (!/[A-ZА-Я]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну заглавную букву');
    } else {
      score += 15;
    }

    // Проверка на наличие строчных букв
    if (!/[a-zа-я]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну строчную букву');
    } else {
      score += 15;
    }

    // Проверка на наличие цифр
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну цифру');
    } else {
      score += 15;
    }

    // Проверка на наличие специальных символов
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и т.д.)');
    } else {
      score += 20;
    }

    // Проверка на повторяющиеся символы
    const hasRepeatingChars = /(.)\1{2,}/.test(password);
    if (hasRepeatingChars) {
      errors.push('Пароль не должен содержать более 2 одинаковых символов подряд');
    } else {
      score += 10;
    }

    // Проверка на последовательности
    const hasSequences = this.hasSequentialChars(password);
    if (hasSequences) {
      suggestions.push('Избегайте простых последовательностей (123, abc, qwe)');
    } else {
      score += 5;
    }

    // Проверка на общие пароли
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'пароль', '12345', 'qwerty123', 'admin123', 'password12'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
      errors.push('Пароль слишком простой и распространенный');
    } else {
      score += 10;
    }

    // Дополнительные предложения
    if (password.length < 12) {
      suggestions.push('Используйте пароль длиной не менее 12 символов');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      suggestions.push('Добавьте специальные символы для повышения безопасности');
    }
    if (score < 70) {
      suggestions.push('Пароль можно сделать более сложным');
    }

    const isValid = errors.length === 0 && score >= 60;

    return {
      isValid,
      score: Math.min(score, 100),
      errors,
      suggestions
    };
  }

  /**
   * Проверяет наличие последовательных символов
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'zyxwvutsrqponmlkjihgfedcba',
      '0123456789',
      '9876543210',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();
    
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        if (lowerPassword.includes(substr)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Генерирует сложный пароль
   */
  static generatePassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  } = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    
    if (includeUppercase) {
      charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    
    if (includeLowercase) {
      charset += excludeSimilar ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    
    if (includeNumbers) {
      charset += excludeSimilar ? '23456789' : '0123456789';
    }
    
    if (includeSymbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (charset.length === 0) {
      throw new Error('Необходимо включить хотя бы один тип символов');
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    // Убеждаемся, что пароль соответствует требованиям
    const validation = this.validatePassword(password);
    if (!validation.isValid) {
      // Если сгенерированный пароль не проходит валидацию, генерируем заново
      return this.generatePassword(options);
    }

    return password;
  }

  /**
   * Генерирует несколько вариантов паролей
   */
  static generatePasswordSuggestions(count: number = 3): string[] {
    const suggestions: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const length = 12 + Math.floor(Math.random() * 6); // 12-17 символов
      suggestions.push(this.generatePassword({ length }));
    }
    
    return suggestions;
  }

  /**
   * Оценивает силу пароля (0-100)
   */
  static getPasswordStrength(password: string): {
    score: number;
    level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
    label: string;
  } {
    const validation = this.validatePassword(password);
    const score = validation.score;
    
    let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
    let label: string;
    
    if (score < 20) {
      level = 'very-weak';
      label = 'Очень слабый';
    } else if (score < 40) {
      level = 'weak';
      label = 'Слабый';
    } else if (score < 60) {
      level = 'fair';
      label = 'Удовлетворительный';
    } else if (score < 80) {
      level = 'good';
      label = 'Хороший';
    } else {
      level = 'strong';
      label = 'Отличный';
    }
    
    return { score, level, label };
  }
}

