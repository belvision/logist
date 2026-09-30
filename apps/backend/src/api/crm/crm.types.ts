// apps/backend/src/api/crm/crm.types.ts

export type CrmCompanyKind = 'carrier' | 'customer';
export type CrmTrustType = 'new' | 'unverified' | 'reliable';
export type CrmCustomFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface LegalAddress {
  country?: string;
  index?: string;
  address?: string;
  phone?: string;
  email?: string;
  fax?: string;
  site?: string;
}

export interface PostalAddress {
  country?: string;
  index?: string;
  address?: string;
  phone?: string;
  email?: string;
  fax?: string;
  site?: string;
}

export interface PaymentTerms {
  credit_limit?: number;
  payment_deferral?: number; // дни отсрочки
}

export interface BankDetails {
  iban?: string;
  bic?: string;
  swift?: string;
  bank_name?: string;
  account_number?: string;
  // Реквизиты для СНГ
  inn?: string;
  kpp?: string;
  rs?: string;
  ks?: string;
}

export interface CrmFieldPref {
  key: string;
  type: string;
  active: boolean;
  order: number;
}

export interface CrmFieldPrefs {
  version: number;
  fields: CrmFieldPref[];
}

export interface CrmCustomFieldOptions {
  value: string;
  label: string;
}

export interface CrmVehicle {
  id_vehicle: string;
  workspace_company_id: string;
  id_crm_company: string;
  created_by: string;
  plate_number: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

