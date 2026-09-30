import db from '../../db/client';
import { users } from '../../db/schema/schema';
import { eq } from 'drizzle-orm';

export async function updateUserProfile(id_user: string, values: Partial<typeof users.$inferInsert>) {
  console.log('🟢 [USER REPOSITORY] updateUserProfile вызван');
  console.log('🟢 [USER REPOSITORY] id_user:', id_user);
  console.log('🟢 [USER REPOSITORY] values:', JSON.stringify(values, null, 2));

  try {
    const [row] = await db
      .update(users)
      .set({
        email: values.email as any,
        phone: values.phone as any,
        firstName: values.firstName as any,
        lastName: values.lastName as any,
        updatedAt: new Date(),
      })
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
      });
    
    console.log('🟢 [USER REPOSITORY] Результат обновления:', row ? 'Найден' : 'Не найден');
    console.log('🟢 [USER REPOSITORY] Обновленные данные:', JSON.stringify(row, null, 2));
    
    return row || null;
  } catch (error) {
    console.log('❌ [USER REPOSITORY] Ошибка при обновлении:', error);
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


