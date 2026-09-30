import { registerSchema, loginSchema, mfaSetupVerifySchema, mfaVerifySchema, mfaDisableSchema, mfaRecoveryRegenerateSchema, googleLoginSchema, changePasswordSchema } from './auth.schema';
import { registerUser, loginUser, meFromToken, refreshTokens, updatePasswordService, startMfaSetup, verifyMfaSetup, verifySecondFactor, disableMfa, regenerateRecoveryCodes, googleLogin, verifyEmail, resendEmailVerification, checkEmailVerification } from './auth.service';
import { verifyAccessToken } from '../../core/auth/jwt.service';
import { DataSanitizer } from '../../lib/sanitizer';
import { PasswordManager } from '../../lib/password';
import { verifyRecaptchaToken } from '../../lib/recaptcha';

export async function registerHandler(c: any) {
  const body = await c.req.json();
  
  // Санитизация входных данных
  const sanitizedBody = DataSanitizer.sanitizeObject(body);
  
  // Проверка на опасный контент
  const dangerousFields = ['email', 'firstName', 'lastName', 'username'];
  for (const field of dangerousFields) {
    if (sanitizedBody[field] && DataSanitizer.isDangerous(sanitizedBody[field])) {
      return c.json({ error: 'Обнаружен потенциально опасный контент' }, 400);
    }
  }
  
  const parsed = registerSchema.safeParse(sanitizedBody);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  // Проверка reCAPTCHA
  if (parsed.data.recaptchaToken) {
    try {
      const recaptchaResult = await verifyRecaptchaToken(parsed.data.recaptchaToken, 'register');
      if (!recaptchaResult.success) {
        // Не блокируем регистрацию при ошибке reCAPTCHA, только логируем
        console.warn('🔍 [AUTH CONTROLLER] Continuing registration despite reCAPTCHA failure');
      } else {
      }
    } catch (error) {
      console.error('❌ [AUTH CONTROLLER] reCAPTCHA verification error:', error);
      // Не блокируем регистрацию при ошибке reCAPTCHA
      console.warn('🔍 [AUTH CONTROLLER] Continuing registration despite reCAPTCHA error');
    }
  } else {
  }

  const res = await registerUser({ ...parsed.data, inviteToken: (sanitizedBody && sanitizedBody.inviteToken) || undefined });
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function loginHandler(c: any) {
  try {
    
    const body = await c.req.json();
    
    // Санитизация входных данных
    const sanitizedBody = DataSanitizer.sanitizeObject(body);
    
    // Проверка на опасный контент
    if (sanitizedBody.email && DataSanitizer.isDangerous(sanitizedBody.email)) {
      return c.json({ error: 'Обнаружен потенциально опасный контент' }, 400);
    }
    
    const parsed = loginSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
    }

    // Проверка reCAPTCHA
    if (parsed.data.recaptchaToken) {
      try {
        const recaptchaResult = await verifyRecaptchaToken(parsed.data.recaptchaToken, 'login');
        if (!recaptchaResult.success) {
          // Не блокируем вход при ошибке reCAPTCHA, только логируем
          console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA failure');
        } else {
        }
      } catch (error) {
        console.error('❌ [AUTH CONTROLLER] reCAPTCHA verification error:', error);
        // Не блокируем вход при ошибке reCAPTCHA
        console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA error');
      }
    } else {
    }

    const res = await loginUser(parsed.data);
    
    if (!res.ok) {
      return c.json({ error: res.error }, res.status);
    }
    
    if ((res).requiresMfa) {
      return c.json({ requiresMfa: true, pendingMfaToken: (res).pendingMfaToken }, 200);
    }
    
    return c.json({ token: res.token, accessToken: res.token, refreshToken: (res).refreshToken }, 200);
  } catch (error: any) {
    console.error('❌ [AUTH CONTROLLER] Login handler error:', error);
    console.error('❌ [AUTH CONTROLLER] Error stack:', error.stack);
    return c.json({ error: 'Внутренняя ошибка сервера' }, 500);
  }
}

export async function meHandler(c: any) {
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = verifyAccessToken(token) as Record<string, unknown>;
    const user = await meFromToken(decoded);
    return c.json({ user });
  } catch (e: any) {
    if (e?.status === 404) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function refreshHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const token = body?.refreshToken || c.req.header('x-refresh-token');
  if (!token) return c.json({ error: 'No refresh token' }, 400);
  try {
    const pair = refreshTokens(token);
    return c.json({ token: pair.token, accessToken: pair.token, refreshToken: pair.refreshToken }, 200);
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401);
  }
}

export async function changePasswordHandler(c: any) {
  try {
    const body = await c.req.json().catch(() => ({}));
    
    // Санитизация входных данных
    const sanitizedBody = DataSanitizer.sanitizeObject(body);
    
    // Валидация схемы с проверкой сложности пароля
    const parsed = changePasswordSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
    }
    
    const result = await updatePasswordService({
      password: parsed.data.password, 
      id_user: parsed.data.id_user
    });
    
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }
    
    return c.json({ message: 'Пароль успешно обновлен' }, 200);
  } catch (error: any) {
    console.error('❌ [AUTH CONTROLLER] Change password error:', error);
    return c.json({ error: 'Внутренняя ошибка сервера при изменении пароля' }, 500);
  }
}

export async function mfaSetupStartHandler(c: any) {
  // Require authenticated user
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id_user as string;
  const email = decoded.email as string;
  const res = await startMfaSetup(userId, email);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ otpauthUri: res.otpauthUri, qrPngDataUrl: res.qrPngDataUrl, mfaSetupToken: res.mfaSetupToken }, 200);
}

export async function mfaSetupVerifyHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaSetupVerifySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  // Require authenticated user
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id_user as string;
  const res = await verifyMfaSetup(userId, parsed.data as any);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ mfaEnabled: true, recoveryCodes: res.recoveryCodes }, 200);
}

export async function mfaVerifyHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaVerifySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const res = await verifySecondFactor(parsed.data as any);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function mfaDisableHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaDisableSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id_user as string;
  const res = await disableMfa(userId, parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ mfaEnabled: false }, 200);
}

export async function mfaRecoveryRegenerateHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaRecoveryRegenerateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id_user as string;
  const res = await regenerateRecoveryCodes(userId, parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ recoveryCodes: res.recoveryCodes }, 200);
}

export async function googleLoginHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = googleLoginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const res = await googleLogin(parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  if ((res).requiresMfa) return c.json({ requiresMfa: true, pendingMfaToken: (res).pendingMfaToken }, 200);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res).refreshToken }, 200);
}

// Эндпоинт для генерации паролей
export async function generatePasswordHandler(c: any) {
  try {
    const count = parseInt(c.req.query('count') || '3');
    const length = parseInt(c.req.query('length') || '16');
    
    // Ограничиваем параметры для безопасности
    const safeCount = Math.min(Math.max(count, 1), 10);
    const safeLength = Math.min(Math.max(length, 8), 32);
    
    const passwords = [];
    for (let i = 0; i < safeCount; i++) {
      passwords.push(PasswordManager.generatePassword({ length: safeLength }));
    }
    
    return c.json({ 
      passwords,
      count: safeCount,
      length: safeLength,
      requirements: {
        minLength: 8,
        maxLength: 32,
        mustInclude: ['uppercase', 'lowercase', 'numbers', 'symbols']
      }
    }, 200);
  } catch (error) {
    return c.json({ error: 'Ошибка генерации пароля' }, 500);
  }
}

// Эндпоинт для проверки силы пароля
export async function checkPasswordStrengthHandler(c: any) {
  try {
    const body = await c.req.json();
    const { password } = body;
    
    if (!password || typeof password !== 'string') {
      return c.json({ error: 'Пароль обязателен' }, 400);
    }
    
    const validation = PasswordManager.validatePassword(password);
    const strength = PasswordManager.getPasswordStrength(password);
    
    return c.json({
      isValid: validation.isValid,
      score: validation.score,
      strength: strength.level,
      strengthLabel: strength.label,
      errors: validation.errors,
      suggestions: validation.suggestions
    }, 200);
  } catch (error) {
    return c.json({ error: 'Ошибка проверки пароля' }, 500);
  }
}

// Эндпоинт для получения конфигурации reCAPTCHA
export async function getRecaptchaConfigHandler(c: any) {
  try {
    
    const isProduction = process.env.NODE_ENV === 'production';
    const siteKey = process.env.RECAPTCHA_SITE_KEY || '';
    const disableRecaptcha = process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === 'true';
    
    // Проверяем, отключена ли reCAPTCHA через переменную окружения
    if (disableRecaptcha) {
      return c.json({
        enabled: false,
        siteKey: null,
        version: 'v3',
        minScore: 0.5
      }, 200);
    }
    
    // В продакшене reCAPTCHA обязательна, в разработке - опциональна
    const isEnabled = isProduction ? !!siteKey : false;
    
    // В локальной разработке всегда отключаем reCAPTCHA
    if (!isProduction) {
      return c.json({
        enabled: false,
        siteKey: null,
        version: 'v3',
        minScore: 0.5
      }, 200);
    }
    
    const config = {
      enabled: isEnabled,
      siteKey: isEnabled ? siteKey : null,
      version: 'v3',
      minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.3')
    };
    
    return c.json(config, 200);
  } catch (error) {
    console.error('❌ [RECAPTCHA CONFIG] Error:', error);
    return c.json({ error: 'Ошибка получения конфигурации reCAPTCHA' }, 500);
  }
}

// Email verification handlers
export async function verifyEmailHandler(c: any) {
  try {
    const token = c.req.query('token');
    if (!token) {
      return c.json({ error: 'Токен обязателен' }, 400);
    }

    const result = await verifyEmail(token);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ message: result.message }, result.status);
  } catch (error) {
    console.error('Error in verifyEmailHandler:', error);
    return c.json({ error: 'Ошибка подтверждения email' }, 500);
  }
}

export async function resendEmailVerificationHandler(c: any) {
  try {
    const user = c.get('user');
    const userId = user?.id_user;
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const result = await resendEmailVerification(userId);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ message: result.message }, result.status);
  } catch (error) {
    console.error('Error in resendEmailVerificationHandler:', error);
    return c.json({ error: 'Ошибка отправки письма' }, 500);
  }
}

export async function checkEmailVerificationHandler(c: any) {
  try {
    const user = c.get('user');
    const userId = user?.id_user;
    
    if (!userId) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    const result = await checkEmailVerification(userId);
    
    return c.json({ verified: result.verified }, result.status);
  } catch (error) {
    console.error('📧 [CHECK VERIFICATION] Error:', error);
    return c.json({ error: 'Ошибка проверки статуса' }, 500);
  }
}
