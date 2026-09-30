import { z } from 'zod';
import { CreateCarSchema, UpdateCarSchema, ToggleCarFlagsSchema } from './cars.schema';

export type CreateCarRequest = z.infer<typeof CreateCarSchema>;
export type UpdateCarRequest = z.infer<typeof UpdateCarSchema>;
export type ToggleCarFlagsRequest = z.infer<typeof ToggleCarFlagsSchema>;

export interface CarResponse {
  ok: boolean;
  car?: unknown;
  error?: string;
}


