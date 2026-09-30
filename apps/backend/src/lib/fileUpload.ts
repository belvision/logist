// apps/backend/src/lib/fileUpload.ts
import { Context } from 'hono';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Парсинг multipart/form-data для загрузки файлов
 * Упрощенная версия для работы с Hono
 */
export async function parseMultipartForm(c: Context): Promise<{
  fields: Record<string, string>;
  files: UploadedFile[];
}> {
  const contentType = c.req.header('content-type');
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  const formData = await c.req.formData();
  const fields: Record<string, string> = {};
  const files: UploadedFile[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Это файл
      const buffer = Buffer.from(await value.arrayBuffer());
      files.push({
        fieldname: key,
        originalname: value.name,
        encoding: '7bit',
        mimetype: value.type,
        buffer,
        size: buffer.length,
      });
    } else {
      // Это обычное поле
      fields[key] = value as string;
    }
  }

  return { fields, files };
}

/**
 * Валидация изображений
 */
export function validateImage(file: UploadedFile, maxSizeMB: number = 5): void {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
}

/**
 * Валидация множественных изображений
 */
export function validateImages(files: UploadedFile[], maxFiles: number = 5, maxSizeMB: number = 5): void {
  if (files.length > maxFiles) {
    throw new Error(`Maximum ${maxFiles} files allowed`);
  }

  files.forEach(file => validateImage(file, maxSizeMB));
}

