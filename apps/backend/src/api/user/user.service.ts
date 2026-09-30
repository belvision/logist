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

  const updated = await updateUserProfile(userId, values);
  
  if (!updated) {
    return { ok: false as const, status: 404, error: 'Пользователь не найден' };
  }
  
  return { ok: true as const, status: 200, user: updated };
}

export async function uploadUserAvatarService(userId: string, file: UploadedFile) {
  
  // Проверяем, существует ли пользователь
  const user = await getUserById(userId);
  if (!user) {
    return { ok: false as const, status: 404, error: 'Пользователь не найден' };
  }

  try {
    // Если у пользователя уже есть аватар, удаляем старый
    if (user.avatar_url) {
      const oldFileName = extractFileNameFromUrl(user.avatar_url);
      if (oldFileName) {
        await deleteFile(oldFileName).catch(err => {
          console.warn('⚠️ [UPLOAD AVATAR SERVICE] Could not delete old avatar:', err.message);
        });
      }
    }

    // Загружаем новый аватар в MinIO
    const fileName = generateFileName('avatars', file.originalname);
    
    const url = await uploadFile(file.buffer, fileName, file.mimetype);

    // Обновляем URL аватара в БД
    await updateUserProfile(userId, { avatar_url: url } as any);

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
  
  try {
    // Проверяем, существует ли пользователь
    const user = await getUserById(userId);
    if (!user) {
      return { ok: false as const, status: 404, error: 'Пользователь не найден' };
    }

    if (!user.avatar_url) {
      // Не возвращаем ошибку, просто обновляем профиль
    } else {
      
      // Проверяем, это старый URL (localhost/Docker) или новый URL (io.logistgo.pro)
      const isOldDockerUrl = user.avatar_url.includes('localhost') || user.avatar_url.includes('127.0.0.1');
      
      if (isOldDockerUrl) {
      } else {
        // Удаляем файл из MinIO только если это не старый Docker URL
        const fileName = extractFileNameFromUrl(user.avatar_url);
        if (fileName) {
          try {
            await deleteFile(fileName);
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
    await updateUserProfile(userId, { avatar_url: null } as any);

    return { ok: true as const, status: 200 };
  } catch (error: any) {
    console.error('❌ [DELETE AVATAR SERVICE] Error:', error);
    console.error('❌ [DELETE AVATAR SERVICE] Error stack:', error.stack);
    return { ok: false as const, status: 500, error: 'Ошибка при удалении аватара' };
  }
}
