import { UpdateUserProfileSchema } from './user.schema';
import { updateCurrentUserService, uploadUserAvatarService, deleteUserAvatarService } from './user.service';
import { parseMultipartForm, validateImage } from '../../lib/fileUpload';

export async function updateMeHandler(c: any) {  
  const auth = c.get('user');
  const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
  
  if (!userId) {
    return c.json({ message: 'Требуется авторизация' }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  
  const parsed = UpdateUserProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }

  const res = await updateCurrentUserService(userId, parsed.data);  
  return c.json(res.ok ? { ok: true, user: res.user } : { error: res.error }, res.status);
}

export async function uploadUserAvatarHandler(c: any) {
  try {    
    const auth = c.get('user');
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    
    if (!userId) {
      return c.json({ message: 'Требуется авторизация' }, 401);
    }

    const { files } = await parseMultipartForm(c);
    
    if (!files || files.length === 0) {
      return c.json({ error: 'Не загружено ни одного файла' }, 400);
    }

    const file = files[0]; // Берем только первый файл
    
    // Валидация файла (максимум 2MB для аватара)
    validateImage(file, 2);

    const res = await uploadUserAvatarService(userId, file);
    
    return c.json(res.ok ? { ok: true, avatar_url: res.avatar_url } : { error: res.error }, res.status);
  } catch (error: any) {
    console.error('❌ [USER AVATAR] Error uploading user avatar:', error);
    return c.json({ 
      error: error.message || 'Ошибка при загрузке аватара',
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack
    }, 500);
  }
}

// ===== Удаление аватара пользователя =====
export async function deleteUserAvatarHandler(c: any) {
  try {    
    const auth = c.get('user');
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    
    if (!userId) {
      return c.json({ message: 'Требуется авторизация' }, 401);
    }

    const res = await deleteUserAvatarService(userId);
    
    if (res.ok) {
      return c.json({ ok: true, message: 'Аватар успешно удален' }, 200);
    } else {
      return c.json({ error: res.error }, res.status);
    }
  } catch (error: any) {
    console.error('❌ [DELETE AVATAR] Handler error:', error);
    console.error('❌ [DELETE AVATAR] Error stack:', error.stack);
    return c.json({ error: error.message || 'Ошибка при удалении аватара' }, 500);
  }
}
