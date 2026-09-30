import { z } from 'zod';
import { PasswordManager } from '../../lib/password';

// Кастомная валидация пароля
const passwordValidation = z.string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .max(128, 'Пароль не должен превышать 128 символов')
  .refine((password) => {
    const validation = PasswordManager.validatePassword(password);
    return validation.isValid;
  }, {
    message: 'Пароль не соответствует требованиям безопасности'
  });

export const registerSchema = z.object({
  email: z.string()
    .email('Некорректный формат email')
    .min(5, 'Email слишком короткий')
    .max(254, 'Email слишком длинный')
    .transform((email) => email.toLowerCase().trim()),
  password: passwordValidation,
  firstName: z.string()
    .min(1, 'Имя обязательно')
    .max(50, 'Имя слишком длинное')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/, 'Имя может содержать только буквы, пробелы, дефисы и апострофы')
    .optional(),
  lastName: z.string()
    .min(1, 'Фамилия обязательна')
    .max(50, 'Фамилия слишком длинная')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/, 'Фамилия может содержать только буквы, пробелы, дефисы и апострофы')
    .optional(),
  username: z.string()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(24, 'Имя пользователя не должно превышать 24 символа')
    .regex(/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  recaptchaToken: z.string().optional(), // reCAPTCHA токен (опциональный для обратной совместимости)
});

export const loginSchema = z.object({
  email: z.string()
    .email('Некорректный формат email')
    .transform((email) => email.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Пароль обязателен')
    .max(128, 'Пароль слишком длинный'),
  recaptchaToken: z.string().optional(), // reCAPTCHA токен (опциональный для обратной совместимости)
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

// MFA schemas
export const mfaSetupStartSchema = z.object({});

export const mfaSetupVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  mfaSetupToken: z.string().min(10),
});

export const mfaVerifySchema = z
  .object({
    pendingMfaToken: z.string().min(10),
    totpCode: z.string().regex(/^\d{6}$/).optional(),
    recoveryCode: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/).optional(),
    trustDevice: z.boolean().optional(),
  })
  .refine((d) => !!d.totpCode || !!d.recoveryCode, {
    message: 'Either totpCode or recoveryCode must be provided',
  });

export const mfaDisableSchema = z.object({
  password: z.string().min(6),
  totpCode: z.string().regex(/^\d{6}$/),
});

export const mfaRecoveryRegenerateSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/),
});

export type MfaDisableDto = z.infer<typeof mfaDisableSchema>;
export type MfaRecoveryRegenerateDto = z.infer<typeof mfaRecoveryRegenerateSchema>;

export const googleLoginSchema = z
  .object({
    idToken: z.string().min(20).optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
  })
  .refine((d) => !!d.idToken || !!d.email, {
    message: 'Provide idToken or email (dev bypass)'
  });
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;

// Схема для изменения пароля
export const changePasswordSchema = z.object({
  password: passwordValidation,
  id_user: z.string().min(1, 'ID пользователя обязателен'),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

