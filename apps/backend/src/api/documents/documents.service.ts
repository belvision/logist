// apps/backend/src/api/documents/documents.service.ts
import documentsRepository from './documents.repository';
import pdfGenerator from '../../lib/pdfGenerator';
import templateRenderer from '../../lib/templateRenderer';
import signatureService from '../../lib/signatureService';
import type {
  CreateDocumentDTO,
  UpdateDocumentDTO,
  CreateTemplateDTO,
  DocumentType,
  DocumentStatus,
} from './documents.types';

export class DocumentsService {
  // ==================== DOCUMENTS ====================

  async createDocument(data: CreateDocumentDTO, userId: string, companyId: string) {
    // Создаем документ
    const document = await documentsRepository.createDocument(data, userId, companyId);

    // Создаем первую версию
    await documentsRepository.createVersion(
      document.id_document,
      1,
      document.document_data,
      userId,
      'Первоначальная версия'
    );

    // Если указан шаблон, генерируем PDF
    if (data.template_id) {
      try {
        await this.generateDocumentPdf(document.id_document);
      } catch (error) {
        console.error('Failed to generate initial PDF:', error);
        // Не прерываем создание документа, если генерация PDF не удалась
      }
    }

    return document;
  }

  async getDocument(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ
    const hasAccess = await documentsRepository.canUserAccessDocument(documentId, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    const document = await documentsRepository.getDocumentById(documentId);
    if (!document) {
      throw new Error('Документ не найден');
    }

    // Получаем подписи
    const signatures = await documentsRepository.getSignaturesByDocument(documentId);

    return {
      ...document,
      signatures,
    };
  }

  async listDocuments(
    companyId: string,
    filters: {
      document_type?: DocumentType;
      status?: DocumentStatus;
      related_cargo_id?: number;
      related_car_id?: number;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    return await documentsRepository.getDocumentsByCompany(companyId, filters);
  }

  async updateDocument(
    documentId: string,
    data: UpdateDocumentDTO,
    userId: string,
    companyId: string
  ) {
    // Проверяем доступ на редактирование
    const access = await documentsRepository.checkUserAccess(documentId, userId, companyId);
    const isOwner = await documentsRepository.isDocumentOwner(documentId, userId);
    
    if (!access.can_edit && !isOwner) {
      throw new Error('Недостаточно прав для редактирования документа');
    }

    // Получаем текущий документ
    const currentDocument = await documentsRepository.getDocumentById(documentId);
    if (!currentDocument) {
      throw new Error('Документ не найден');
    }

    // Проверяем, можно ли редактировать (нельзя редактировать подписанные документы)
    if (currentDocument.status === 'Подписан') {
      throw new Error('Нельзя редактировать подписанный документ');
    }

    // Если изменились данные документа, создаем новую версию
    if (data.document_data) {
      const newVersion = currentDocument.version + 1;
      await documentsRepository.createVersion(
        documentId,
        newVersion,
        data.document_data,
        userId,
        'Обновление данных документа'
      );

      // Обновляем версию в основном документе
      await documentsRepository.updateDocument(
        documentId,
        { ...data, version: newVersion } as any,
        userId
      );

      // Перегенерируем PDF
      if (currentDocument.template_id) {
        await this.generateDocumentPdf(documentId);
      }
    } else {
      // Обычное обновление без изменения данных
      await documentsRepository.updateDocument(documentId, data, userId);
    }

    return await documentsRepository.getDocumentById(documentId);
  }

  async deleteDocument(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ на удаление
    const access = await documentsRepository.checkUserAccess(documentId, userId, companyId);
    const isOwner = await documentsRepository.isDocumentOwner(documentId, userId);
    
    if (!access.can_delete && !isOwner) {
      throw new Error('Недостаточно прав для удаления документа');
    }

    // Получаем документ для удаления PDF файла
    const document = await documentsRepository.getDocumentById(documentId);
    if (document?.pdf_file_path) {
      try {
        pdfGenerator.deletePdf(document.pdf_file_path);
      } catch (error) {
        console.error('Failed to delete PDF file:', error);
      }
    }

    await documentsRepository.deleteDocument(documentId);
  }

  // ==================== PDF GENERATION ====================

  async generateDocumentPdf(documentId: string) {
    const document = await documentsRepository.getDocumentById(documentId);
    if (!document) {
      throw new Error('Документ не найден');
    }

    let html: string;
    let css: string | undefined;

    if (document.template_id) {
      // Используем шаблон
      const template = await documentsRepository.getTemplateById(document.template_id);
      if (!template) {
        throw new Error('Шаблон не найден');
      }

      // Подготавливаем данные для рендеринга
      const renderData = {
        ...document.document_data,
        document_number: document.document_number,
        document_date: document.document_date,
        title: document.title,
        description: document.description,
        counterparty_name: document.counterparty_name,
        counterparty_unp: document.counterparty_unp,
        counterparty_address: document.counterparty_address,
      };

      // Рендерим шаблон
      html = templateRenderer.render(template.html_template, renderData);
      css = template.css_styles || undefined;
    } else {
      // Генерируем простой HTML без шаблона
      html = this.generateDefaultHtml(document);
    }

    // Генерируем PDF
    const { path, checksum } = await pdfGenerator.generatePdf(html, css);
    const fileSize = pdfGenerator.getFileSize(path);

    // Сохраняем путь к PDF в документе
    await documentsRepository.savePdfPath(documentId, path, {
      file_size: fileSize,
      checksum,
    });

    return { path, checksum, fileSize };
  }

  async getDocumentPdf(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ
    const hasAccess = await documentsRepository.canUserAccessDocument(documentId, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    const document = await documentsRepository.getDocumentById(documentId);
    if (!document) {
      throw new Error('Документ не найден');
    }

    if (!document.pdf_file_path) {
      // Генерируем PDF, если его нет
      await this.generateDocumentPdf(documentId);
      const updatedDocument = await documentsRepository.getDocumentById(documentId);
      if (!updatedDocument?.pdf_file_path) {
        throw new Error('Не удалось сгенерировать PDF');
      }
      return pdfGenerator.getPdfBuffer(updatedDocument.pdf_file_path);
    }

    return pdfGenerator.getPdfBuffer(document.pdf_file_path);
  }

  // ==================== TEMPLATES ====================

  async createTemplate(data: CreateTemplateDTO, userId: string, companyId?: string) {
    // Валидируем шаблон
    const validation = templateRenderer.validateTemplate(data.html_template);
    if (!validation.valid) {
      throw new Error(`Ошибки в шаблоне: ${validation.errors.join(', ')}`);
    }

    return await documentsRepository.createTemplate(data, userId, companyId);
  }

  async getTemplate(templateId: string) {
    const template = await documentsRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('Шаблон не найден');
    }
    return template;
  }

  async listTemplates(documentType?: DocumentType, companyId?: string) {
    if (documentType) {
      return await documentsRepository.getTemplatesByType(documentType, companyId);
    }
    return await documentsRepository.getAllTemplates(companyId);
  }

  async updateTemplate(
    templateId: string,
    data: Partial<CreateTemplateDTO> & { is_active?: boolean },
    userId: string,
    companyId: string
  ) {
    const template = await documentsRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('Шаблон не найден');
    }

    // Проверяем права (системные шаблоны не могут редактироваться)
    if (template.is_system) {
      throw new Error('Системный шаблон не может быть изменен');
    }

    // Проверяем, что пользователь из той же компании
    if (template.id_company !== companyId) {
      throw new Error('Недостаточно прав для редактирования шаблона');
    }

    // Валидируем шаблон, если он изменился
    if (data.html_template) {
      const validation = templateRenderer.validateTemplate(data.html_template);
      if (!validation.valid) {
        throw new Error(`Ошибки в шаблоне: ${validation.errors.join(', ')}`);
      }
    }

    return await documentsRepository.updateTemplate(templateId, data);
  }

  async deleteTemplate(templateId: string, companyId: string) {
    const template = await documentsRepository.getTemplateById(templateId);
    if (!template) {
      throw new Error('Шаблон не найден');
    }

    if (template.is_system) {
      throw new Error('Системный шаблон не может быть удален');
    }

    if (template.id_company !== companyId) {
      throw new Error('Недостаточно прав для удаления шаблона');
    }

    await documentsRepository.deleteTemplate(templateId);
  }

  // ==================== SIGNATURES ====================

  async signDocument(
    documentId: string,
    userId: string,
    companyId: string,
    signerRole: string,
    signatureIp: string,
    comment?: string
  ) {
    // Проверяем доступ на подпись
    const access = await documentsRepository.checkUserAccess(documentId, userId, companyId);
    const isOwner = await documentsRepository.isDocumentOwner(documentId, userId);
    
    if (!access.can_sign && !isOwner) {
      throw new Error('Недостаточно прав для подписания документа');
    }

    const document = await documentsRepository.getDocumentById(documentId);
    if (!document) {
      throw new Error('Документ не найден');
    }

    // Проверяем статус документа
    if (document.status === 'Отменён') {
      throw new Error('Нельзя подписать отмененный документ');
    }

    // Вычисляем контрольную сумму документа
    const checksum = signatureService.calculateDocumentChecksum(document.document_data);

    // Генерируем подпись
    const signatureData = signatureService.generateSignature({
      documentId: document.id_document,
      userId,
      timestamp: new Date(),
      documentChecksum: checksum,
    });

    // Сохраняем подпись
    const signature = await documentsRepository.createSignature(
      documentId,
      userId,
      signerRole,
      signatureData,
      signatureIp,
      comment
    );

    // Обновляем статус документа на "Подписан" или "Ожидает подписи"
    const signatures = await documentsRepository.getSignaturesByDocument(documentId);
    const allSigned = signatures.every(s => s.signature.signature_status === 'Подписан');
    
    if (allSigned) {
      await documentsRepository.updateDocumentStatus(documentId, 'Подписан');
    } else if (document.status === 'Черновик') {
      await documentsRepository.updateDocumentStatus(documentId, 'Ожидает подписи');
    }

    return signature;
  }

  async rejectSignature(
    signatureId: string,
    userId: string,
    comment: string
  ) {
    const signature = await documentsRepository.getSignatureById(signatureId);
    if (!signature) {
      throw new Error('Подпись не найдена');
    }

    // Проверяем, что пользователь может отклонить подпись
    if (signature.id_user !== userId) {
      throw new Error('Недостаточно прав для отклонения подписи');
    }

    await documentsRepository.updateSignatureStatus(signatureId, 'Отклонён', undefined, comment);

    // Обновляем статус документа
    const document = await documentsRepository.getDocumentById(signature.id_document);
    if (document && document.status !== 'Отменён') {
      await documentsRepository.updateDocumentStatus(signature.id_document, 'Черновик');
    }
  }

  async getDocumentSignatures(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ
    const hasAccess = await documentsRepository.canUserAccessDocument(documentId, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    return await documentsRepository.getSignaturesByDocument(documentId);
  }

  // ==================== VERSIONS ====================

  async getDocumentVersions(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ
    const hasAccess = await documentsRepository.canUserAccessDocument(documentId, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    return await documentsRepository.getVersionsByDocument(documentId);
  }

  async getVersionById(versionId: string, userId: string, companyId: string) {
    const version = await documentsRepository.getVersionById(versionId);
    if (!version) {
      throw new Error('Версия не найдена');
    }

    // Проверяем доступ к документу
    const hasAccess = await documentsRepository.canUserAccessDocument(version.id_document, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    return version;
  }

  // ==================== ACCESS CONTROL ====================

  async grantAccess(
    documentId: string,
    userId: string,
    permissions: {
      userId?: string;
      companyId?: string;
      can_view: boolean;
      can_edit: boolean;
      can_delete: boolean;
      can_sign: boolean;
    }
  ) {
    // Проверяем, что пользователь является владельцем документа
    const isOwner = await documentsRepository.isDocumentOwner(documentId, userId);
    if (!isOwner) {
      throw new Error('Только владелец документа может предоставлять доступ');
    }

    return await documentsRepository.grantAccess(documentId, userId, permissions);
  }

  async revokeAccess(accessId: string, userId: string) {
    // TODO: добавить проверку прав на отзыв доступа
    await documentsRepository.revokeAccess(accessId);
  }

  async getDocumentAccess(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ
    const hasAccess = await documentsRepository.canUserAccessDocument(documentId, userId, companyId);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    return await documentsRepository.getDocumentAccess(documentId);
  }

  // ==================== HELPERS ====================

  private generateDefaultHtml(document: any): string {
    return `
      <div style="padding: 40px;">
        <h1>${document.title}</h1>
        <p><strong>Номер документа:</strong> ${document.document_number}</p>
        <p><strong>Дата:</strong> ${new Date(document.document_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Тип:</strong> ${document.document_type}</p>
        ${document.description ? `<p><strong>Описание:</strong> ${document.description}</p>` : ''}
        
        <h2>Данные документа</h2>
        <pre>${JSON.stringify(document.document_data, null, 2)}</pre>
        
        ${document.counterparty_name ? `
          <h2>Контрагент</h2>
          <p><strong>Название:</strong> ${document.counterparty_name}</p>
          ${document.counterparty_unp ? `<p><strong>УНП:</strong> ${document.counterparty_unp}</p>` : ''}
          ${document.counterparty_address ? `<p><strong>Адрес:</strong> ${document.counterparty_address}</p>` : ''}
        ` : ''}
      </div>
    `;
  }
}

export default new DocumentsService();

