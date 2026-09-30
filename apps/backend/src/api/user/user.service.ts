import { UpdateUserProfileDto } from './user.schema';
import { emailExistsOtherUser, updateUserProfile } from './user.repository';

export async function updateCurrentUserService(userId: string, dto: UpdateUserProfileDto) {
  console.log('🟡 [USER SERVICE] updateCurrentUserService вызван');
  console.log('🟡 [USER SERVICE] userId:', userId);
  console.log('🟡 [USER SERVICE] dto:', JSON.stringify(dto, null, 2));

  if (dto.email) {
    console.log('🟡 [USER SERVICE] Проверяем email на уникальность:', dto.email);
    const exists = await emailExistsOtherUser(dto.email.toLowerCase(), userId);
    if (exists) {
      console.log('❌ [USER SERVICE] Email уже существует у другого пользователя');
      return { ok: false as const, status: 409, error: 'Пользователь с таким email уже существует' };
    }
  }

  const values: any = {};
  if (dto.email !== undefined) values.email = dto.email.toLowerCase();
  if (dto.phone !== undefined) values.phone = dto.phone;
  if (dto.firstName !== undefined) values.firstName = dto.firstName;
  if (dto.lastName !== undefined) values.lastName = dto.lastName;

  console.log('🟡 [USER SERVICE] Обновляемые значения:', JSON.stringify(values, null, 2));

  const updated = await updateUserProfile(userId, values);
  console.log('🟡 [USER SERVICE] Результат обновления в БД:', updated ? 'Успешно' : 'Не найдено');
  
  if (!updated) {
    console.log('❌ [USER SERVICE] Пользователь не найден в БД');
    return { ok: false as const, status: 404, error: 'Пользователь не найден' };
  }
  
  console.log('✅ [USER SERVICE] Профиль успешно обновлен');
  return { ok: true as const, status: 200, user: updated };
}


