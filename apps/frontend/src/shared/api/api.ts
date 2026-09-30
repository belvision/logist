import { hc } from 'hono/client';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { authRefresh } from './auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.AUTH_API_BASE_URL ||
  'http://localhost:8080';

export const client = hc(`${API_BASE}/api`, {
  headers: {
    Accept: 'application/json',
  },
}) as any;

const authInterceptor = {
  isRefreshing: false,
  refreshPromise: null as Promise<boolean> | null,

  async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      const data = await authRefresh(refreshToken);

      if (!data || !data.accessToken) {
        return false;
      }
      
      // Сохраняем новые токены
      setCookie('access_token', data.accessToken, { 
        maxAge: 15 * 60, // 15 минут
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      setCookie('refresh_token', data.refreshToken, { 
        maxAge: 7 * 24 * 60 * 60, // 7 дней
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  redirectToLogin(): void {
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  async handleUnauthorized(): Promise<boolean> {
    const refreshToken = getCookie('refresh_token') as string;
    
    if (!refreshToken) {
      this.redirectToLogin();
      return false;
    }

    if (this.isRefreshing) {
      // Если уже идет процесс обновления токена, ждем его завершения
      const success = await this.refreshPromise;
      return success || false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshAccessToken(refreshToken);

    try {
      const success = await this.refreshPromise;
      if (!success) {
        this.redirectToLogin();
        return false;
      }
      return true;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }
};

export const clientAuth = hc(`${API_BASE}/api`, {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    // Получаем текущий токен
    const token = getCookie('access_token');
    
    // Модифицируем запрос с токеном авторизации
    const modifiedInit = {
      ...init,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...init?.headers,
      },
    };

    // Выполняем запрос
    const response = await fetch(input, modifiedInit);

    console.log('API Request:', {
      url: input,
      method: modifiedInit.method,
      headers: modifiedInit.headers,
      body: modifiedInit.body
    });
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Обрабатываем 401 ошибки
    if (response.status === 401) {
      console.log('Unauthorized request, attempting token refresh...');
      
      const success = await authInterceptor.handleUnauthorized();
      console.log('Token refresh success:', success);
      
      if (success) {
        // Получаем новый токен и повторяем запрос
        const newToken = getCookie('access_token');
        const retryInit = {
          ...init,
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...init?.headers,
          },
        };
        
        return fetch(input, retryInit);
      }
    }

    return response;
  },
}) as any;

