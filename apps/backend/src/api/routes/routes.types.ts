import { z } from 'zod';
import { CreateRouteSchema, UpdateRouteSchema } from './routes.schema';

export type CreateRouteRequest = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteRequest = z.infer<typeof UpdateRouteSchema>;

export interface RouteResponse {
  ok: boolean;
  route?: unknown;
  error?: string;
}


