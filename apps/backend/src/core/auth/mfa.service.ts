import { authenticator } from 'otplib';
import crypto from 'crypto';
import QRCode from 'qrcode';
import config from '../../db/config';

export type GeneratedSecret = {
  secret: string;
  otpauthUri: string;
  qrPngDataUrl: string;
};

export class MfaService {
  private static getIssuer(): string {
    return (config as any)?.mfa?.issuer || process.env.MFA_ISSUER || 'LogistGo';
  }

  private static getTotpWindow(): number {
    const value = (config as any)?.mfa?.totpWindow || process.env.MFA_TOTP_WINDOW || '1';
    return Number(value) || 1;
  }

  static generateSecret(accountName: string): GeneratedSecret {
    const secret = authenticator.generateSecret();
    const issuer = this.getIssuer();
    const otpauthUri = authenticator.keyuri(accountName, issuer, secret);
    const qrPngDataUrl = QRCode.toDataURL(otpauthUri, { errorCorrectionLevel: 'M' }) as unknown as string;
    return { secret, otpauthUri, qrPngDataUrl };
  }

  static async generateQr(otpauthUri: string): Promise<string> {
    return QRCode.toDataURL(otpauthUri, { errorCorrectionLevel: 'M' });
  }

  static verifyTotp(secret: string, code: string): boolean {
    return authenticator.check(code, secret);
  }

  static encryptSecret(plain: string): string {
    const key = (process.env.MFA_ENCRYPTION_KEY || '').slice(0, 32);
    if (!key || key.length < 32) throw new Error('Invalid MFA_ENCRYPTION_KEY');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  static decryptSecret(enc: string): string {
    const key = (process.env.MFA_ENCRYPTION_KEY || '').slice(0, 32);
    if (!key || key.length < 32) throw new Error('Invalid MFA_ENCRYPTION_KEY');
    const raw = Buffer.from(enc, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  }

  static generateRecoveryCodes(count: number): string[] {
    const size = Math.max(1, Math.min(20, count || 10));
    const codes: string[] = [];
    for (let i = 0; i < size; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  }

  static async hashRecoveryCode(plain: string): Promise<string> {
    // use sha256+salt; in production use argon2/bcrypt
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(`${plain}:${salt}`).digest('hex');
    return `${salt}:${hash}`;
  }

  static async verifyRecoveryCode(plain: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    const fresh = crypto.createHash('sha256').update(`${plain}:${salt}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(fresh, 'hex'));
  }
}


