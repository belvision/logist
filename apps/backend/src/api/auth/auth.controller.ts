import { registerSchema, loginSchema, mfaSetupVerifySchema, mfaVerifySchema, mfaDisableSchema, mfaRecoveryRegenerateSchema, googleLoginSchema } from './auth.schema';
import { registerUser, loginUser, meFromToken, refreshTokens, updatePasswordService, startMfaSetup, verifyMfaSetup, verifySecondFactor, disableMfa, regenerateRecoveryCodes, googleLogin } from './auth.service';
import { verifyAccessToken } from '../../core/auth/jwt.service';

export async function registerHandler(c: any) {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const res = await registerUser({ ...parsed.data, inviteToken: (body && body.inviteToken) || undefined });
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function loginHandler(c: any) {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  }

  const res = await loginUser(parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  if ((res as any).requiresMfa) {
    return c.json({ requiresMfa: true, pendingMfaToken: (res as any).pendingMfaToken }, 200);
  }
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function meHandler(c: any) {
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = verifyAccessToken(token) as Record<string, unknown>;
    const user = await meFromToken(decoded);
    return c.json({ user });
  } catch (e: any) {
    if (e?.status === 404) {
      return c.json({ error: 'Пользователь не найден' }, 404);
    }
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function refreshHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const token = body?.refreshToken || c.req.header('x-refresh-token');
  if (!token) return c.json({ error: 'No refresh token' }, 400);
  try {
    const pair = refreshTokens(token);
    return c.json({ token: pair.token, accessToken: pair.token, refreshToken: pair.refreshToken }, 200);
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401);
  }
}

export async function changePasswordHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  
  if (!body.password || !body.id_user) {
    return c.json({ error: 'Необходимо указать пароль и ID пользователя' }, 400);
  }
  
  const result = await updatePasswordService({
    password: body.password, 
    id_user: body.id_user
  });
  
  if (!result.ok) {
    return c.json({ error: result.error }, result.status);
  }
  
  return c.json({ message: 'Пароль успешно обновлен' }, 200);
}

export async function mfaSetupStartHandler(c: any) {
  // Require authenticated user
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id as string;
  const email = decoded.email as string;
  const res = await startMfaSetup(userId, email);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ otpauthUri: res.otpauthUri, qrPngDataUrl: res.qrPngDataUrl, mfaSetupToken: res.mfaSetupToken }, 200);
}

export async function mfaSetupVerifyHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaSetupVerifySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  // Require authenticated user
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id as string;
  const res = await verifyMfaSetup(userId, parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ mfaEnabled: true, recoveryCodes: res.recoveryCodes }, 200);
}

export async function mfaVerifyHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaVerifySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const res = await verifySecondFactor(parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}

export async function mfaDisableHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaDisableSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id as string;
  const res = await disableMfa(userId, parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ mfaEnabled: false }, 200);
}

export async function mfaRecoveryRegenerateHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = mfaRecoveryRegenerateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const authHeader = c.req.header('authorization');
  if (!authHeader) return c.json({ error: 'No token' }, 401);
  const token = authHeader.replace('Bearer ', '');
  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const userId = decoded.id as string;
  const res = await regenerateRecoveryCodes(userId, parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  return c.json({ recoveryCodes: res.recoveryCodes }, 200);
}

export async function googleLoginHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = googleLoginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Некорректные данные', details: parsed.error.flatten() }, 400);
  const res = await googleLogin(parsed.data);
  if (!res.ok) return c.json({ error: res.error }, res.status);
  if ((res as any).requiresMfa) return c.json({ requiresMfa: true, pendingMfaToken: (res as any).pendingMfaToken }, 200);
  return c.json({ token: res.token, accessToken: res.token, refreshToken: (res as any).refreshToken }, 200);
}
