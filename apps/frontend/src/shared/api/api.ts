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
    const token = await tokenManager.getValidToken();
    
    if (!token) {
      console.warn('No valid access token found');
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

    if (response.status === 401) {
      
      const success = await tokenManager.refreshToken();
      
      if (success) {
        const newToken = await tokenManager.getValidToken();
        if (newToken) {
          const isFormData = init?.body instanceof FormData;
          
          const retryHeaders: HeadersInit = new Headers(init?.headers);
          
          if (retryHeaders instanceof Headers) {
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
            
            if (!isFormData) {
              retryHeaders.set('Accept', 'application/json');
            }
          }
          
          const retryInit = {
            ...init,
            headers: retryHeaders,
          };
          
          return fetch(input, retryInit);
        }
      }
      
      tokenManager.clearTokens();
    }

    return response;
  },
}) as ReturnType<typeof hc>;

