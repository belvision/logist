'use client';

import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { authRefresh } from '@/shared/api/auth';

class TokenManager {
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  /**
   * Получает валидный access token, обновляя его при необходимости
   */
  async getValidToken(): Promise<string | null> {
    const token = getCookie('access_token') as string;
    
    // Проверяем, что токен существует и не является undefined
    if (!token || token === 'undefined' || token === 'null') {
      console.warn('No valid access token found');
      return null;
    }

    // Проверяем, не истек ли токен (простая проверка по длине и формату)
    if (token.length < 10 || !token.includes('.')) {
      console.warn('Invalid token format, attempting refresh');
      const refreshed = await this.refreshToken();
      return refreshed ? getCookie('access_token') as string : null;
    }

    return token;
  }

  /**
   * Обновляет access token используя refresh token
   */
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const refreshToken = getCookie('refresh_token') as string;
      
      if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        console.warn('No refresh token available');
        this.clearTokens();
        return false;
      }

      console.log('Attempting to refresh access token...');
      const data = await authRefresh(refreshToken);

      if (!data || !data.accessToken) {
        console.warn('Token refresh failed: no access token in response');
        this.clearTokens();
        return false;
      }
      
      // Сохраняем новые токены
      setCookie('access_token', data.accessToken, { 
        maxAge: 15 * 60, // 15 минут
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      if (data.refreshToken) {
        setCookie('refresh_token', data.refreshToken, { 
          maxAge: 7 * 24 * 60 * 60, // 7 дней
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }

      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Очищает все токены и перенаправляет на страницу входа
   */
  clearTokens(): void {
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    
    if (typeof window !== 'undefined') {
      // Диспатчим событие для показа модального окна
      window.dispatchEvent(new CustomEvent('session-expired'));
      
      // Через 3 секунды перенаправляем на страницу входа
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  }

  /**
   * Проверяет, есть ли валидные токены
   */
  hasValidTokens(): boolean {
    const accessToken = getCookie('access_token') as string;
    const refreshToken = getCookie('refresh_token') as string;
    
    return !!(accessToken && accessToken !== 'undefined' && accessToken !== 'null' && 
              refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null');
  }
}

export const tokenManager = new TokenManager();
