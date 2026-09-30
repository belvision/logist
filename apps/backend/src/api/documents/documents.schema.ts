// apps/backend/src/api/documents/documents.schema.ts
import { z } from 'zod';

export const documentTypeSchema = z.enum(['ТТН', 'CMR', 'Договор', 'Акт', 'Счёт', 'Счёт-фактура', 'Доверенность', 'Прочее']);
export const documentStatusSchema = z.enum(['Черновик', 'Ожидает подписи', 'Подписан', 'Отменён', 'Архив']);
export const signatureStatusSchema = z.enum(['Ожидает', 'Подписан', 'Отклонён']);

export const documentDataSchema = z.object({
  // ТТН поля
  loading_address: z.string().optional(),
  unloading_address: z.string().optional(),
  cargo_name: z.string().optional(),
  cargo_weight: z.number().optional(),
  cargo_volume: z.number().optional(),
  cargo_value: z.number().optional(),
  driver_name: z.string().optional(),
  driver_license: z.string().optional(),
  vehicle_number: z.string().optional(),
  trailer_number: z.string().optional(),
  
  // Договор поля
  contract_number: z.string().optional(),
  contract_date: z.string().optional(),
  payment_terms: z.string().optional(),
  delivery_terms: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  
  // CMR поля
  sender: z.object({
    name: z.string(),
    address: z.string(),
    country: z.string(),
  }).optional(),
  consignee: z.object({
    name: z.string(),
    address: z.string(),
    country: z.string(),
  }).optional(),
  carrier: z.object({
    name: z.string(),
    address: z.string(),
    country: z.string(),
  }).optional(),
  place_of_loading: z.string().optional(),
  place_of_delivery: z.string().optional(),
}).passthrough(); // Разрешаем дополнительные поля

export const createDocumentSchema = z.object({
  id_company: z.string().min(1, 'ID компании обязателен'),
  document_type: documentTypeSchema,
  document_number: z.string().min(1, 'Номер документа обязателен'),
  document_date: z.string().or(z.date()).transform(val => new Date(val)),
  title: z.string().min(1, 'Название документа обязательно'),
  description: z.string().optional(),
  related_cargo_id: z.number().optional(),
  related_car_id: z.number().optional(),
  related_route_id: z.number().optional(),
  counterparty_company_id: z.string().uuid().optional(),
  counterparty_name: z.string().optional(),
  counterparty_unp: z.string().optional(),
  counterparty_address: z.string().optional(),
  document_data: documentDataSchema,
  template_id: z.string().uuid().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  document_data: documentDataSchema.optional(),
  status: documentStatusSchema.optional(),
  counterparty_name: z.string().optional(),
  counterparty_unp: z.string().optional(),
  counterparty_address: z.string().optional(),
});

export const templateFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  required: z.boolean().optional(),
  default_value: z.any().optional(),
  options: z.array(z.string()).optional(),
});

export const createTemplateSchema = z.object({
  document_type: documentTypeSchema,
  name: z.string().min(1, 'Название шаблона обязательно'),
  description: z.string().optional(),
  html_template: z.string().min(1, 'HTML шаблон обязателен'),
  css_styles: z.string().optional(),
  fields: z.array(templateFieldSchema).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  html_template: z.string().min(1).optional(),
  css_styles: z.string().optional(),
  fields: z.array(templateFieldSchema).optional(),
  is_active: z.boolean().optional(),
});

export const signDocumentSchema = z.object({
  signer_role: z.string().min(1, 'Роль подписанта обязательна'),
  comment: z.string().optional(),
});

export const rejectSignatureSchema = z.object({
  comment: z.string().min(1, 'Комментарий обязателен при отклонении'),
});

export const grantAccessSchema = z.object({
  user_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  can_view: z.boolean().default(true),
  can_edit: z.boolean().default(false),
  can_delete: z.boolean().default(false),
  can_sign: z.boolean().default(false),
}).refine(data => data.user_id || data.company_id, {
  message: 'Необходимо указать user_id или company_id',
});

// Схема для query параметров списка документов
// Query параметры приходят как строки или undefined, нужно их правильно обработать
export const listDocumentsQuerySchema = z.object({
  document_type: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  related_cargo_id: z.string().optional().nullable(),
  related_car_id: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
  page: z.string().optional().nullable(),
  limit: z.string().optional().nullable(),
}).transform((data) => ({
  document_type: data.document_type && data.document_type !== '' ? data.document_type as any : undefined,
  status: data.status && data.status !== '' ? data.status as any : undefined,
  related_cargo_id: data.related_cargo_id && data.related_cargo_id !== '' ? Number(data.related_cargo_id) : undefined,
  related_car_id: data.related_car_id && data.related_car_id !== '' ? Number(data.related_car_id) : undefined,
  search: data.search && data.search !== '' ? data.search : undefined,
  page: data.page && data.page !== '' ? Number(data.page) : 1,
  limit: data.limit && data.limit !== '' ? Number(data.limit) : 20,
}));

export const generatePdfSchema = z.object({
  document_id: z.string().uuid(),
});

