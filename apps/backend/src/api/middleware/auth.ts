import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken } from '../../core/auth/jwt.service';

export async function authenticate(c: Context, next: Next) {
  
  try {
    const auth = c.req.header('authorization');
    
    let token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    
    // Проверяем, что токен не является undefined или null
    if (token === 'undefined' || token === 'null' || token === '') {
      token = undefined;
    }
    
    if (!token) {
      token = getCookie(c, 'auth_token') || undefined;
    }
    
    // Также проверим cookie access_token
    if (!token) {
      token = getCookie(c, 'access_token') || undefined;
    }
    
    if (!token) {
      return c.json({ error: 'Требуется авторизация' }, 401);
    }

    try {
      const payload = verifyAccessToken(token);
      
      // сохраним в контексте
      c.set('user', payload);
      return await next();
    } catch (verifyError) {
      console.error('❌ [AUTH MIDDLEWARE] Сообщение ошибки:', (verifyError as Error).message);
      throw verifyError;
    }
  } catch (error) {
    console.error('❌ [AUTH MIDDLEWARE] Auth error:', error);
    return c.json({ error: 'Недействительный токен авторизации' }, 401);
  }
}
