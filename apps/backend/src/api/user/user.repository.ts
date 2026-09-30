import db from '../../db/client';
import { users } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function updateUserProfile(id_user: string, values: Partial<typeof users.$inferInsert>) {

  try {
    // Формируем объект для обновления только с переданными полями
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (values.email !== undefined) updateData.email = values.email;
    if (values.phone !== undefined) updateData.phone = values.phone;
    if (values.firstName !== undefined) updateData.firstName = values.firstName;
    if (values.lastName !== undefined) updateData.lastName = values.lastName;
    if (values.avatar_url !== undefined) updateData.avatar_url = values.avatar_url;
    
    const [row] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id_user as any, id_user))
      .returning({
        id_user: users.id_user,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        avatar_url: users.avatar_url,
      });
    
    return row || null;
  } catch (error) {
    throw error;
  }
}

export async function emailExistsOtherUser(email: string, excludeUserId: string) {
  const rows = await db
    .select({ id_user: users.id_user })
    .from(users)
    .where(eq(users.email as any, email))
    .limit(1);
  const row = rows[0];
  return !!(row && row.id_user !== excludeUserId);
}

export async function getUserById(id_user: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id_user as any, id_user))
    .limit(1);
  return row || null;
}
