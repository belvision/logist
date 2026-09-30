'use client';

import { getCookie } from 'cookies-next';
import { tokenManager } from '@/lib/tokenManager';

export function useApiAuth() {
  const getAuthHeaders = async () => {
    const token = await tokenManager.getValidToken();
    
    if (!token) {
      console.warn('No valid access token found in getAuthHeaders');
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
    }
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = await getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include',
    });

    // Если получили 401, пытаемся обновить токен
    if (response.status === 401) {
      console.log('Unauthorized request, attempting token refresh...');
      
      const success = await tokenManager.refreshToken();
      if (success) {
        // Повторяем запрос с новым токеном
        const newHeaders = await getAuthHeaders();
        return fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
          credentials: 'include',
        });
      } else {
        // Если не удалось обновить токен, очищаем все
        tokenManager.clearTokens();
      }
    }

    return response;
  };

  return {
    getAuthHeaders,
    fetchWithAuth,
  };
}
