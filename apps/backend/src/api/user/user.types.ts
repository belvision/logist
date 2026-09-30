import { z } from 'zod';
import { UpdateUserProfileSchema } from './user.schema';

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;

export interface UserResponse {
  ok: boolean;
  user?: unknown;
  error?: string;
}


