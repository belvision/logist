// src/shared/api/documents.api.ts
import { clientAuth } from '.';

export type DocumentType = 'ТТН' | 'CMR' | 'Договор' | 'Акт' | 'Счёт' | 'Счёт-фактура' | 'Доверенность' | 'Прочее';
export type DocumentStatus = 'Черновик' | 'Ожидает подписи' | 'Подписан' | 'Отменён' | 'Архив';
export type SignatureStatus = 'Ожидает' | 'Подписан' | 'Отклонён';

export interface DocumentData {
  loading_address?: string;
  unloading_address?: string;
  cargo_name?: string;
  cargo_weight?: number;
  cargo_volume?: number;
  cargo_value?: number;
  driver_name?: string;
  driver_license?: string;
  vehicle_number?: string;
  trailer_number?: string;
  contract_number?: string;
  contract_date?: string;
  payment_terms?: string;
  delivery_terms?: string;
  price?: number;
  currency?: string;
  sender?: { name: string; address: string; country: string };
  consignee?: { name: string; address: string; country: string };
  carrier?: { name: string; address: string; country: string };
  place_of_loading?: string;
  place_of_delivery?: string;
  [key: string]: any;
}

export interface Document {
  id_document: string;
  document_type: DocumentType;
  document_number: string;
  document_date: string;
  status: DocumentStatus;
  id_company: string;
  created_by: string;
  title: string;
  description?: string;
  related_cargo_id?: number;
  related_car_id?: number;
  related_route_id?: number;
  counterparty_company_id?: string;
  counterparty_name?: string;
  counterparty_unp?: string;
  counterparty_address?: string;
  document_data: DocumentData;
  template_id?: string;
  version: number;
  parent_document_id?: string;
  pdf_file_path?: string;
  pdf_generated_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface DocumentWithCreator {
  document: Document;
  creator: {
    id_user: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface DocumentTemplate {
  id_template: string;
  document_type: DocumentType;
  name: string;
  description?: string;
  html_template: string;
  css_styles?: string;
  id_company?: string;
  is_active: boolean;
  is_system: boolean;
  fields: TemplateField[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required?: boolean;
  default_value?: any;
  options?: string[];
}

export interface DocumentSignature {
  id_signature: string;
  id_document: string;
  id_user: string;
  signer_role: string;
  signature_status: SignatureStatus;
  signature_data?: string;
  signature_ip?: string;
  comment?: string;
  signed_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id_version: string;
  id_document: string;
  version: number;
  document_data: DocumentData;
  pdf_file_path?: string;
  created_by: string;
  change_comment?: string;
  created_at: string;
}

export interface CreateDocumentDTO {
  id_company: string;
  document_type: DocumentType;
  document_number: string;
  document_date: string;
  title: string;
  description?: string;
  related_cargo_id?: number;
  related_car_id?: number;
  related_route_id?: number;
  counterparty_company_id?: string;
  counterparty_name?: string;
  counterparty_unp?: string;
  counterparty_address?: string;
  document_data: DocumentData;
  template_id?: string;
}

export interface UpdateDocumentDTO {
  title?: string;
  description?: string;
  document_data?: DocumentData;
  status?: DocumentStatus;
  counterparty_name?: string;
  counterparty_unp?: string;
  counterparty_address?: string;
}

export const documentsApi = {
  // Documents
  async createDocument(data: CreateDocumentDTO) {
    const res = await (clientAuth as any).documents.$post({ json: data });
    return await res.json();
  },

  async getDocuments(companyId: string, params?: {
    document_type?: DocumentType;
    status?: DocumentStatus;
    related_cargo_id?: number;
    related_car_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await (clientAuth as any).documents['by-company'][':companyId'].$get({ 
      param: { companyId },
      query: params as any
    });
    return await res.json();
  },

  async getDocument(id: string) {
    const res = await (clientAuth as any).documents[':id'].$get({ 
      param: { id }
    });
    return await res.json();
  },

  async updateDocument(id: string, data: UpdateDocumentDTO) {
    const res = await (clientAuth as any).documents[':id'].$put({ 
      param: { id },
      json: data
    });
    return await res.json();
  },

  async deleteDocument(id: string) {
    const res = await (clientAuth as any).documents[':id'].$delete({ 
      param: { id }
    });
    return await res.json();
  },

  // PDF
  async generatePdf(id: string) {
    const res = await (clientAuth as any).documents[':id']['generate-pdf'].$post({ 
      param: { id }
    });
    return await res.json();
  },

  async downloadPdf(id: string) {
    const res = await (clientAuth as any).documents[':id'].download.$get({ 
      param: { id }
    });
    return await res.blob();
  },

  // Templates
  async createTemplate(data: Partial<DocumentTemplate>) {
    const res = await (clientAuth as any).documents.templates.$post({ json: data });
    return await res.json();
  },

  async getTemplates(documentType?: DocumentType) {
    const res = await (clientAuth as any).documents.templates.$get({
      query: documentType ? { document_type: documentType } : undefined
    });
    return await res.json();
  },

  async getTemplate(id: string) {
    const res = await (clientAuth as any).documents.templates[':id'].$get({ 
      param: { id }
    });
    return await res.json();
  },

  async updateTemplate(id: string, data: Partial<DocumentTemplate>) {
    const res = await (clientAuth as any).documents.templates[':id'].$put({ 
      param: { id },
      json: data
    });
    return await res.json();
  },

  async deleteTemplate(id: string) {
    const res = await (clientAuth as any).documents.templates[':id'].$delete({ 
      param: { id }
    });
    return await res.json();
  },

  // Signatures
  async signDocument(id: string, data: { signer_role: string; comment?: string }) {
    const res = await (clientAuth as any).documents[':id'].sign.$post({ 
      param: { id },
      json: data
    });
    return await res.json();
  },

  async getSignatures(id: string) {
    const res = await (clientAuth as any).documents[':id'].signatures.$get({ 
      param: { id }
    });
    return await res.json();
  },

  async rejectSignature(signatureId: string, comment: string) {
    const res = await (clientAuth as any).documents.signatures[':signatureId'].reject.$post({ 
      param: { signatureId },
      json: { comment }
    });
    return await res.json();
  },

  // Versions
  async getVersions(id: string) {
    const res = await (clientAuth as any).documents[':id'].versions.$get({ 
      param: { id }
    });
    return await res.json();
  },

  async getVersion(versionId: string) {
    const res = await (clientAuth as any).documents.versions[':versionId'].$get({ 
      param: { versionId }
    });
    return await res.json();
  },

  // Access Control
  async grantAccess(id: string, data: {
    user_id?: string;
    company_id?: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_sign: boolean;
  }) {
    const res = await (clientAuth as any).documents[':id'].access.$post({ 
      param: { id },
      json: data
    });
    return await res.json();
  },

  async getAccess(id: string) {
    const res = await (clientAuth as any).documents[':id'].access.$get({ 
      param: { id }
    });
    return await res.json();
  },

  async revokeAccess(accessId: string) {
    const res = await (clientAuth as any).documents.access[':accessId'].$delete({ 
      param: { accessId }
    });
    return await res.json();
  },
};

