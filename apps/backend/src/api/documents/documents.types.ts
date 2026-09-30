// apps/backend/src/api/documents/documents.types.ts

export type DocumentType = 'ТТН' | 'CMR' | 'Договор' | 'Акт' | 'Счёт' | 'Счёт-фактура' | 'Доверенность' | 'Прочее';
export type DocumentStatus = 'Черновик' | 'Ожидает подписи' | 'Подписан' | 'Отменён' | 'Архив';
export type SignatureStatus = 'Ожидает' | 'Подписан' | 'Отклонён';

export interface DocumentData {
  // Для ТТН
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
  
  // Для договора
  contract_number?: string;
  contract_date?: string;
  payment_terms?: string;
  delivery_terms?: string;
  price?: number;
  currency?: string;
  
  // Для CMR
  sender?: { name: string; address: string; country: string };
  consignee?: { name: string; address: string; country: string };
  carrier?: { name: string; address: string; country: string };
  place_of_loading?: string;
  place_of_delivery?: string;
  
  // Дополнительные поля
  [key: string]: any;
}

export interface Document {
  id_document: string;
  document_type: DocumentType;
  document_number: string;
  document_date: Date;
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
  pdf_generated_at?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required?: boolean;
  default_value?: any;
  options?: string[];
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
  created_at: Date;
  updated_at: Date;
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
  signed_at?: Date;
  rejected_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentVersion {
  id_version: string;
  id_document: string;
  version: number;
  document_data: DocumentData;
  pdf_file_path?: string;
  created_by: string;
  change_comment?: string;
  created_at: Date;
}

export interface DocumentAccess {
  id_access: string;
  id_document: string;
  id_user?: string;
  id_company?: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_sign: boolean;
  granted_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDocumentDTO {
  document_type: DocumentType;
  document_number: string;
  document_date: Date;
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

export interface CreateTemplateDTO {
  document_type: DocumentType;
  name: string;
  description?: string;
  html_template: string;
  css_styles?: string;
  fields: TemplateField[];
}

export interface SignDocumentDTO {
  signer_role: string;
  comment?: string;
}

