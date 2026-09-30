import { UpdateUserProfileSchema } from './user.schema';
import { updateCurrentUserService, uploadUserAvatarService, deleteUserAvatarService } from './user.service';
import { parseMultipartForm, validateImage } from '../../lib/fileUpload';

export async function updateMeHandler(c: any) {  
  const auth = c.get('user') as any;
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
    console.log('🔵 [USER AVATAR] uploadUserAvatarHandler вызван');
    
    const auth = c.get('user') as any;
    console.log('🔵 [USER AVATAR] auth объект:', JSON.stringify(auth, null, 2));
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    console.log('🔵 [USER AVATAR] userId:', userId);
    
    if (!userId) {
      console.log('❌ [USER AVATAR] Требуется авторизация - userId не найден');
      return c.json({ message: 'Требуется авторизация' }, 401);
    }

    console.log('🔵 [USER AVATAR] Парсинг multipart form...');
    const { files } = await parseMultipartForm(c);
    console.log('🔵 [USER AVATAR] Файлы получены:', files.length);
    
    if (!files || files.length === 0) {
      console.log('❌ [USER AVATAR] Файлы не найдены');
      return c.json({ error: 'Не загружено ни одного файла' }, 400);
    }

    const file = files[0]; // Берем только первый файл
    console.log('🔵 [USER AVATAR] Файл:', { name: file.originalname, size: file.size, type: file.mimetype });
    
    // Валидация файла (максимум 2MB для аватара)
    validateImage(file, 2);
    console.log('✅ [USER AVATAR] Валидация прошла успешно');

    const res = await uploadUserAvatarService(userId, file);
    console.log('🔵 [USER AVATAR] Результат сервиса:', JSON.stringify(res, null, 2));
    
    return c.json(res.ok ? { ok: true, avatar_url: res.avatar_url } : { error: res.error }, res.status);
  } catch (error: any) {
    console.error('❌ [USER AVATAR] Error uploading user avatar:', error);
    console.error('❌ [USER AVATAR] Error stack:', error.stack);
    console.error('❌ [USER AVATAR] Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return c.json({ 
      error: error.message || 'Ошибка при загрузке аватара',
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack
    }, 500);
  }
}

// ===== Удаление аватара пользователя =====
export async function deleteUserAvatarHandler(c: any) {
  try {
    console.log('🔍 [DELETE AVATAR] Request received');
    console.log('🔍 [DELETE AVATAR] Headers:', Object.fromEntries(c.req.raw.headers));
    console.log('🔍 [DELETE AVATAR] Method:', c.req.method);
    console.log('🔍 [DELETE AVATAR] URL:', c.req.url);
    
    const auth = c.get('user') as any;
    console.log('🔍 [DELETE AVATAR] Auth object:', auth);
    
    const userId: string | undefined = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
    console.log('🔍 [DELETE AVATAR] User ID:', userId);
    
    if (!userId) {
      console.log('❌ [DELETE AVATAR] No user ID found in auth');
      return c.json({ message: 'Требуется авторизация' }, 401);
    }

    console.log('🔍 [DELETE AVATAR] Calling deleteUserAvatarService for user:', userId);
    const res = await deleteUserAvatarService(userId);
    console.log('🔍 [DELETE AVATAR] Service result:', res);
    
    if (res.ok) {
      console.log('✅ [DELETE AVATAR] Avatar deleted successfully');
      return c.json({ ok: true, message: 'Аватар успешно удален' }, 200);
    } else {
      console.log('❌ [DELETE AVATAR] Service error:', res.error);
      return c.json({ error: res.error }, res.status);
    }
  } catch (error: any) {
    console.error('❌ [DELETE AVATAR] Handler error:', error);
    console.error('❌ [DELETE AVATAR] Error stack:', error.stack);
    return c.json({ error: error.message || 'Ошибка при удалении аватара' }, 500);
  }
}


