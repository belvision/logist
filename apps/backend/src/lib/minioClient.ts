// apps/backend/src/lib/minioClient.ts
import * as Minio from 'minio';
import config from '../db/config';
import { Readable } from 'stream';

// Логируем конфигурацию MinIO для отладки

// Создаем клиент MinIO
export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
  pathStyle: true, // Важно для работы через reverse proxy
});

const BUCKET_NAME = config.minio.bucketName;

/**
 * Инициализация бакета (создание, если не существует)
 */
export async function initializeBucket(): Promise<void> {
  try {
    
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      
      // Устанавливаем политику для публичного доступа к изображениям
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    } else {
    }
  } catch (error: any) {
    console.error('❌ Error initializing MinIO bucket:', error);
    throw error;
  }
}

/**
 * Загрузка файла в MinIO
 * @param buffer - буфер файла
 * @param fileName - имя файла (с путем, например 'cars/uuid-timestamp.jpg')
 * @param contentType - MIME тип файла
 * @returns URL загруженного файла
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    
    const stream = Readable.from(buffer);
    
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      stream,
      buffer.length,
      {
        'Content-Type': contentType,
      }
    );

    // Возвращаем URL файла
    // Для стандартных портов (80 для HTTP, 443 для HTTPS) не указываем порт в URL
    const isStandardPort = (config.minio.useSSL && config.minio.port === 443) || (!config.minio.useSSL && config.minio.port === 80);
    const portPart = isStandardPort ? '' : `:${config.minio.port}`;
    const url = `${config.minio.useSSL ? 'https' : 'http'}://${config.minio.endpoint}${portPart}/${BUCKET_NAME}/${fileName}`;
    
    return url;
  } catch (error: any) {
    console.error('❌ [MINIO UPLOAD] Error uploading file to MinIO:', error);
    
    // Проверяем bucket существование
    try {
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      console.error('❌ [MINIO UPLOAD] Bucket exists check:', bucketExists);
    } catch (checkError: any) {
      console.error('❌ [MINIO UPLOAD] Could not check bucket existence:', checkError.message);
    }
    
    throw new Error(`MinIO upload failed: ${error.message || 'Unknown error'}. Check MinIO connection and credentials.`);
  }
}

/**
 * Удаление файла из MinIO
 * @param fileName - имя файла (с путем)
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    
    await minioClient.removeObject(BUCKET_NAME, fileName);
  } catch (error) {
    console.error('❌ Error deleting file from MinIO:', error);
    throw error;
  }
}

/**
 * Получение временной ссылки на файл (presigned URL)
 * @param fileName - имя файла
 * @param expirySeconds - время жизни ссылки в секундах (по умолчанию 7 дней)
 */
export async function getPresignedUrl(
  fileName: string,
  expirySeconds: number = 7 * 24 * 60 * 60
): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      fileName,
      expirySeconds
    );
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * Генерация уникального имени файла
 * @param prefix - префикс (например, 'cars' или 'avatars')
 * @param originalName - оригинальное имя файла
 */
export function generateFileName(prefix: string, originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Извлечение имени файла из URL
 * @param url - URL файла
 */
export function extractFileNameFromUrl(url: string): string | null {
  try {
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Если URL содержит bucket name, убираем его
    // Формат: /bucket-name/path/to/file.jpg -> path/to/file.jpg
    if (pathParts[0] === BUCKET_NAME || pathParts[0] === 'logistic-pro') {
      const fileName = pathParts.slice(1).join('/');
      return fileName;
    }
    
    // Иначе возвращаем весь путь
    const fileName = pathParts.join('/');
    return fileName;
  } catch (error) {
    console.error('❌ Error extracting filename from URL:', error);
    return null;
  }
}
