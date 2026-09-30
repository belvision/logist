import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(50).optional().or(z.literal('')),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileSchema>;


