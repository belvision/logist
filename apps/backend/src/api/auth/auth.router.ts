import { Hono } from 'hono';
import { registerHandler, loginHandler, meHandler, refreshHandler, changePasswordHandler, mfaSetupStartHandler, mfaSetupVerifyHandler, mfaVerifyHandler, mfaDisableHandler, mfaRecoveryRegenerateHandler, googleLoginHandler, generatePasswordHandler, checkPasswordStrengthHandler, getRecaptchaConfigHandler, verifyEmailHandler, resendEmailVerificationHandler, checkEmailVerificationHandler } from './auth.controller';
import { authenticate } from '../middleware/auth';
import { createRateLimitMiddleware, authRateLimiter, registrationRateLimiter, getAuthKey, getRegistrationKey } from '../../lib/rateLimiter';

export const authRouter = new Hono();

// POST /auth/register - Регистрация нового пользователя (с rate limiting)
authRouter.post('/register', 
  createRateLimitMiddleware(registrationRateLimiter, getRegistrationKey),
  registerHandler
);

// POST /auth/login - Вход в систему (с rate limiting)
authRouter.post('/login', 
  createRateLimitMiddleware(authRateLimiter, getAuthKey),
  loginHandler
);
// GET /auth/me - Получить данные текущего пользователя
authRouter.get('/me', meHandler);
// POST /auth/refresh - Обновить токен доступа
authRouter.post('/refresh', refreshHandler);
// PATCH /auth/change-password - Изменить пароль
authRouter.patch('/change-password', authenticate, changePasswordHandler);
// MFA routes
// POST /auth/mfa/setup/start - Начать настройку MFA
authRouter.post('/mfa/setup/start', authenticate, mfaSetupStartHandler);
// POST /auth/mfa/setup/verify - Подтвердить настройку MFA
authRouter.post('/mfa/setup/verify', authenticate, mfaSetupVerifyHandler);
// POST /auth/mfa/verify - Проверить MFA код
authRouter.post('/mfa/verify', mfaVerifyHandler);
// POST /auth/mfa/disable - Отключить MFA
authRouter.post('/mfa/disable', authenticate, mfaDisableHandler);
// POST /auth/mfa/recovery/regenerate - Перегенерировать коды восстановления
authRouter.post('/mfa/recovery/regenerate', authenticate, mfaRecoveryRegenerateHandler);
// POST /auth/google/login - Вход через Google
authRouter.post('/google/login', googleLoginHandler);

// GET /auth/generate-password - Генерация паролей
authRouter.get('/generate-password', generatePasswordHandler);

// POST /auth/check-password-strength - Проверка силы пароля
authRouter.post('/check-password-strength', checkPasswordStrengthHandler);

// GET /auth/recaptcha-config - Получение конфигурации reCAPTCHA
authRouter.get('/recaptcha-config', getRecaptchaConfigHandler);

// Email verification routes
// GET /auth/verify-email?token=... - Подтвердить email по токену
authRouter.get('/verify-email', verifyEmailHandler);
// POST /auth/resend-verification - Повторно отправить письмо подтверждения
authRouter.post('/resend-verification', authenticate, resendEmailVerificationHandler);
// GET /auth/check-verification - Проверить статус подтверждения email
authRouter.get('/check-verification', authenticate, checkEmailVerificationHandler);

