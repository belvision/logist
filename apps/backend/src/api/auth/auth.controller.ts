import { registerSchema, loginSchema, mfaSetupVerifySchema, mfaVerifySchema, mfaDisableSchema, mfaRecoveryRegenerateSchema, googleLoginSchema } from './auth.schema';
import { registerUser, loginUser, meFromToken, refreshTokens, updatePasswordService, startMfaSetup, verifyMfaSetup, verifySecondFactor, disableMfa, regenerateRecoveryCodes, googleLogin } from './auth.service';
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
        console.log('❌ [AUTH CONTROLLER] reCAPTCHA verification failed:', recaptchaResult.error);
        // Не блокируем регистрацию при ошибке reCAPTCHA, только логируем
        console.warn('🔍 [AUTH CONTROLLER] Continuing registration despite reCAPTCHA failure');
      } else {
        console.log('✅ [AUTH CONTROLLER] reCAPTCHA verification passed');
      }
    } catch (error) {
      console.error('❌ [AUTH CONTROLLER] reCAPTCHA verification error:', error);
      // Не блокируем регистрацию при ошибке reCAPTCHA
      console.warn('🔍 [AUTH CONTROLLER] Continuing registration despite reCAPTCHA error');
    }
  } else {
    console.log('🔍 [AUTH CONTROLLER] No reCAPTCHA token provided for registration');
  }

  const res = await registerUser({ ...parsed.data, inviteToken: (sanitizedBody && sanitizedBody.inviteToken) || undefined });
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function loginHandler(c: any) {
  try {
    console.log('🔍 [AUTH CONTROLLER] ===== LOGIN REQUEST =====');
    console.log('🔍 [AUTH CONTROLLER] URL:', c.req.url);
    console.log('🔍 [AUTH CONTROLLER] Method:', c.req.method);
    console.log('🔍 [AUTH CONTROLLER] Headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers), null, 2));
    
    const body = await c.req.json();
    console.log('🔍 [AUTH CONTROLLER] Request body:', { email: body.email, hasPassword: !!body.password, hasRecaptcha: !!body.recaptchaToken });
    
    // Санитизация входных данных
    const sanitizedBody = DataSanitizer.sanitizeObject(body);
    console.log('🔍 [AUTH CONTROLLER] Sanitized body:', { email: sanitizedBody.email, hasPassword: !!sanitizedBody.password });
    
    // Проверка на опасный контент
    if (sanitizedBody.email && DataSanitizer.isDangerous(sanitizedBody.email)) {
      console.log('❌ [AUTH CONTROLLER] Dangerous content detected');
      return c.json({ error: 'Обнаружен потенциально опасный контент' }, 400);
    }
    
    const parsed = loginSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      console.log('❌ [AUTH CONTROLLER] Validation failed:', parsed.error.flatten());
      return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
    }
    console.log('✅ [AUTH CONTROLLER] Validation passed');

    // Проверка reCAPTCHA
    if (parsed.data.recaptchaToken) {
      console.log('🔍 [AUTH CONTROLLER] Verifying reCAPTCHA...');
      try {
        const recaptchaResult = await verifyRecaptchaToken(parsed.data.recaptchaToken, 'login');
        if (!recaptchaResult.success) {
          console.log('❌ [AUTH CONTROLLER] reCAPTCHA verification failed:', recaptchaResult.error);
          // Не блокируем вход при ошибке reCAPTCHA, только логируем
          console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA failure');
        } else {
          console.log('✅ [AUTH CONTROLLER] reCAPTCHA verification passed');
        }
      } catch (error) {
        console.error('❌ [AUTH CONTROLLER] reCAPTCHA verification error:', error);
        // Не блокируем вход при ошибке reCAPTCHA
        console.warn('🔍 [AUTH CONTROLLER] Continuing login despite reCAPTCHA error');
      }
    } else {
      console.log('🔍 [AUTH CONTROLLER] No reCAPTCHA token provided');
    }

    console.log('🔍 [AUTH CONTROLLER] Calling loginUser...');
    const res = await loginUser(parsed.data);
    console.log('🔍 [AUTH CONTROLLER] loginUser result:', { 
      ok: res.ok, 
      status: res.status, 
      hasToken: !!(res as any).token,
      error: (res as any).error 
    });
    
    if (!res.ok) {
      console.log('❌ [AUTH CONTROLLER] Login failed:', res.error);
      return c.json({ error: res.error }, res.status);
    }
    
    if ((res as any).requiresMfa) {
      console.log('🔍 [AUTH CONTROLLER] MFA required');
      return c.json({ requiresMfa: true, pendingMfaToken: (res as any).pendingMfaToken }, 200);
    }
    
    console.log('✅ [AUTH CONTROLLER] Login successful, returning tokens');
    return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
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
  const body = await c.req.json().catch(() => ({}));
  
  if (!body.password || !body.id_user) {
    return c.json({ error: 'Необходимо указать пароль и ID пользователя' }, 400);
  }
  
  const result = await updatePasswordService({
    password: body.password, 
    id_user: body.id_user
  });
  
  if (!result.ok) {
    return c.json({ error: result.error }, result.status);
  }
  
  return c.json({ message: 'Пароль успешно обновлен' }, 200);
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
  if ((res as any).requiresMfa) return c.json({ requiresMfa: true, pendingMfaToken: (res as any).pendingMfaToken }, 200);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
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
    console.log('🔍 [RECAPTCHA CONFIG] Request received');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const siteKey = process.env.RECAPTCHA_SITE_KEY || '';
    const disableRecaptcha = process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === 'true';
    
    console.log('🔍 [RECAPTCHA CONFIG] Environment check:', {
      isProduction,
      hasSiteKey: !!siteKey,
      disableRecaptcha
    });
    
    // Проверяем, отключена ли reCAPTCHA через переменную окружения
    if (disableRecaptcha) {
      console.log('🔍 [RECAPTCHA CONFIG] reCAPTCHA disabled via environment variable');
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
      console.log('🔍 [RECAPTCHA CONFIG] Development mode - reCAPTCHA disabled');
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
    
    console.log('🔍 [RECAPTCHA CONFIG] Returning config:', config);
    
    return c.json(config, 200);
  } catch (error) {
    console.error('❌ [RECAPTCHA CONFIG] Error:', error);
    return c.json({ error: 'Ошибка получения конфигурации reCAPTCHA' }, 500);
  }
}
