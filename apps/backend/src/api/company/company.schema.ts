// E:\logistgo\apps\backend\src\api\company\company.schema.ts
import { z } from 'zod';

// === ВАША СХЕМА (без изменений) ===
export const CreateCompanySchema = z.object({
  name_company: z.string().min(2).max(255),
  unp: z.string().min(9).max(9),
  entity_type: z.enum(['ИП', 'Предприятие']),
  ur_address: z.string().min(3).max(1024),
  tel_1: z.string().min(5).max(13),
  tel_2: z.string().min(5).max(13).optional().nullable(),
  email: z.string().email().nullable(),
  id_tip_company: z.number().int().positive(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;

// === СХЕМЫ ДЛЯ ДОБАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ В КОМПАНИЮ ===
export const AddUserToCompanySchema = z.object({
  email: z.string().email(),
  role: z.enum(['Администратор', 'Пользователь']), // Владелец нельзя назначить через API
  company_id: z.string().uuid(),
});

export const InviteUserToCompanySchema = z.object({
  email: z.string().email(),
  role: z.enum(['Администратор', 'Пользователь']),
  company_id: z.string().uuid(),
  message: z.string().optional(),
});

export type AddUserToCompanyDto = z.infer<typeof AddUserToCompanySchema>;
export type InviteUserToCompanyDto = z.infer<typeof InviteUserToCompanySchema>;

// === ДОБАВЛЕНО: единственная утилита нормализации после валидации ===
// Использование (в контроллере после safeParse):
//   const payload = sanitizeCompanyDto(parsed.data);
//   const res = await addCompany(payload, userId);
export function sanitizeCompanyDto(dto: CreateCompanyDto): CreateCompanyDto {
  return {
    ...dto,
    name_company: dto.name_company.trim(),
    unp: dto.unp.trim(),
    ur_address: dto.ur_address.trim(),
    tel_1: dto.tel_1.trim(),
    tel_2: dto.tel_2 ? String(dto.tel_2).trim() : null,
    email: dto.email ? dto.email.trim().toLowerCase() : null,
    id_tip_company: dto.id_tip_company,
    entity_type: dto.entity_type,
  };
}

export function sanitizeAddUserDto(dto: AddUserToCompanyDto): AddUserToCompanyDto {
  return {
    ...dto,
    email: dto.email.trim().toLowerCase(),
    role: dto.role,
    company_id: dto.company_id,
  };
}

export function sanitizeInviteUserDto(dto: InviteUserToCompanyDto): InviteUserToCompanyDto {
  return {
    ...dto,
    email: dto.email.trim().toLowerCase(),
    role: dto.role,
    company_id: dto.company_id,
    message: dto.message?.trim(),
  };
}
