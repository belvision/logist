import { clientAuth, client } from './api';

const api = clientAuth as any;
const apiPublic = client as any;

export interface CheckVerificationResponse {
  verified: boolean;
}

export interface ResendVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const emailVerificationApi = {
  /**
   * Проверить статус верификации email
   */
  async checkVerification(): Promise<CheckVerificationResponse> {
    const res = await api['auth']['check-verification'].$get();
    return await res.json();
  },

  /**
   * Повторно отправить письмо для верификации
   */
  async resendVerification(): Promise<ResendVerificationResponse> {
    const res = await api['auth']['resend-verification'].$post();
    return await res.json();
  },

  /**
   * Подтвердить email по токену (публичный endpoint)
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    // Используем обычный fetch для публичного endpoint
    const response = await apiPublic['auth']['verify-email'].$get({
      query: {
        token: token,
      },
    });
    return await response.json();
  },
};

