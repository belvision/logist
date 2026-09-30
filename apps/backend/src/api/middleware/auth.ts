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
    
    let token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) {
      token = getCookie(c, 'auth_token') || undefined;
      console.log('🔐 [AUTH MIDDLEWARE] Token from cookie:', token ? 'Present' : 'Missing');
    }
    
    if (!token) {
      console.log('❌ [AUTH MIDDLEWARE] Токен не найден');
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    console.log('🔐 [AUTH MIDDLEWARE] Токен найден, проверяем...');
    const payload = verifyAccessToken(token);
    console.log('🔐 [AUTH MIDDLEWARE] Payload:', JSON.stringify(payload, null, 2));
    
    // сохраним в контексте
    c.set('user', payload);
    console.log('✅ [AUTH MIDDLEWARE] Аутентификация успешна');
    await next();
  } catch (error) {
    console.error('❌ [AUTH MIDDLEWARE] Auth error:', error);
    return c.json({ error: 'Недействительный токен авторизации' }, 401);
  }
}
