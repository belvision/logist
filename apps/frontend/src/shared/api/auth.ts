import { client, clientAuth } from '.';
import { tokenManager } from '@/lib/tokenManager';
import { API_BASE } from '@/lib/config';

// Type assertions для client и clientAuth чтобы избежать ошибок типизации
const api = client as any;
const apiAuth = clientAuth as any;

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  inviteToken?: string | undefined;
  recaptchaToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface ChangePasswordPayload {
  password: string;
  id_user: string;
}

export interface UpdateProfilePayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id_user: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordUpdate: Date;
  phone: string;
  avatar_url?: string;
}

export const authMe = async (): Promise<{user: User}> => {
  const resp = await apiAuth.auth.me.$get();
  return resp.json();
}

export const authLogin = async (data: LoginPayload): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string; user: unknown }; error?: string }> => {
  try {
    console.log('🔍 [AUTH API] Login request:', { email: data.email, hasPassword: !!data.password, hasRecaptcha: !!data.recaptchaToken });
    
    const resp = await api.auth.login.$post({ json: data });
    
    console.log('🔍 [AUTH API] Login response status:', resp.status);
    
    // Проверяем, что ответ успешный
    if (!resp.ok) {
      let errorMessage = 'Ошибка сервера';
      try {
        const errorData = await resp.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Если не удается парсить JSON, используем статус
        errorMessage = `Ошибка ${resp.status}: ${resp.statusText}`;
      }
      console.error('❌ [AUTH API] Login failed with status:', resp.status, errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
    
    const result = await resp.json();
    console.log('🔍 [AUTH API] Login response data:', result);
    
    // Backend returns tokens directly, wrap them in data property for frontend compatibility
    if (result.accessToken || result.token) {
      return {
        success: true,
        data: {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken,
          user: result.user
        }
      };
    }
    
    // Handle error response
    if (result.error) {
      console.error('❌ [AUTH API] Login error from backend:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
    console.error('❌ [AUTH API] No access token in response:', result);
    return {
      success: false,
      error: 'Неизвестная ошибка сервера'
    };
  } catch (error: any) {
    console.error('❌ [AUTH API] Login request failed:', error);
    
    // Обрабатываем ошибки парсинга JSON
    if (error.message && error.message.includes('JSON')) {
      return {
        success: false,
        error: 'Сервер вернул некорректный ответ. Попробуйте позже.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Ошибка соединения с сервером'
    };
  }
}

export const authRegister = async (data: RegisterPayload): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string; user: unknown }; error?: string }> => {
  const resp = await api.auth.register.$post({ json: data });
  const result = await resp.json();
  
  // Backend returns tokens directly, wrap them in data property for frontend compatibility
  if (result.accessToken) {
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      }
    };
  }
  
  // Handle error response
  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }
  
  return {
    success: false,
    error: 'Неизвестная ошибка'
  };
}

export const authRefresh = async (refreshToken: string): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string }; error?: string }> => {
  const resp = await api.auth.refresh.$post({
    json: { refreshToken }
  });
  const result = await resp.json();
  
  // Backend returns tokens directly, wrap them in data property for frontend compatibility
  if (result.accessToken) {
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    };
  }
  
  return result;
}

export const authChangePassword = async (data: ChangePasswordPayload): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  const resp = await apiAuth.auth['change-password'].$patch({ json: data });
  return resp.json();
}

export const authUpdateProfile = async (data: UpdateProfilePayload): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  const resp = await apiAuth.user.me.$patch({ json: data });
  return resp.json();
}

export const uploadUserAvatar = async (file: File): Promise<{ ok: boolean; avatar_url?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    const res = await fetch(`${API_BASE}/api/user/me/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error((data as any).error || 'Ошибка загрузки аватара');
    }

    return {
      ok: true,
      avatar_url: (data as any).avatar_url
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deleteUserAvatar = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    console.log('🔍 [DELETE AVATAR] Making DELETE request to /api/user/me/avatar');
    
    const res = await fetch(`${API_BASE}/api/user/me/avatar`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('🔍 [DELETE AVATAR] Response status:', res.status);
    console.log('🔍 [DELETE AVATAR] Response headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      // Проверяем, является ли ответ HTML (ошибка сервера)
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('❌ [DELETE AVATAR] Server returned HTML instead of JSON');
        throw new Error('Сервер вернул HTML вместо JSON. Возможно, проблема с API endpoint.');
      }
      
      const data = await res.json();
      throw new Error((data as any).error || `Ошибка удаления аватара (${res.status})`);
    }

    const data = await res.json();
    console.log('✅ [DELETE AVATAR] Success:', data);

    return {
      ok: true
    };
  } catch (error) {
    console.error('❌ [DELETE AVATAR] Error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
