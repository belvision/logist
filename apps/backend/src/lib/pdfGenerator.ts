// apps/backend/src/lib/pdfGenerator.ts
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PdfGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
}

export class PdfGenerator {
  private uploadsDir: string;

  constructor() {
    // Создаем директорию для хранения PDF если её нет
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Генерирует PDF из HTML шаблона
   */
  async generatePdf(
    html: string,
    css?: string,
    options: PdfGenerationOptions = {}
  ): Promise<{ path: string; buffer: Buffer; checksum: string }> {
    let browser;
    try {
      // Запускаем браузер
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Формируем полный HTML с CSS
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: 'DejaVu Sans', Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
            }
            ${css || ''}
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      // Устанавливаем содержимое страницы
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      // Генерируем PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        printBackground: options.printBackground !== false,
      });

      await browser.close();

      // Сохраняем PDF в файл
      const filename = `${crypto.randomUUID()}.pdf`;
      const filePath = path.join(this.uploadsDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      // Вычисляем контрольную сумму
      const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      return {
        path: filePath,
        buffer: Buffer.from(pdfBuffer),
        checksum,
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Получает PDF файл по пути
   */
  getPdfBuffer(filePath: string): Buffer {
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF файл не найден');
    }
    return fs.readFileSync(filePath);
  }

  /**
   * Удаляет PDF файл
   */
  deletePdf(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Получает размер файла
   */
  getFileSize(filePath: string): number {
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF файл не найден');
    }
    const stats = fs.statSync(filePath);
    return stats.size;
  }
}

export default new PdfGenerator();

