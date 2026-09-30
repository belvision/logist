// E:\logistgo\apps\backend\src\api\company\company.repository.ts
import db from '../../db/client';
import { company, tip_company, users_company, users, company_invitations } from '../../db/schema/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateCompanyDto } from './company.schema';

/**
 * Найти компанию по УНП (для проверки уникальности перед созданием)
 */
export async function findCompanyByUnp(unp: string) {
  const rows = await db.select().from(company).where(eq(company.unp, unp)).limit(1);
  return rows[0] || null;
}

/**
 * Создать компанию.
 * Возвращает созданную строку (включая id_company).
 */
export async function createCompany(data: CreateCompanyDto) {
  const [created] = await db
    .insert(company)
    .values({
      name_company: data.name_company,
      unp: data.unp,
      entity_type: data.entity_type,
      ur_address: data.ur_address,
      tel_1: data.tel_1,
      tel_2: data.tel_2 ?? null,
      email: data.email ?? null,
      id_tip_company: data.id_tip_company,
      // docs_approved: по схеме имеет default(false), вручную не задаём
    })
    .returning();
  return created;
}

/**
 * Связать пользователя с компанией.
 * По умолчанию роль — «Владелец» (совпадает с default в схеме),
 * но можно передать 'Администратор' или 'Пользователь'.
 *
 * Важно: здесь НЕТ onConflictDoNothing — при нарушении уникальных ограничений
 * (например, второй «Владелец» в одной компании или дубль (id_user,id_company,role))
 * БД выбросит ошибку 23505. Сервис поймает её и вернёт 409.
 */
export async function linkUserToCompany(args: {
  id_user: string;
  id_company: string;
  role?: 'Владелец' | 'Администратор' | 'Пользователь';
}) {
  const [linked] = await db
    .insert(users_company)
    .values({
      id_user: args.id_user,
      id_company: args.id_company,
      ...(args.role ? { role: args.role } : {}), // если не задано — возьмётся default('Владелец')
    })
    .returning();
  return linked;
}

/**
 * Получить список компаний (как есть)
 */
export async function getCompanies() {
  const rows = await db.select().from(company);
  return rows;
}

/**
 * Получить компании, где состоит пользователь
 */
export async function getCompaniesByUser(userId: string) {
  const rows = await db
    .select({
      id_company: company.id_company,
      name_company: company.name_company,
      unp: company.unp,
      entity_type: company.entity_type,
      ur_address: company.ur_address,
      tel_1: company.tel_1,
      tel_2: company.tel_2,
      email: company.email,
      id_tip_company: company.id_tip_company,
      docs_approved: company.docs_approved,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      role: users_company.role,
    })
    .from(users_company)
    .innerJoin(company, eq(users_company.id_company, company.id_company))
    .where(eq(users_company.id_user, userId));
  return rows;
}

/**
 * Получить список типов компаний (справочник tip_company)
 */
export async function getCompaniesType() {
  const rows = await db.select().from(tip_company);
  return rows;
}

/**
 * Найти пользователя по email
 */
export async function findUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] || null;
}

/**
 * Проверить, является ли пользователь участником компании
 */
export async function isUserInCompany(userId: string, companyId: string) {
  const rows = await db
    .select()
    .from(users_company)
    .where(and(eq(users_company.id_user, userId), eq(users_company.id_company, companyId)))
    .limit(1);
  return rows[0] || null;
}

/**
 * Получить всех пользователей компании с их ролями
 */
export async function getCompanyUsers(companyId: string) {
  const rows = await db
    .select({
      id_user: users.id_user,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      role: users_company.role,
      joinedAt: users_company.id_user_company, // временно используем ID как дату
    })
    .from(users_company)
    .innerJoin(users, eq(users_company.id_user, users.id_user))
    .where(eq(users_company.id_company, companyId));
  return rows;
}

/**
 * Удалить пользователя из компании
 */
export async function removeUserFromCompany(userId: string, companyId: string) {
  const rows = await db
    .delete(users_company)
    .where(and(eq(users_company.id_user, userId), eq(users_company.id_company, companyId)))
    .returning();
  return rows[0] || null;
}

/**
 * Обновить роль пользователя в компании
 */
export async function updateUserRoleInCompany(
  userId: string, 
  companyId: string, 
  newRole: 'Владелец' | 'Администратор' | 'Пользователь'
) {
  const rows = await db
    .update(users_company)
    .set({ role: newRole })
    .where(and(eq(users_company.id_user, userId), eq(users_company.id_company, companyId)))
    .returning();
  return rows[0] || null;
}

/**
 * Создать запись приглашения
 */
export async function createInvitation(data: {
  token: string;
  email: string;
  company_id: string;
  role: 'Владелец' | 'Администратор' | 'Пользователь';
  invited_by: string;
  message?: string;
  expires_at: Date;
}) {
  const [created] = await db
    .insert(company_invitations)
    .values(data)
    .returning();
  return created;
}

/**
 * Найти приглашение по токену
 */
export async function findInvitationByToken(token: string) {
  const rows = await db
    .select()
    .from(company_invitations)
    .where(eq(company_invitations.token, token))
    .limit(1);
  return rows[0] || null;
}

/**
 * Отметить приглашение как использованное
 */
export async function markInvitationAsUsed(token: string, used_by: string) {
  const [updated] = await db
    .update(company_invitations)
    .set({ 
      is_used: true, 
      used_at: new Date(), 
      used_by 
    })
    .where(eq(company_invitations.token, token))
    .returning();
  return updated;
}

/**
 * Проверить, не истёк ли токен
 */
export async function isInvitationExpired(token: string) {
  const invitation = await findInvitationByToken(token);
  if (!invitation) return true;
  return new Date() > invitation.expires_at;
}