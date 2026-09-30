import { z } from 'zod';
import { CreateCargoSchema, UpdateCargoSchema } from './cargo.schema';

export type CreateCargoRequest = z.infer<typeof CreateCargoSchema>;
export type UpdateCargoRequest = z.infer<typeof UpdateCargoSchema>;

export interface CargoResponse {
  ok: boolean;
  cargo?: unknown;
  error?: string;
}


