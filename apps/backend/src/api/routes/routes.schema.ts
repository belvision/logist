import { z } from 'zod';

export const CreateRouteSchema = z.object({
  id_cars: z.number().int().optional(),
  departure_point: z.string().min(1),
  arrival_point: z.string().min(1),
  places_departure: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  places_arrival: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  date_start: z.string().datetime().optional(),
  opisanie: z.string().optional(),
});

export const UpdateRouteSchema = CreateRouteSchema.partial();

export type CreateRouteDto = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteDto = z.infer<typeof UpdateRouteSchema>;
