import { UpdateUserProfileDto } from './user.schema';
import { emailExistsOtherUser, updateUserProfile, getUserById } from './user.repository';
import { uploadFile, deleteFile, generateFileName, extractFileNameFromUrl } from '../../lib/minioClient';
import { UploadedFile } from '../../lib/fileUpload';

export async function updateCurrentUserService(userId: string, dto: UpdateUserProfileDto) {
  if (dto.email) {
    const exists = await emailExistsOtherUser(dto.email.toLowerCase(), userId);
    if (exists) {
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

export async function uploadUserAvatarService(userId: string, file: UploadedFile) {
  console.log('🔍 [UPLOAD AVATAR SERVICE] Starting upload for user:', userId);
  console.log('🔍 [UPLOAD AVATAR SERVICE] File:', { name: file.originalname, size: file.size, type: file.mimetype });
  
  // Проверяем, существует ли пользователь
  const user = await getUserById(userId);
  if (!user) {
    console.log('❌ [UPLOAD AVATAR SERVICE] User not found:', userId);
    return { ok: false as const, status: 404, error: 'Пользователь не найден' };
  }

  console.log('🔍 [UPLOAD AVATAR SERVICE] User found:', { id: user.id_user, email: user.email });

  try {
    // Если у пользователя уже есть аватар, удаляем старый
    if (user.avatar_url) {
      console.log('🔍 [UPLOAD AVATAR SERVICE] User has old avatar:', user.avatar_url);
      const oldFileName = extractFileNameFromUrl(user.avatar_url);
      if (oldFileName) {
        console.log('🔍 [UPLOAD AVATAR SERVICE] Deleting old avatar:', oldFileName);
        await deleteFile(oldFileName).catch(err => {
          console.warn('⚠️ [UPLOAD AVATAR SERVICE] Could not delete old avatar:', err.message);
        });
      }
    }

    // Загружаем новый аватар в MinIO
    console.log('🔍 [UPLOAD AVATAR SERVICE] Generating file name...');
    const fileName = generateFileName('avatars', file.originalname);
    console.log('🔍 [UPLOAD AVATAR SERVICE] Generated file name:', fileName);
    
    console.log('🔍 [UPLOAD AVATAR SERVICE] Uploading to MinIO...');
    const url = await uploadFile(file.buffer, fileName, file.mimetype);
    console.log('✅ [UPLOAD AVATAR SERVICE] File uploaded successfully, URL:', url);

    // Обновляем URL аватара в БД
    console.log('🔍 [UPLOAD AVATAR SERVICE] Updating user profile in database...');
    await updateUserProfile(userId, { avatar_url: url } as any);
    console.log('✅ [UPLOAD AVATAR SERVICE] User profile updated successfully');

    return { ok: true as const, status: 200, avatar_url: url };
  } catch (error: any) {
    console.error('❌ [UPLOAD AVATAR SERVICE] Error:', error);
    console.error('❌ [UPLOAD AVATAR SERVICE] Error message:', error.message);
    console.error('❌ [UPLOAD AVATAR SERVICE] Error code:', error.code);
    console.error('❌ [UPLOAD AVATAR SERVICE] Error stack:', error.stack);
    return { ok: false as const, status: 500, error: `Ошибка при загрузке аватара: ${error.message}` };
  }
}

export async function deleteUserAvatarService(userId: string) {
  console.log('🔍 [DELETE AVATAR SERVICE] Starting deletion for user:', userId);
  
  try {
    // Проверяем, существует ли пользователь
    const user = await getUserById(userId);
    if (!user) {
      console.log('❌ [DELETE AVATAR SERVICE] User not found:', userId);
      return { ok: false as const, status: 404, error: 'Пользователь не найден' };
    }

    console.log('🔍 [DELETE AVATAR SERVICE] User found:', { id: user.id_user, email: user.email, avatar_url: user.avatar_url });

    if (!user.avatar_url) {
      console.log('⚠️ [DELETE AVATAR SERVICE] User has no avatar, but continuing with deletion');
      // Не возвращаем ошибку, просто обновляем профиль
    } else {
      console.log('🔍 [DELETE AVATAR SERVICE] User has avatar:', user.avatar_url);
      
      // Проверяем, это старый URL (localhost/Docker) или новый URL (io.logistgo.pro)
      const isOldDockerUrl = user.avatar_url.includes('localhost') || user.avatar_url.includes('127.0.0.1');
      
      if (isOldDockerUrl) {
        console.log('⚠️ [DELETE AVATAR SERVICE] Avatar URL is from old Docker MinIO - skipping file deletion');
        console.log('⚠️ [DELETE AVATAR SERVICE] Old URL will be cleared from database only');
      } else {
        // Удаляем файл из MinIO только если это не старый Docker URL
        const fileName = extractFileNameFromUrl(user.avatar_url);
        if (fileName) {
          console.log('🔍 [DELETE AVATAR SERVICE] Deleting file from MinIO:', fileName);
          try {
            await deleteFile(fileName);
            console.log('✅ [DELETE AVATAR SERVICE] File deleted from MinIO');
          } catch (fileError: any) {
            console.warn('⚠️ [DELETE AVATAR SERVICE] Failed to delete file from MinIO:', fileError.message);
            console.warn('⚠️ [DELETE AVATAR SERVICE] This is OK - file might not exist or be in old Docker MinIO');
            // Продолжаем выполнение, даже если файл не удалился
          }
        } else {
          console.warn('⚠️ [DELETE AVATAR SERVICE] Could not extract filename from URL');
        }
      }
    }

    // Обновляем URL аватара в БД (устанавливаем null) - ВСЕГДА
    console.log('🔍 [DELETE AVATAR SERVICE] Updating user profile in database');
    await updateUserProfile(userId, { avatar_url: null } as any);
    console.log('✅ [DELETE AVATAR SERVICE] User profile updated successfully');
    console.log('✅ [DELETE AVATAR SERVICE] Avatar URL cleared from database');

    return { ok: true as const, status: 200 };
  } catch (error: any) {
    console.error('❌ [DELETE AVATAR SERVICE] Error:', error);
    console.error('❌ [DELETE AVATAR SERVICE] Error stack:', error.stack);
    return { ok: false as const, status: 500, error: 'Ошибка при удалении аватара' };
  }
}


