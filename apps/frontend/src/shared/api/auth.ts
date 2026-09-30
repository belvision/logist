import { client, clientAuth } from './api';

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
    const resp = await api.auth.login.$post({ json: data });

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
      return {
        success: false,
        error: errorMessage
      };
    }
    
    const result = await resp.json();

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
      return {
        success: false,
        error: result.error
      };
    }
    
    return {
      success: false,
      error: 'Неизвестная ошибка сервера'
    };
  } catch (error: any) {
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
  try {
    
    const resp = await api.auth.refresh.$post({
      json: { refreshToken }
    });
    
    if (!resp.ok) {
      let errorMessage = 'Ошибка обновления токена';
      let errorData: any = null;
      try {
        errorData = await resp.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const text = await resp.text().catch(() => '');
        console.error('[AUTH API] Response text:', text);
        errorMessage = `Ошибка ${resp.status}: ${resp.statusText}`;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
    
    const result = await resp.json();
    // Backend returns tokens directly, wrap them in data property for frontend compatibility
    const accessToken = result.accessToken || result.token;
    if (accessToken) {
      return {
        success: true,
        data: {
          accessToken: accessToken,
          refreshToken: result.refreshToken
        }
      };
    }
    
    return {
      success: false,
      error: 'Токен не получен в ответе сервера'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Ошибка соединения с сервером'
    };
  }
}

export const authChangePassword = async (data: ChangePasswordPayload): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const resp = await apiAuth.auth['change-password'].$patch({ json: data });
    
    // Проверяем, что ответ успешный
    if (!resp.ok) {
      let errorMessage = 'Ошибка изменения пароля';
      
      // Проверяем, является ли ответ HTML (ошибка сервера)
      const contentType = resp.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await resp.text().catch(() => '');
        console.error('[AUTH API] Server returned HTML instead of JSON:', text.substring(0, 200));
        errorMessage = 'Сервер вернул некорректный ответ. Возможно, проблема с API endpoint.';
      } else {
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Ошибка ${resp.status}: ${resp.statusText}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    const result = await resp.json();
    
    // Проверяем наличие ошибки в ответе
    if (result.error) {
      return {
        success: false,
        error: result.error
      };
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
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

export const authUpdateProfile = async (data: UpdateProfilePayload): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  const resp = await apiAuth.user.me.$patch({ json: data });
  return resp.json();
}

export const uploadUserAvatar = async (file: File): Promise<{ ok: boolean; avatar_url?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await apiAuth.user.me.avatar.$post({
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
    const res = await apiAuth.user.me.avatar.$delete();

    if (!res.ok) {
      // Проверяем, является ли ответ HTML (ошибка сервера)
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Сервер вернул HTML вместо JSON. Возможно, проблема с API endpoint.');
      }
      
      const data = await res.json();
      throw new Error((data as any).error || `Ошибка удаления аватара (${res.status})`);
    }

    await res.json();

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  strength: string;
  strengthLabel: string;
  errors: string[];
  suggestions: string[];
}

export const checkPasswordStrength = async (password: string): Promise<PasswordStrengthResult | null> => {
  try {
    const resp = await api.auth['check-password-strength'].$post({ json: { password } });
    
    // Проверяем, что ответ успешный
    if (!resp.ok) {
      // Проверяем, является ли ответ HTML (ошибка сервера)
      const contentType = resp.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await resp.text().catch(() => '');
        console.error('[AUTH API] Server returned HTML instead of JSON:', text.substring(0, 200));
        return null;
      }
      
      try {
        const errorData = await resp.json();
        console.error('Ошибка проверки пароля:', errorData.error || `HTTP ${resp.status}`);
      } catch {
        console.error('Ошибка проверки пароля:', `HTTP ${resp.status}`);
      }
      return null;
    }
    
    const data = await resp.json();
    return data;
  } catch (error: any) {
    if (error.message && error.message.includes('JSON')) {
      console.error('Сервер вернул некорректный ответ при проверке пароля');
    } else {
      console.error('Ошибка проверки пароля:', error);
    }
    return null;
  }
};

export interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string | null;
  version: string;
  minScore: number;
}

/**
 * Получить конфигурацию reCAPTCHA (публичный endpoint)
 */
export const getRecaptchaConfig = async (signal?: AbortSignal): Promise<RecaptchaConfig> => {
  try {
    const resp = await api.auth['recaptcha-config'].$get({
      signal
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    return await resp.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
