import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(3).max(24),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

// MFA schemas
export const mfaSetupStartSchema = z.object({});

export const mfaSetupVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  mfaSetupToken: z.string().min(10),
});

export const mfaVerifySchema = z
  .object({
    pendingMfaToken: z.string().min(10),
    totpCode: z.string().regex(/^\d{6}$/).optional(),
    recoveryCode: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/).optional(),
    trustDevice: z.boolean().optional(),
  })
  .refine((d) => !!d.totpCode || !!d.recoveryCode, {
    message: 'Either totpCode or recoveryCode must be provided',
  });

export const mfaDisableSchema = z.object({
  password: z.string().min(6),
  totpCode: z.string().regex(/^\d{6}$/),
});

export const mfaRecoveryRegenerateSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/),
});

export type MfaDisableDto = z.infer<typeof mfaDisableSchema>;
export type MfaRecoveryRegenerateDto = z.infer<typeof mfaRecoveryRegenerateSchema>;

export const googleLoginSchema = z
  .object({
    idToken: z.string().min(20).optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
  })
  .refine((d) => !!d.idToken || !!d.email, {
    message: 'Provide idToken or email (dev bypass)'
  });
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;

