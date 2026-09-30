import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import config from '../../db/config';

type JwtPayload = Record<string, any>;

export function signAccessToken(payload: JwtPayload) {
  const secret: Secret = config.auth.jwtSecret as unknown as Secret;
  const options: SignOptions = { expiresIn: config.auth.expiresIn as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const secret: Secret = (config.auth as any).refreshSecret ?? config.auth.jwtSecret as unknown as Secret;
  const options: SignOptions = { expiresIn: ((config.auth as any).refreshExpiresIn ?? config.auth.expiresIn) as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  console.log('🔐 [JWT SERVICE] verifyAccessToken вызван');
  console.log('🔐 [JWT SERVICE] Token preview:', token.substring(0, 20) + '...');
  console.log('🔐 [JWT SERVICE] Token length:', token.length);
  
  const secret: Secret = config.auth.jwtSecret as unknown as Secret;
  console.log('🔐 [JWT SERVICE] Secret preview:', String(secret).substring(0, 10) + '...');
  console.log('🔐 [JWT SERVICE] Secret length:', String(secret).length);
  
  try {
    const result = jwt.verify(token, secret) as JwtPayload;
    console.log('🔐 [JWT SERVICE] Верификация успешна');
    console.log('🔐 [JWT SERVICE] Результат:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ [JWT SERVICE] Ошибка верификации:', error);
    console.error('❌ [JWT SERVICE] Тип ошибки:', typeof error);
    console.error('❌ [JWT SERVICE] Сообщение:', (error as Error).message);
    console.error('❌ [JWT SERVICE] Название ошибки:', (error as Error).name);
    throw error;
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret: Secret = (config.auth as any).refreshSecret ?? config.auth.jwtSecret as unknown as Secret;
  return jwt.verify(token, secret) as JwtPayload;
}

// Invitation tokens: separate signer to allow shorter expiry and payload with company/role/email
export function signInviteToken(payload: JwtPayload & { email: string; companyId: string; role: string }) {
  const secret: Secret = config.auth.jwtSecret as unknown as Secret;
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, secret, options);
}

export function verifyInviteToken(token: string): JwtPayload & { email: string; companyId: string; role: string } {
  const secret: Secret = config.auth.jwtSecret as unknown as Secret;
  return jwt.verify(token, secret) as any;
}

// Pending MFA token: short-lived token used between password auth and second factor
export function signPendingMfaToken(payload: JwtPayload & { userId: string }) {
  const secret: Secret = ((config as any).auth?.mfaPendingSecret ?? config.auth.jwtSecret) as unknown as Secret;
  const options: SignOptions = { expiresIn: '10m' };
  return jwt.sign(payload, secret, options);
}

export function verifyPendingMfaToken(token: string): JwtPayload & { userId: string } {
  const secret: Secret = ((config as any).auth?.mfaPendingSecret ?? config.auth.jwtSecret) as unknown as Secret;
  return jwt.verify(token, secret) as any;
}