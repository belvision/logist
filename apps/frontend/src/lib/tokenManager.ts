'use client';

import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { authRefresh } from '@/shared/api/auth';
import { isExpired, willExpireSoon } from '@/shared/api/tokens';
import { showToast } from './toast';

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
      return null;
    }

    // Проверяем формат токена
    if (token.length < 10 || !token.includes('.')) {
      const refreshed = await this.refreshToken();
      return refreshed ? getCookie('access_token') as string : null;
    }

    // Проверяем, не истек ли токен
    const expired = isExpired(token);
    const expiresSoon = willExpireSoon(token, 60);

    if (expired) {
      const refreshed = await this.refreshToken();
      return refreshed ? getCookie('access_token') as string : null;
    }

    // Проверяем, не истекает ли токен скоро (в течение минуты)
    if (expiresSoon) {
      // Обновляем в фоне, но возвращаем текущий токен
      this.refreshToken().catch(err => {
        console.error('[TokenManager] Background refresh failed:', err);
      });
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
        this.clearTokens();
        return false;
      }

      // Проверяем, не истек ли refresh token
      if (isExpired(refreshToken)) {
        this.clearTokens();
        return false;
      }

      const data = await authRefresh(refreshToken);

      if (!data || !data.data?.accessToken) {
        this.clearTokens();
        return false;
      }
      
      // Сохраняем новые токены
      const cookieOptions = {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const
      };

      setCookie('access_token', data.data.accessToken, {
        ...cookieOptions,
        maxAge: 2 * 60, // 2 минуты
      });
      
      if (data.data.refreshToken) {
        setCookie('refresh_token', data.data.refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60, // 7 дней
        });
      }

      return true;
    } catch {
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
      // Показываем toast уведомление
      showToast.error('Сессия истекла', 'Пожалуйста, авторизуйтесь');
      
      // Диспатчим событие для показа модального окна
      window.dispatchEvent(new CustomEvent('session-expired'));
      
      // Через 3 секунды перенаправляем на страницу входа
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  }

  /**
   * Очищает токены без показа модального окна (для logout)
   */
  clearTokensSilent(): void {
    deleteCookie('access_token');
    deleteCookie('refresh_token');
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
