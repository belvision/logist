// apps/backend/src/api/documents/documents.controller.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import documentsService from './documents.service';
import {
  createDocumentSchema,
  updateDocumentSchema,
  createTemplateSchema,
  updateTemplateSchema,
  signDocumentSchema,
  rejectSignatureSchema,
  grantAccessSchema,
} from './documents.schema';

export class DocumentsController {
  // ==================== DOCUMENTS ====================

  async createDocument(c: Context) {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const validatedData = createDocumentSchema.parse(body);

      const document = await documentsService.createDocument(
        validatedData,
        user.id_user,
        validatedData.id_company // Используем id_company из тела запроса
      );

      return c.json({ document }, 201);
    } catch (error: any) {
      console.error('[createDocument] Error:', error);
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getDocument(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      const document = await documentsService.getDocument(
        documentId,
        user.id_user,
        user.companyId
      );

      return c.json({ document });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }

  async listDocuments(c: Context) {
    try {
      const user = c.get('user');
      
      // Получаем companyId из параметра URL (если есть) или из токена
      let companyId = c.req.param('companyId');
      
      if (!companyId && user.companyId) {
        companyId = user.companyId;
      }
      
      if (!companyId) {
        throw new HTTPException(400, { 
          message: 'ID компании обязателен' 
        });
      }
      
      console.log('[listDocuments] Company ID:', companyId);
      
      // В Hono query параметры извлекаются отдельно для каждого ключа
      const filters = {
        document_type: c.req.query('document_type'),
        status: c.req.query('status'),
        related_cargo_id: c.req.query('related_cargo_id') ? Number(c.req.query('related_cargo_id')) : undefined,
        related_car_id: c.req.query('related_car_id') ? Number(c.req.query('related_car_id')) : undefined,
        search: c.req.query('search'),
        page: c.req.query('page') ? Number(c.req.query('page')) : 1,
        limit: c.req.query('limit') ? Number(c.req.query('limit')) : 20,
      };
      
      console.log('[listDocuments] Filters:', JSON.stringify(filters));

      const result = await documentsService.listDocuments(companyId, filters as any);

      return c.json(result);
    } catch (error: any) {
      console.error('[listDocuments] Error:', error);
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateDocument(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');
      const body = await c.req.json();
      const validatedData = updateDocumentSchema.parse(body);

      const document = await documentsService.updateDocument(
        documentId,
        validatedData,
        user.id_user,
        user.companyId
      );

      return c.json({ document });
    } catch (error: any) {
      if (error.message.includes('прав')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async deleteDocument(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      await documentsService.deleteDocument(documentId, user.id_user, user.companyId);

      return c.json({ message: 'Документ успешно удален' });
    } catch (error: any) {
      if (error.message.includes('прав')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  // ==================== PDF ====================

  async generatePdf(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      // Проверяем доступ
      await documentsService.getDocument(documentId, user.id_user, user.companyId);

      const result = await documentsService.generateDocumentPdf(documentId);

      return c.json({
        message: 'PDF успешно сгенерирован',
        ...result,
      });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async downloadPdf(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      const pdfBuffer = await documentsService.getDocumentPdf(
        documentId,
        user.id_user,
        user.companyId
      );

      const document = await documentsService.getDocument(
        documentId,
        user.id_user,
        user.companyId
      );

      c.header('Content-Type', 'application/pdf');
      c.header('Content-Disposition', `attachment; filename="${(document as any).document_number}.pdf"`);

      return c.body(pdfBuffer as any);
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }

  // ==================== TEMPLATES ====================

  async createTemplate(c: Context) {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const validatedData = createTemplateSchema.parse(body);

      const template = await documentsService.createTemplate(
        validatedData,
        user.id_user,
        user.companyId
      );

      return c.json({ template }, 201);
    } catch (error: any) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getTemplate(c: Context) {
    try {
      const templateId = c.req.param('id');

      const template = await documentsService.getTemplate(templateId);

      return c.json({ template });
    } catch (error: any) {
      throw new HTTPException(404, { message: error.message });
    }
  }

  async listTemplates(c: Context) {
    try {
      const user = c.get('user');
      const documentType = c.req.query('document_type') as any;
      const companyId = user.companyId; // Шаблоны могут быть без привязки к компании (системные)
      
      console.log('[listTemplates] Document type:', documentType);
      console.log('[listTemplates] Company ID:', companyId);

      const templates = await documentsService.listTemplates(documentType, companyId);
      
      console.log('[listTemplates] Found templates:', templates?.length || 0);

      return c.json({ templates });
    } catch (error: any) {
      console.error('[listTemplates] Error:', error);
      throw new HTTPException(400, { message: error.message });
    }
  }

  async updateTemplate(c: Context) {
    try {
      const user = c.get('user');
      const templateId = c.req.param('id');
      const body = await c.req.json();
      const validatedData = updateTemplateSchema.parse(body);

      const template = await documentsService.updateTemplate(
        templateId,
        validatedData,
        user.id_user,
        user.companyId
      );

      return c.json({ template });
    } catch (error: any) {
      if (error.message.includes('прав') || error.message.includes('Системный')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async deleteTemplate(c: Context) {
    try {
      const user = c.get('user');
      const templateId = c.req.param('id');

      await documentsService.deleteTemplate(templateId, user.companyId);

      return c.json({ message: 'Шаблон успешно удален' });
    } catch (error: any) {
      if (error.message.includes('прав') || error.message.includes('Системный')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  // ==================== SIGNATURES ====================

  async signDocument(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');
      const body = await c.req.json();
      const validatedData = signDocumentSchema.parse(body);

      // Получаем IP адрес
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

      const signature = await documentsService.signDocument(
        documentId,
        user.id_user,
        user.companyId,
        validatedData.signer_role,
        ip,
        validatedData.comment
      );

      return c.json({
        message: 'Документ успешно подписан',
        signature,
      });
    } catch (error: any) {
      if (error.message.includes('прав')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async rejectSignature(c: Context) {
    try {
      const user = c.get('user');
      const signatureId = c.req.param('signatureId');
      const body = await c.req.json();
      const validatedData = rejectSignatureSchema.parse(body);

      await documentsService.rejectSignature(
        signatureId,
        user.id_user,
        validatedData.comment
      );

      return c.json({ message: 'Подпись отклонена' });
    } catch (error: any) {
      if (error.message.includes('прав')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getSignatures(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      const signatures = await documentsService.getDocumentSignatures(
        documentId,
        user.id_user,
        user.companyId
      );

      return c.json({ signatures });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }

  // ==================== VERSIONS ====================

  async getVersions(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      const versions = await documentsService.getDocumentVersions(
        documentId,
        user.id_user,
        user.companyId
      );

      return c.json({ versions });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }

  async getVersion(c: Context) {
    try {
      const user = c.get('user');
      const versionId = c.req.param('versionId');

      const version = await documentsService.getVersionById(
        versionId,
        user.id_user,
        user.companyId
      );

      return c.json({ version });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }

  // ==================== ACCESS CONTROL ====================

  async grantAccess(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');
      const body = await c.req.json();
      const validatedData = grantAccessSchema.parse(body);

      const access = await documentsService.grantAccess(documentId, user.id_user, {
        userId: validatedData.user_id,
        companyId: validatedData.company_id,
        can_view: validatedData.can_view,
        can_edit: validatedData.can_edit,
        can_delete: validatedData.can_delete,
        can_sign: validatedData.can_sign,
      });

      return c.json({
        message: 'Доступ предоставлен',
        access,
      });
    } catch (error: any) {
      if (error.message.includes('владелец')) {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
  }

  async revokeAccess(c: Context) {
    try {
      const user = c.get('user');
      const accessId = c.req.param('accessId');

      await documentsService.revokeAccess(accessId, user.id_user);

      return c.json({ message: 'Доступ отозван' });
    } catch (error: any) {
      throw new HTTPException(400, { message: error.message });
    }
  }

  async getAccess(c: Context) {
    try {
      const user = c.get('user');
      const documentId = c.req.param('id');

      const access = await documentsService.getDocumentAccess(
        documentId,
        user.id_user,
        user.companyId
      );

      return c.json({ access });
    } catch (error: any) {
      if (error.message === 'Доступ запрещен') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(404, { message: error.message });
    }
  }
}

export default new DocumentsController();

