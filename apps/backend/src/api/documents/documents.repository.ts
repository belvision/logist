// apps/backend/src/api/documents/documents.repository.ts
import { eq, and, or, desc, sql, like, ilike } from 'drizzle-orm';
import db from '../../db/client';
import {
  documents,
  document_templates,
  document_signatures,
  document_versions,
  document_access,
  users_company,
  company,
  users,
} from '../../db/schema/schema';
import type {
  CreateDocumentDTO,
  UpdateDocumentDTO,
  CreateTemplateDTO,
  DocumentType,
  DocumentStatus,
  SignatureStatus,
} from './documents.types';

export class DocumentsRepository {
  // ==================== DOCUMENTS ====================
  
  async createDocument(data: CreateDocumentDTO, userId: string, companyId: string) {
    const [document] = await db.insert(documents).values({
      ...data,
      id_company: companyId,
      created_by: userId,
      version: 1,
      status: 'Черновик',
    }).returning();
    return document;
  }

  async getDocumentById(documentId: string) {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id_document, documentId));
    return document;
  }

  async getDocumentsByCompany(
    companyId: string,
    filters: {
      document_type?: DocumentType;
      status?: DocumentStatus;
      related_cargo_id?: number;
      related_car_id?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { document_type, status, related_cargo_id, related_car_id, search, page = 1, limit = 20 } = filters;
    
    let query = db
      .select({
        document: documents,
        creator: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(documents)
      .leftJoin(users, eq(documents.created_by, users.id_user))
      .where(eq(documents.id_company, companyId))
      .$dynamic();

    // Применяем фильтры
    const conditions = [];
    if (document_type) conditions.push(eq(documents.document_type, document_type));
    if (status) conditions.push(eq(documents.status, status));
    if (related_cargo_id) conditions.push(eq(documents.related_cargo_id, related_cargo_id));
    if (related_car_id) conditions.push(eq(documents.related_car_id, related_car_id));
    if (search) {
      conditions.push(
        or(
          ilike(documents.title, `%${search}%`),
          ilike(documents.document_number, `%${search}%`),
          ilike(documents.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Подсчет общего количества
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(and(eq(documents.id_company, companyId), ...(conditions.length > 0 ? conditions : [sql`true`])));

    // Получаем документы с пагинацией
    const results = await query
      .orderBy(desc(documents.created_at))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      documents: results,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async updateDocument(documentId: string, data: UpdateDocumentDTO, userId: string) {
    const [updated] = await db
      .update(documents)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(documents.id_document, documentId))
      .returning();
    return updated;
  }

  async deleteDocument(documentId: string) {
    await db.delete(documents).where(eq(documents.id_document, documentId));
  }

  async updateDocumentStatus(documentId: string, status: DocumentStatus) {
    const [updated] = await db
      .update(documents)
      .set({ status, updated_at: new Date() })
      .where(eq(documents.id_document, documentId))
      .returning();
    return updated;
  }

  async savePdfPath(documentId: string, pdfPath: string, metadata?: Record<string, any>) {
    const [updated] = await db
      .update(documents)
      .set({
        pdf_file_path: pdfPath,
        pdf_generated_at: new Date(),
        metadata: metadata || {},
      })
      .where(eq(documents.id_document, documentId))
      .returning();
    return updated;
  }

  // ==================== TEMPLATES ====================

  async createTemplate(data: CreateTemplateDTO, userId: string, companyId?: string) {
    const [template] = await db.insert(document_templates).values({
      ...data,
      id_company: companyId,
      created_by: userId,
      is_active: true,
      is_system: false,
    }).returning();
    return template;
  }

  async getTemplateById(templateId: string) {
    const [template] = await db
      .select()
      .from(document_templates)
      .where(eq(document_templates.id_template, templateId));
    return template;
  }

  async getTemplatesByType(documentType: DocumentType, companyId?: string) {
    const conditions: any[] = [
      eq(document_templates.document_type, documentType),
      eq(document_templates.is_active, true),
    ];

    // Системные шаблоны или шаблоны компании
    if (companyId) {
      const accessCondition = or(
        eq(document_templates.is_system, true),
        eq(document_templates.id_company, companyId)
      );
      if (accessCondition) conditions.push(accessCondition);
    } else {
      conditions.push(eq(document_templates.is_system, true));
    }

    return await db
      .select()
      .from(document_templates)
      .where(and(...conditions))
      .orderBy(desc(document_templates.is_system), desc(document_templates.created_at));
  }

  async getAllTemplates(companyId?: string) {
    const conditions: any[] = [eq(document_templates.is_active, true)];

    if (companyId) {
      const accessCondition = or(
        eq(document_templates.is_system, true),
        eq(document_templates.id_company, companyId)
      );
      if (accessCondition) conditions.push(accessCondition);
    } else {
      conditions.push(eq(document_templates.is_system, true));
    }

    return await db
      .select()
      .from(document_templates)
      .where(and(...conditions))
      .orderBy(desc(document_templates.is_system), desc(document_templates.created_at));
  }

  async updateTemplate(templateId: string, data: Partial<CreateTemplateDTO> & { is_active?: boolean }) {
    const [updated] = await db
      .update(document_templates)
      .set({ ...data, updated_at: new Date() })
      .where(eq(document_templates.id_template, templateId))
      .returning();
    return updated;
  }

  async deleteTemplate(templateId: string) {
    // Проверяем, не системный ли шаблон
    const template = await this.getTemplateById(templateId);
    if (template?.is_system) {
      throw new Error('Системный шаблон не может быть удален');
    }
    await db.delete(document_templates).where(eq(document_templates.id_template, templateId));
  }

  // ==================== SIGNATURES ====================

  async createSignature(
    documentId: string,
    userId: string,
    signerRole: string,
    signatureData?: string,
    signatureIp?: string,
    comment?: string
  ) {
    const [signature] = await db.insert(document_signatures).values({
      id_document: documentId,
      id_user: userId,
      signer_role: signerRole,
      signature_status: signatureData ? 'Подписан' : 'Ожидает',
      signature_data: signatureData || null,
      signature_ip: signatureIp || null,
      comment: comment || null,
      signed_at: signatureData ? new Date() : null,
    }).returning();
    return signature;
  }

  async getSignaturesByDocument(documentId: string) {
    return await db
      .select({
        signature: document_signatures,
        user: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(document_signatures)
      .leftJoin(users, eq(document_signatures.id_user, users.id_user))
      .where(eq(document_signatures.id_document, documentId))
      .orderBy(document_signatures.created_at);
  }

  async updateSignatureStatus(
    signatureId: string,
    status: SignatureStatus,
    signatureData?: string,
    comment?: string
  ) {
    const [updated] = await db
      .update(document_signatures)
      .set({
        signature_status: status,
        signature_data: signatureData || null,
        comment: comment || null,
        signed_at: status === 'Подписан' ? new Date() : null,
        rejected_at: status === 'Отклонён' ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(document_signatures.id_signature, signatureId))
      .returning();
    return updated;
  }

  async getSignatureById(signatureId: string) {
    const [signature] = await db
      .select()
      .from(document_signatures)
      .where(eq(document_signatures.id_signature, signatureId));
    return signature;
  }

  // ==================== VERSIONS ====================

  async createVersion(
    documentId: string,
    version: number,
    documentData: any,
    userId: string,
    changeComment?: string,
    pdfPath?: string
  ) {
    const [versionRecord] = await db.insert(document_versions).values({
      id_document: documentId,
      version,
      document_data: documentData,
      created_by: userId,
      change_comment: changeComment || null,
      pdf_file_path: pdfPath || null,
    }).returning();
    return versionRecord;
  }

  async getVersionsByDocument(documentId: string) {
    return await db
      .select({
        version: document_versions,
        creator: {
          id_user: users.id_user,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(document_versions)
      .leftJoin(users, eq(document_versions.created_by, users.id_user))
      .where(eq(document_versions.id_document, documentId))
      .orderBy(desc(document_versions.version));
  }

  async getVersionById(versionId: string) {
    const [version] = await db
      .select()
      .from(document_versions)
      .where(eq(document_versions.id_version, versionId));
    return version;
  }

  // ==================== ACCESS CONTROL ====================

  async grantAccess(
    documentId: string,
    grantedBy: string,
    permissions: {
      userId?: string;
      companyId?: string;
      can_view: boolean;
      can_edit: boolean;
      can_delete: boolean;
      can_sign: boolean;
    }
  ) {
    const [access] = await db.insert(document_access).values({
      id_document: documentId,
      id_user: permissions.userId || null,
      id_company: permissions.companyId || null,
      can_view: permissions.can_view,
      can_edit: permissions.can_edit,
      can_delete: permissions.can_delete,
      can_sign: permissions.can_sign,
      granted_by: grantedBy,
    }).returning();
    return access;
  }

  async getDocumentAccess(documentId: string) {
    return await db
      .select()
      .from(document_access)
      .where(eq(document_access.id_document, documentId));
  }

  async checkUserAccess(documentId: string, userId: string, companyId: string) {
    // Проверяем доступ по пользователю или компании
    const accessRecords = await db
      .select()
      .from(document_access)
      .where(
        and(
          eq(document_access.id_document, documentId),
          or(
            eq(document_access.id_user, userId),
            eq(document_access.id_company, companyId)
          )
        )
      );

    // Объединяем права доступа
    const access = {
      can_view: false,
      can_edit: false,
      can_delete: false,
      can_sign: false,
    };

    for (const record of accessRecords) {
      if (record.can_view) access.can_view = true;
      if (record.can_edit) access.can_edit = true;
      if (record.can_delete) access.can_delete = true;
      if (record.can_sign) access.can_sign = true;
    }

    return access;
  }

  async revokeAccess(accessId: string) {
    await db.delete(document_access).where(eq(document_access.id_access, accessId));
  }

  async isDocumentOwner(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId);
    return document?.created_by === userId;
  }

  async canUserAccessDocument(documentId: string, userId: string, companyId: string) {
    // 1. Проверяем, является ли пользователь создателем документа
    const document = await this.getDocumentById(documentId);
    if (!document) return false;
    
    if (document.created_by === userId) return true;

    // 2. Проверяем, принадлежит ли документ компании пользователя
    if (document.id_company === companyId) {
      // Проверяем роль пользователя в компании
      const [userCompany] = await db
        .select()
        .from(users_company)
        .where(
          and(
            eq(users_company.id_user, userId),
            eq(users_company.id_company, companyId)
          )
        );

      // Владелец и Администратор имеют доступ ко всем документам компании
      if (userCompany && ['Владелец', 'Администратор'].includes(userCompany.role)) {
        return true;
      }
    }

    // 3. Проверяем явно предоставленный доступ
    const access = await this.checkUserAccess(documentId, userId, companyId);
    return access.can_view;
  }
}

export default new DocumentsRepository();

