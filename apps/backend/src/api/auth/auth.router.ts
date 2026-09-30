import { Hono } from 'hono';
import { registerHandler, loginHandler, meHandler, refreshHandler, changePasswordHandler, mfaSetupStartHandler, mfaSetupVerifyHandler, mfaVerifyHandler, mfaDisableHandler, mfaRecoveryRegenerateHandler, googleLoginHandler } from './auth.controller';
import { authenticate } from '../middleware/auth';

export const authRouter = new Hono();

// POST /auth/register - Регистрация нового пользователя
authRouter.post('/register', registerHandler);
// POST /auth/login - Вход в систему
authRouter.post('/login', loginHandler);
// GET /auth/me - Получить данные текущего пользователя
authRouter.get('/me', meHandler);
// POST /auth/refresh - Обновить токен доступа
authRouter.post('/refresh', refreshHandler);
// PATCH /auth/change-password - Изменить пароль
authRouter.patch('/change-password', authenticate, changePasswordHandler);
// MFA routes
// POST /auth/mfa/setup/start - Начать настройку MFA
authRouter.post('/mfa/setup/start', authenticate, mfaSetupStartHandler);
// POST /auth/mfa/setup/verify - Подтвердить настройку MFA
authRouter.post('/mfa/setup/verify', authenticate, mfaSetupVerifyHandler);
// POST /auth/mfa/verify - Проверить MFA код
authRouter.post('/mfa/verify', mfaVerifyHandler);
// POST /auth/mfa/disable - Отключить MFA
authRouter.post('/mfa/disable', authenticate, mfaDisableHandler);
// POST /auth/mfa/recovery/regenerate - Перегенерировать коды восстановления
authRouter.post('/mfa/recovery/regenerate', authenticate, mfaRecoveryRegenerateHandler);
// POST /auth/google/login - Вход через Google
authRouter.post('/google/login', googleLoginHandler);

