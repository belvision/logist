import { Hono } from 'hono';
import { registerHandler, loginHandler, meHandler, refreshHandler, changePasswordHandler, mfaSetupStartHandler, mfaSetupVerifyHandler, mfaVerifyHandler, mfaDisableHandler, mfaRecoveryRegenerateHandler, googleLoginHandler } from './auth.controller';
import { authenticate } from '../middleware/auth';

export const authRouter = new Hono();

authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
authRouter.get('/me', meHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.patch('/change-password', authenticate, changePasswordHandler);
// MFA routes
authRouter.post('/mfa/setup/start', authenticate, mfaSetupStartHandler);
authRouter.post('/mfa/setup/verify', authenticate, mfaSetupVerifyHandler);
authRouter.post('/mfa/verify', mfaVerifyHandler);
authRouter.post('/mfa/disable', authenticate, mfaDisableHandler);
authRouter.post('/mfa/recovery/regenerate', authenticate, mfaRecoveryRegenerateHandler);
authRouter.post('/google/login', googleLoginHandler);

