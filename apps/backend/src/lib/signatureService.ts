// apps/backend/src/lib/signatureService.ts
import * as crypto from 'crypto';

export interface SignatureData {
  documentId: string;
  userId: string;
  timestamp: Date;
  documentChecksum: string;
}

export class SignatureService {
  /**
   * Генерирует электронную подпись для документа
   * В реальной системе здесь должна быть интеграция с сертифицированными сервисами ЭЦП
   */
  generateSignature(data: SignatureData, privateKey?: string): string {
    // Формируем строку для подписи
    const signatureString = [
      data.documentId,
      data.userId,
      data.timestamp.toISOString(),
      data.documentChecksum,
    ].join('|');

    // Используем HMAC SHA256 для генерации подписи
    // В production нужно использовать настоящий приватный ключ пользователя
    const secret = privateKey || process.env.SIGNATURE_SECRET || 'default-secret-key';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signatureString)
      .digest('hex');

    // Возвращаем подпись в формате base64
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Проверяет электронную подпись
   */
  verifySignature(
    signature: string,
    data: SignatureData,
    privateKey?: string
  ): boolean {
    try {
      const expectedSignature = this.generateSignature(data, privateKey);
      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Вычисляет контрольную сумму документа
   */
  calculateDocumentChecksum(documentData: any): string {
    // Сортируем ключи для детерминированности
    const sortedData = this.sortObject(documentData);
    const dataString = JSON.stringify(sortedData);
    
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  }

  /**
   * Генерирует пару ключей для пользователя (для демонстрации)
   * В реальной системе это должно происходить на стороне клиента с использованием сертифицированных средств
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * Подписывает данные с использованием RSA (более безопасный метод)
   */
  signWithRSA(data: string, privateKey: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Проверяет подпись RSA
   */
  verifyRSASignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      verify.end();
      
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('RSA signature verification error:', error);
      return false;
    }
  }

  /**
   * Сортирует объект рекурсивно для детерминированности хеша
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = this.sortObject(obj[key]);
    }

    return sorted;
  }

  /**
   * Создает временную метку подписи
   */
  createTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Валидирует временную метку (проверяет, не слишком ли старая)
   */
  validateTimestamp(timestamp: string, maxAgeMinutes: number = 30): boolean {
    try {
      const signatureDate = new Date(timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - signatureDate.getTime()) / (1000 * 60);
      
      return diffMinutes <= maxAgeMinutes;
    } catch (error) {
      return false;
    }
  }

  /**
   * Форматирует данные подписи для отображения
   */
  formatSignatureInfo(signature: string, data: SignatureData): string {
    return `
Электронная подпись документа
────────────────────────────────
Документ: ${data.documentId}
Подписант: ${data.userId}
Дата и время: ${data.timestamp.toLocaleString('ru-RU')}
Контрольная сумма: ${data.documentChecksum}
Подпись: ${signature.substring(0, 32)}...
    `.trim();
  }
}

export default new SignatureService();

