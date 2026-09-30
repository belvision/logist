// apps/backend/src/api/crm/crm.schema.ts
import { z } from 'zod';
import type { LegalAddress, PostalAddress, PaymentTerms, BankDetails, CrmFieldPrefs } from './crm.types';

// === Enums ===
export const CrmCompanyKindSchema = z.enum(['carrier', 'customer']);
export const CrmTrustTypeSchema = z.enum(['new', 'unverified', 'reliable']);
export const CrmCustomFieldTypeSchema = z.enum(['text', 'number', 'date', 'select', 'boolean']);

// === JSONB схемы ===
export const LegalAddressSchema: z.ZodType<LegalAddress> = z.object({
  country: z.string().optional(),
  index: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  fax: z.string().optional(),
  site: z.string().url().optional(),
});

export const PostalAddressSchema: z.ZodType<PostalAddress> = z.object({
  country: z.string().optional(),
  index: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  fax: z.string().optional(),
  site: z.string().url().optional(),
});

export const PaymentTermsSchema: z.ZodType<PaymentTerms> = z.object({
  credit_limit: z.number().optional(),
  payment_deferral: z.number().int().min(0).optional(),
});

export const BankDetailsSchema: z.ZodType<BankDetails> = z.object({
  iban: z.string().optional(),
  bic: z.string().optional(),
  swift: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  inn: z.string().optional(),
  kpp: z.string().optional(),
  rs: z.string().optional(),
  ks: z.string().optional(),
});

// === Схемы для контрагентов ===
export const CreateCrmCompanySchema = z.object({
  kind: CrmCompanyKindSchema,
  trust_type: CrmTrustTypeSchema,
  name: z.string().min(1).max(255).optional(),
  unp: z.string().min(9).max(9).optional(),
  legal_address: LegalAddressSchema.optional(),
  postal_address: PostalAddressSchema.optional(),
  payment_terms: PaymentTermsSchema.optional(),
  bank_details: BankDetailsSchema.optional(),
  note: z.string().optional(),
}).refine((data) => {
  // name обязателен, если не передан unp (будет автозаполнен)
  return data.name || data.unp;
}, {
  message: 'Необходимо указать name или unp',
  path: ['name'],
});

export type CreateCrmCompanyDto = z.infer<typeof CreateCrmCompanySchema>;

export const UpdateCrmCompanySchema = z.object({
  kind: CrmCompanyKindSchema.optional(),
  trust_type: CrmTrustTypeSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  unp: z.string().min(9).max(9).optional(),
  legal_address: LegalAddressSchema.optional(),
  postal_address: PostalAddressSchema.optional(),
  payment_terms: PaymentTermsSchema.optional(),
  bank_details: BankDetailsSchema.optional(),
  note: z.string().optional(),
});

export type UpdateCrmCompanyDto = z.infer<typeof UpdateCrmCompanySchema>;

export const GetCrmCompaniesQuerySchema = z.object({
  kind: CrmCompanyKindSchema.optional(),
  trust_type: CrmTrustTypeSchema.optional(),
  search: z.string().optional(),
  unp: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetCrmCompaniesQueryDto = z.infer<typeof GetCrmCompaniesQuerySchema>;

// === Схемы для контактов ===
export const CreateCrmContactSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  note: z.string().optional(),
});

export type CreateCrmContactDto = z.infer<typeof CreateCrmContactSchema>;

// === Схемы для водителей ===
export const CreateCrmDriverSchema = z.object({
  full_name: z.string().min(1).max(255),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
});

export type CreateCrmDriverDto = z.infer<typeof CreateCrmDriverSchema>;

// === Схемы для field prefs ===
export const CrmFieldPrefSchema = z.object({
  key: z.string(),
  type: z.string(),
  active: z.boolean(),
  order: z.number().int(),
});

export const CrmFieldPrefsSchema: z.ZodType<CrmFieldPrefs> = z.object({
  version: z.number().int(),
  fields: z.array(CrmFieldPrefSchema),
});

export type CrmFieldPrefsDto = z.infer<typeof CrmFieldPrefsSchema>;

export const GetCrmFieldPrefsQuerySchema = z.object({
  kind: CrmCompanyKindSchema,
});

export type GetCrmFieldPrefsQueryDto = z.infer<typeof GetCrmFieldPrefsQuerySchema>;

// === Схемы для custom fields ===
export const CreateCrmCustomFieldSchema = z.object({
  kind: CrmCompanyKindSchema,
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  type: CrmCustomFieldTypeSchema,
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
}).refine((data) => {
  // Если type=select, options обязателен
  if (data.type === 'select') {
    return data.options && data.options.length > 0;
  }
  return true;
}, {
  message: 'Для типа select необходимо указать options',
  path: ['options'],
});

export type CreateCrmCustomFieldDto = z.infer<typeof CreateCrmCustomFieldSchema>;

export const UpdateCrmCustomFieldSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  type: CrmCustomFieldTypeSchema.optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
});

export type UpdateCrmCustomFieldDto = z.infer<typeof UpdateCrmCustomFieldSchema>;

export const GetCrmCustomFieldsQuerySchema = z.object({
  kind: CrmCompanyKindSchema,
});

export type GetCrmCustomFieldsQueryDto = z.infer<typeof GetCrmCustomFieldsQuerySchema>;

// === Схемы для custom values ===
export const CrmCustomValueSchema = z.object({
  id_field: z.string().uuid(),
  value: z.unknown(), // JSONB может быть любым типом, обязательное поле
});

export const UpsertCrmCustomValuesSchema = z.object({
  values: z.array(CrmCustomValueSchema),
});

export type UpsertCrmCustomValuesDto = z.infer<typeof UpsertCrmCustomValuesSchema>;

// === Утилиты для нормализации ===
export function sanitizeCreateCrmCompanyDto(dto: CreateCrmCompanyDto): CreateCrmCompanyDto {
  return {
    ...dto,
    name: dto.name?.trim(),
    unp: dto.unp?.trim(),
    note: dto.note?.trim(),
  };
}

export function sanitizeUpdateCrmCompanyDto(dto: UpdateCrmCompanyDto): UpdateCrmCompanyDto {
  return {
    ...dto,
    name: dto.name?.trim(),
    unp: dto.unp?.trim(),
    note: dto.note?.trim(),
  };
}

// === Схемы для vehicles ===
export const CreateCrmVehicleSchema = z.object({
  id_crm_company: z.string().uuid(),
  plate_number: z.string().min(1).max(20),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().max(17).optional(),
  note: z.string().optional(),
});

export type CreateCrmVehicleDto = z.infer<typeof CreateCrmVehicleSchema>;

export const UpdateCrmVehicleSchema = z.object({
  id_crm_company: z.string().uuid().optional(),
  plate_number: z.string().min(1).max(20).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().max(17).optional(),
  note: z.string().optional(),
});

export type UpdateCrmVehicleDto = z.infer<typeof UpdateCrmVehicleSchema>;

