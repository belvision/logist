import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { updateMeHandler } from './user.controller.ts';

export const userRouter = new Hono();

// Редактирование профиля текущего пользователя
userRouter.patch('/me', authenticate, updateMeHandler);


