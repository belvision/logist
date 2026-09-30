import { hc } from 'hono/client';
import { tokenManager } from '@/lib/tokenManager';
import { API_BASE } from '@/lib/config';

export const client = hc(`${API_BASE}/api`, {
  headers: {
    Accept: 'application/json',
  },
}) as ReturnType<typeof hc>;

export const clientAuth = hc(`${API_BASE}/api`, {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    // Флаг для предотвращения бесконечных циклов
    const isRetry = (init as any)?._isRetry === true;
    
    const token = await tokenManager.getValidToken();
    
    if (!token) {
      console.warn('[API Client] No valid access token found');
      // Если это уже повторная попытка, не пытаемся refresh
      if (isRetry) {
        tokenManager.clearTokens();
        return new Response(JSON.stringify({ error: 'No valid token' }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      // Пытаемся refresh перед первым запросом
      const refreshed = await tokenManager.refreshToken();
      if (refreshed) {
        const newToken = await tokenManager.getValidToken();
        if (newToken) {
          // Повторяем запрос с новым токеном через обычный fetch
          const isFormData = init?.body instanceof FormData;
          const retryHeaders: HeadersInit = new Headers(init?.headers);
          
          if (retryHeaders instanceof Headers) {
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            if (!isFormData) {
              retryHeaders.set('Accept', 'application/json');
            }
          }
          
          const retryInit: RequestInit = {
            ...init,
            headers: retryHeaders,
            _isRetry: true
          } as any;
          
          return fetch(input, retryInit);
        }
      }
      tokenManager.clearTokens();
      return new Response(JSON.stringify({ error: 'No valid token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const isFormData = init?.body instanceof FormData;
    
    const headers: HeadersInit = new Headers(init?.headers);
    
    if (headers instanceof Headers) {
      headers.set('Authorization', `Bearer ${token}`);
      
      if (!isFormData) {
        headers.set('Accept', 'application/json');
      }
    }
    
    const modifiedInit = {
      ...init,
      headers,
    };

    const response = await fetch(input, modifiedInit);

    // Если получили 401, пытаемся обновить токен и повторить запрос
    if (response.status === 401 && !isRetry) {
      
      const success = await tokenManager.refreshToken();
      
      if (success) {
        const newToken = await tokenManager.getValidToken();
        if (newToken) {
          
          // Создаем новые заголовки для повторного запроса
          const retryHeaders: HeadersInit = new Headers(init?.headers);
          
          if (retryHeaders instanceof Headers) {
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            
            if (!isFormData) {
              retryHeaders.set('Accept', 'application/json');
            }
          }
          
          // Важно: для FormData нужно клонировать body, так как его можно прочитать только один раз
          let retryBody = init?.body;
          if (init?.body instanceof FormData) {
            // FormData можно использовать повторно
            retryBody = init.body;
          } else if (init?.body) {
            // Для других типов body нужно клонировать, если это возможно
            try {
              if (typeof init.body === 'string') {
                retryBody = init.body;
              } else if (init.body instanceof ReadableStream) {
                // Для потоков создаем новый запрос
                console.warn('[API Client] Cannot retry request with ReadableStream body');
                tokenManager.clearTokens();
                return response;
              }
            } catch (e) {
              console.warn('[API Client] Error preparing retry body:', e);
            }
          }
          
          const retryInit: RequestInit = {
            ...init,
            headers: retryHeaders,
            body: retryBody,
            _isRetry: true
          } as any;
          
          const retryResponse = await fetch(input, retryInit);
          
          // Если повторный запрос тоже вернул 401, очищаем токены
          if (retryResponse.status === 401) {
            console.warn('[API Client] Retry also returned 401, clearing tokens');
            tokenManager.clearTokens();
          }
          
          return retryResponse;
        } else {
          console.warn('[API Client] Token refresh succeeded but no new token available');
          tokenManager.clearTokens();
        }
      } else {
        console.warn('[API Client] Token refresh failed, clearing tokens');
        tokenManager.clearTokens();
      }
    } else if (response.status === 401 && isRetry) {
      // Если это уже повторная попытка и все равно 401, очищаем токены
      console.warn('[API Client] Retry request also returned 401, clearing tokens');
      tokenManager.clearTokens();
    }

    return response;
  },
}) as ReturnType<typeof hc>;
