import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken } from '../../core/auth/jwt.service';

export async function authenticate(c: Context, next: Next) {
  console.log('🔐 [AUTH MIDDLEWARE] authenticate вызван');
  console.log('🔐 [AUTH MIDDLEWARE] URL:', c.req.url);
  console.log('🔐 [AUTH MIDDLEWARE] Method:', c.req.method);
  
  try {
    const auth = c.req.header('authorization');
    console.log('🔐 [AUTH MIDDLEWARE] Authorization header:', auth ? 'Present' : 'Missing');
    console.log('🔐 [AUTH MIDDLEWARE] Full auth header:', auth);
    
    let token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    console.log('🔐 [AUTH MIDDLEWARE] Extracted token from header:', token ? 'Present' : 'Missing');
    
    // Проверяем, что токен не является undefined или null
    if (token === 'undefined' || token === 'null' || token === '') {
      console.log('❌ [AUTH MIDDLEWARE] Invalid token value:', token);
      token = undefined;
    }
    
    if (!token) {
      token = getCookie(c, 'auth_token') || undefined;
      console.log('🔐 [AUTH MIDDLEWARE] Token from cookie:', token ? 'Present' : 'Missing');
    }
    
    // Также проверим cookie access_token
    if (!token) {
      token = getCookie(c, 'access_token') || undefined;
      console.log('🔐 [AUTH MIDDLEWARE] Token from access_token cookie:', token ? 'Present' : 'Missing');
    }
    
    if (!token) {
      console.log('❌ [AUTH MIDDLEWARE] Токен не найден');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    console.log('🔐 [AUTH MIDDLEWARE] Токен найден, проверяем...');
    console.log('🔐 [AUTH MIDDLEWARE] Token preview:', token.substring(0, 20) + '...');
    console.log('🔐 [AUTH MIDDLEWARE] Token length:', token.length);
    console.log('🔐 [AUTH MIDDLEWARE] Token type:', typeof token);
    console.log('🔐 [AUTH MIDDLEWARE] Full token:', token);
    console.log('🔐 [AUTH MIDDLEWARE] Token starts with:', token.substring(0, 10));
    console.log('🔐 [AUTH MIDDLEWARE] Token ends with:', token.substring(token.length - 10));
    
    try {
      const payload = verifyAccessToken(token);
      console.log('🔐 [AUTH MIDDLEWARE] Payload после верификации:', JSON.stringify(payload, null, 2));
      console.log('🔐 [AUTH MIDDLEWARE] Payload type:', typeof payload);
      console.log('🔐 [AUTH MIDDLEWARE] Payload keys:', Object.keys(payload));
      console.log('🔐 [AUTH MIDDLEWARE] id_user в payload:', payload.id_user);
      console.log('🔐 [AUTH MIDDLEWARE] email в payload:', payload.email);
      
      // сохраним в контексте
      c.set('user', payload);
      console.log('✅ [AUTH MIDDLEWARE] Аутентификация успешна');
      return await next();
    } catch (verifyError) {
      console.error('❌ [AUTH MIDDLEWARE] Ошибка верификации токена:', verifyError);
      console.error('❌ [AUTH MIDDLEWARE] Тип ошибки:', typeof verifyError);
      console.error('❌ [AUTH MIDDLEWARE] Сообщение ошибки:', (verifyError as Error).message);
      console.error('❌ [AUTH MIDDLEWARE] Стек ошибки:', (verifyError as Error).stack);
      throw verifyError;
    }
  } catch (error) {
    console.error('❌ [AUTH MIDDLEWARE] Auth error:', error);
    return c.json({ error: 'Недействительный токен авторизации' }, 401);
  }
}
