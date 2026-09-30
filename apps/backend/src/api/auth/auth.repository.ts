import db from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const findUserByEmail = async (email: string) => {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      username: users.username,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      mfa_enabled: users.mfa_enabled,
      mfa_secret: users.mfa_secret,
      mfa_recovery_codes: users.mfa_recovery_codes,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      phone: users.phone,
      lastPasswordUpdate: users.lastPasswordUpdate,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] || null;
};

export const findUserByUsername = async (username: string) => {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      username: users.username,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      mfa_enabled: users.mfa_enabled,
      mfa_secret: users.mfa_secret,
      mfa_recovery_codes: users.mfa_recovery_codes,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      phone: users.phone,
      lastPasswordUpdate: users.lastPasswordUpdate,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return rows[0] || null;
};

export const createUser = async (data: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => {
  const [created] = await db
    .insert(users)
    .values({
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
    })
    .returning({ 
      id_user: users.id_user, 
      email: users.email, 
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName
    });
  return created;
};

export const findUserById = async (id_user: string) => {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      mfa_enabled: users.mfa_enabled,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      phone: users.phone,
      lastPasswordUpdate: users.lastPasswordUpdate,
      avatar_url: users.avatar_url,
    })
    .from(users)
    .where(eq(users.id_user, id_user))
    .limit(1);
  return rows[0] || null;
};

export const findUserByIdInternal = async (id_user: string) => {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      username: users.username,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      mfa_enabled: users.mfa_enabled,
      mfa_secret: users.mfa_secret,
      mfa_recovery_codes: users.mfa_recovery_codes,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      phone: users.phone,
      lastPasswordUpdate: users.lastPasswordUpdate,
      avatar_url: users.avatar_url,
    })
    .from(users)
    .where(eq(users.id_user, id_user))
    .limit(1);
  return rows[0] || null;
};

export const updatePassword = async (data: {
  password: string; id_user: string;
}) => {
  const [updated] = await db
    .update(users)
    .set({
      password: data.password,
      lastPasswordUpdate: new Date(), // Используем серверное время
      updatedAt: new Date(), // Также обновляем updatedAt
    })
    .where(eq(users.id_user, data.id_user)) 
    .returning(); 
  
  if (!updated) {
    throw new Error('Пользователь не найден');
  }
  
  return updated;
};

export const updateMfaSetup = async (params: {
  id_user: string;
  mfa_enabled?: boolean;
  mfa_secret?: string | null;
  mfa_recovery_codes?: string[] | null;
  mfa_enforced_at?: Date | null;
  mfa_last_verified_at?: Date | null;
}) => {
  const [updated] = await db
    .update(users)
    .set({
      mfa_enabled: params.mfa_enabled,
      mfa_secret: params.mfa_secret as any,
      mfa_recovery_codes: params.mfa_recovery_codes as any,
      mfa_enforced_at: params.mfa_enforced_at as any,
      mfa_last_verified_at: params.mfa_last_verified_at as any,
    })
    .where(eq(users.id_user, params.id_user))
    .returning();
  return updated;
};

export const getUserMfa = async (id_user: string) => {
  const rows = await db
    .select({
      id_user: users.id_user,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      mfa_enabled: users.mfa_enabled,
      mfa_secret: users.mfa_secret,
      mfa_recovery_codes: users.mfa_recovery_codes,
    })
    .from(users)
    .where(eq(users.id_user, id_user))
    .limit(1);
  return rows[0];
};

