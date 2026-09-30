import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';

const NOMINATIM_BASE = process.env.NOMINATIM_URL || 'http://10.1.1.215:8080';

export const nominatimProxyRouter = new Hono();

// Прокси для всех Nominatim запросов - публичный
nominatimProxyRouter.all('/*', async (c) => {
  try {
    const path = c.req.path.replace('/api/nominatim-proxy', '');
    const url = `${NOMINATIM_BASE}${path}`;
    
    // Получаем все параметры запроса
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(c.req.query())) {
      searchParams.set(key, value);
    }
    
    const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;
    
    // Получаем тело запроса если есть
    let body = null;
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        body = await c.req.text();
      } catch (e) {
        // Игнорируем ошибки чтения тела
      }
    }
    
    // Делаем запрос к Nominatim
    const response = await fetch(fullUrl, {
      method: c.req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Nominatim Proxy error:', response.status, text);
      return c.json({ error: `Nominatim ${response.status}: ${text.slice(0, 180)}` }, response.status as any);
    }
    
    const data = await response.json().catch(() => ({}));
    
    return c.json(data);
  } catch (error) {
    console.error('Nominatim Proxy error:', error);
    return c.json({ error: 'Proxy error' }, 500);
  }
});

// Прокси для всех Nominatim запросов - с авторизацией
nominatimProxyRouter.all('/auth/*', authenticate, async (c) => {
  try {
    const path = c.req.path.replace('/api/nominatim-proxy/auth', '');
    const url = `${NOMINATIM_BASE}${path}`;
    
    // Получаем все параметры запроса
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(c.req.query())) {
      searchParams.set(key, value);
    }
    
    const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;
    
    // Получаем тело запроса если есть
    let body = null;
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        body = await c.req.text();
      } catch (e) {
        // Игнорируем ошибки чтения тела
      }
    }
    
    // Делаем запрос к Nominatim
    const response = await fetch(fullUrl, {
      method: c.req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Nominatim Proxy Auth error:', response.status, text);
      return c.json({ error: `Nominatim ${response.status}: ${text.slice(0, 180)}` }, response.status as any);
    }
    
    const data = await response.json().catch(() => ({}));
    
    return c.json(data);
  } catch (error) {
    console.error('Nominatim Proxy Auth error:', error);
    return c.json({ error: 'Proxy error' }, 500);
  }
});
