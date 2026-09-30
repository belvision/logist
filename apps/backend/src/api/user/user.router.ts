import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { updateMeHandler, uploadUserAvatarHandler, deleteUserAvatarHandler } from './user.controller.ts';

export const userRouter = new Hono();

// Редактирование профиля текущего пользователя
userRouter.patch('/me', authenticate, updateMeHandler);

// Загрузка аватара пользователя
userRouter.post('/me/avatar', authenticate, uploadUserAvatarHandler);

// Удаление аватара пользователя
userRouter.delete('/me/avatar', authenticate, deleteUserAvatarHandler);


