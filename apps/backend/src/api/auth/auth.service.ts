import bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto, mfaSetupVerifySchema, MfaDisableDto, MfaRecoveryRegenerateDto, GoogleLoginDto } from './auth.schema';
import { createUser, findUserByEmail, findUserByUsername, updatePassword, findUserById, getUserMfa, updateMfaSetup } from './auth.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken, signPendingMfaToken, verifyPendingMfaToken } from '../../core/auth/jwt.service';
import { acceptInvitationAndLinkUser } from '../company/company.service';
import { MfaService } from '../../core/auth/mfa.service';
import { OAuth2Client } from 'google-auth-library';

export async function registerUser(payload: RegisterDto & { inviteToken?: string }) {
  const email = payload.email.trim().toLowerCase();
  const username = payload.username.trim();

  const byEmail = await findUserByEmail(email);
  if (byEmail) {
    return { ok: false as const, status: 409, error: 'Пользователь с таким email уже существует' };
  }

  const byUsername = await findUserByUsername(username);
  if (byUsername) {
    return { ok: false as const, status: 409, error: 'Пользователь с таким логином уже существует' };
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const created = await createUser({
    email,
    username,
    password: passwordHash,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });

  // If invited, link to company with role from token
  if ((payload as any).inviteToken) {
    await acceptInvitationAndLinkUser((payload as any).inviteToken as string, created.id_user).catch(() => {});
  }

  const token = signAccessToken({ 
    id: created.id_user, 
    email: created.email, 
    username: created.username,
    firstName: created.firstName,
    lastName: created.lastName
  });
  const refreshToken = signRefreshToken({ 
    id: created.id_user, 
    email: created.email, 
    username: created.username,
    firstName: created.firstName,
    lastName: created.lastName
  });
  return { ok: true as const, status: 200, token, refreshToken };
}

export async function loginUser(payload: LoginDto) {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;
  const user = await findUserByEmail(email);
  if (!user) return { ok: false as const, status: 401, error: 'Invalid credentials' };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { ok: false as const, status: 401, error: 'Invalid credentials' };

  // MFA gate
  if ((user as any).mfa_enabled) {
    const pending = signPendingMfaToken({ userId: user.id_user });
    return { ok: true as const, status: 200, requiresMfa: true, pendingMfaToken: pending } as any;
  }

  const token = signAccessToken({ 
    id: user.id_user, 
    email: user.email, 
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  });
  const refreshToken = signRefreshToken({ 
    id: user.id_user, 
    email: user.email, 
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  });
  return { ok: true as const, status: 200, token, refreshToken };
}

// ----- Google login -----
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export async function googleLogin(payload: GoogleLoginDto) {
  // Dev bypass
  const devBypass = (process.env.DEV_GOOGLE_BYPASS || '').toLowerCase() === 'true';
  let email: string | undefined;
  let name: string | undefined;
  if (devBypass && payload.email) {
    email = payload.email.toLowerCase();
    name = payload.name || payload.email.split('@')[0];
  } else {
    const ticket = await googleClient.verifyIdToken({ idToken: payload.idToken as string, audience: process.env.GOOGLE_CLIENT_ID });
    const info = ticket.getPayload();
    if (!info || !info.email) return { ok: false as const, status: 401, error: 'Invalid Google token' };
    email = (info.email as string).toLowerCase();
    name = (info.name || email.split('@')[0]) as string;
  }

  let user = await findUserByEmail(email);
  if (!user) {
    const username = name as string;
    const created = await createUser({ email, username, password: await (await import('bcryptjs')).hash(Math.random().toString(36), 10), firstName: undefined, lastName: undefined });
    user = { ...created, id_user: created.id_user, email: created.email, username: created.username } as any;
  }
  // MFA gate, если включена
  if ((user as any).mfa_enabled) {
    const pending = signPendingMfaToken({ userId: (user as any).id_user });
    return { ok: true as const, status: 200, requiresMfa: true as const, pendingMfaToken: pending } as any;
  }
  const token = signAccessToken({ 
    id: (user as any).id_user, 
    email: user.email, 
    username: user.username,
    firstName: (user as any).firstName,
    lastName: (user as any).lastName
  });
  const refreshToken = signRefreshToken({ 
    id: (user as any).id_user, 
    email: user.email, 
    username: user.username,
    firstName: (user as any).firstName,
    lastName: (user as any).lastName
  });
  return { ok: true as const, status: 200, token, refreshToken };
}

export async function meFromToken(decoded: Record<string, unknown>) {
  const id = ((decoded as any)?.id || (decoded as any)?.userId || (decoded as any)?.sub) as string | undefined;
  if (!id) {
    const err: any = new Error('Пользователь не найден');
    err.status = 404;
    throw err;
  }
  const user = await findUserById(id);
  if (!user) {
    const err: any = new Error('Пользователь не найден');
    err.status = 404;
    throw err;
  }
  return user;
}

export function refreshTokens(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken) as any;
  const token = signAccessToken({ id: decoded.id, email: decoded.email, username: decoded.username });
  const newRefreshToken = signRefreshToken({ id: decoded.id, email: decoded.email, username: decoded.username });
  return { token, refreshToken: newRefreshToken };
}

 
export async function updatePasswordService(data: {password: string, id_user: string}) {
  try {
    const user = await findUserById(data.id_user);
    if (!user) {
      return { ok: false as const, status: 404, error: 'Пользователь не найден' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    await updatePassword({
      id_user: data.id_user,
      password: passwordHash,
    });
  
   return { ok: true as const, status: 200 };
  } catch (error) {
    console.error('Error updating password:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при обновлении пароля' };
  }
}

// ----- MFA flows -----
export async function startMfaSetup(userId: string, accountName: string) {
  const current = await getUserMfa(userId);
  if (!current) return { ok: false as const, status: 404, error: 'User not found' };
  if (current.mfa_enabled) return { ok: false as const, status: 400, error: 'MFA already enabled' };

  const gen = MfaService.generateSecret(accountName);
  const enc = MfaService.encryptSecret(gen.secret);
  // store temp secret until verification? We keep it in user.mfa_secret prior to verify for simplicity
  await updateMfaSetup({ id_user: userId, mfa_secret: enc });
  const setupToken = signPendingMfaToken({ userId });
  return { ok: true as const, status: 200, otpauthUri: gen.otpauthUri, qrPngDataUrl: await MfaService.generateQr(gen.otpauthUri), mfaSetupToken: setupToken };
}

export async function verifyMfaSetup(userId: string, dto: { code: string; mfaSetupToken: string }) {
  const parsed = mfaSetupVerifySchema.safeParse(dto);
  if (!parsed.success) return { ok: false as const, status: 400, error: 'Bad request' };
  const decoded = verifyPendingMfaToken(parsed.data.mfaSetupToken);
  if (decoded.userId !== userId) return { ok: false as const, status: 401, error: 'Invalid token' };
  const current = await getUserMfa(userId);
  if (!current) return { ok: false as const, status: 404, error: 'User not found' };
  const enc = current.mfa_secret as unknown as string;
  if (!enc) return { ok: false as const, status: 400, error: 'MFA secret not initialized' };
  const plain = MfaService.decryptSecret(enc);
  const ok = MfaService.verifyTotp(plain, parsed.data.code);
  if (!ok) return { ok: false as const, status: 400, error: 'Invalid code' };

  const count = Number(process.env.MFA_RECOVERY_CODES_COUNT || '10');
  const codes = MfaService.generateRecoveryCodes(count);
  const hashed: string[] = [];
  for (const c of codes) hashed.push(await MfaService.hashRecoveryCode(c));

  await updateMfaSetup({ id_user: userId, mfa_enabled: true, mfa_recovery_codes: hashed, mfa_enforced_at: new Date(), mfa_last_verified_at: new Date() });
  return { ok: true as const, status: 200, recoveryCodes: codes };
}

export async function verifySecondFactor(dto: { pendingMfaToken: string; totpCode?: string; recoveryCode?: string }) {
  const decoded = verifyPendingMfaToken(dto.pendingMfaToken);
  const userId = decoded.userId;
  const current = await getUserMfa(userId);
  if (!current || !current.mfa_enabled) return { ok: false as const, status: 400, error: 'MFA not enabled' };
  const secret = MfaService.decryptSecret(current.mfa_secret as unknown as string);

  let success = false;
  if (dto.totpCode) success = MfaService.verifyTotp(secret, dto.totpCode);
  if (!success && dto.recoveryCode && Array.isArray(current.mfa_recovery_codes)) {
    for (const stored of current.mfa_recovery_codes as unknown as string[]) {
      if (await MfaService.verifyRecoveryCode(dto.recoveryCode, stored)) {
        success = true;
        // Consume the used recovery code
        const remaining = (current.mfa_recovery_codes as unknown as string[]).filter((h) => h !== stored);
        await updateMfaSetup({ id_user: userId, mfa_recovery_codes: remaining });
        break;
      }
    }
  }

  if (!success) return { ok: false as const, status: 400, error: 'Invalid MFA code' };

  await updateMfaSetup({ id_user: userId, mfa_last_verified_at: new Date() });
  const token = signAccessToken({ 
    id: current.id_user, 
    email: current.email, 
    username: current.username, 
    firstName: current.firstName,
    lastName: current.lastName,
    mfa: true, 
    amr: ['pwd', 'otp'] 
  });
  const refreshToken = signRefreshToken({ 
    id: current.id_user, 
    email: current.email, 
    username: current.username, 
    firstName: current.firstName,
    lastName: current.lastName,
    mfa: true, 
    amr: ['pwd', 'otp'] 
  });
  return { ok: true as const, status: 200, token, refreshToken };
}

export async function disableMfa(userId: string, dto: MfaDisableDto) {
  const user = await findUserById(userId);
  if (!user) return { ok: false as const, status: 404, error: 'User not found' };
  if (!user.mfa_enabled) return { ok: false as const, status: 400, error: 'MFA not enabled' };
  const passwordOk = await (await import('bcryptjs')).compare(dto.password, user.password as unknown as string);
  if (!passwordOk) return { ok: false as const, status: 401, error: 'Invalid password' };
  const secret = MfaService.decryptSecret(user.mfa_secret as unknown as string);
  const totpOk = MfaService.verifyTotp(secret, dto.totpCode);
  if (!totpOk) return { ok: false as const, status: 400, error: 'Invalid TOTP code' };
  await updateMfaSetup({ id_user: userId, mfa_enabled: false, mfa_secret: null, mfa_recovery_codes: [] });
  return { ok: true as const, status: 200 };
}

export async function regenerateRecoveryCodes(userId: string, dto: MfaRecoveryRegenerateDto) {
  const user = await findUserById(userId);
  if (!user) return { ok: false as const, status: 404, error: 'User not found' };
  if (!user.mfa_enabled) return { ok: false as const, status: 400, error: 'MFA not enabled' };
  const secret = MfaService.decryptSecret(user.mfa_secret as unknown as string);
  const totpOk = MfaService.verifyTotp(secret, dto.totpCode);
  if (!totpOk) return { ok: false as const, status: 400, error: 'Invalid TOTP code' };
  const count = Number(process.env.MFA_RECOVERY_CODES_COUNT || '10');
  const codes = MfaService.generateRecoveryCodes(count);
  const hashed: string[] = [];
  for (const c of codes) hashed.push(await MfaService.hashRecoveryCode(c));
  await updateMfaSetup({ id_user: userId, mfa_recovery_codes: hashed });
  return { ok: true as const, status: 200, recoveryCodes: codes };
  }
