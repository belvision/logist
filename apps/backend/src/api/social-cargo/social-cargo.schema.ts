import { z } from 'zod';

export const getSocialCargoSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  contains: z.string().optional(),
  notContains: z.string().optional(),
});

export type GetSocialCargoQuery = z.infer<typeof getSocialCargoSchema>;

