import { z } from 'zod';

export const CreateRouteSchema = z.object({
  id_cars: z.number().int().positive('Необходимо выбрать автомобиль'),
  id_company: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  departure_point: z.string().min(1, 'Укажите точку отправления'),
  arrival_point: z.string().min(1, 'Укажите точку прибытия'),
  places_departure: z.union([
    z.record(
      z.string(),
      z.object({ 
        lat: z.number(), 
        lon: z.number(),
        waypoints: z.array(z.object({
          place_id: z.number(),
          lat: z.number(),
          lon: z.number(),
          name: z.string()
        })).optional()
      })
    ),
    z.object({}).passthrough()
  ]).optional(),
  places_arrival: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  date_start: z.string().datetime().optional(),
  opisanie: z.string().optional(),
});

export const UpdateRouteSchema = CreateRouteSchema.partial().omit({
  id_company: true,
  created_by: true,
});

export type CreateRouteDto = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteDto = z.infer<typeof UpdateRouteSchema>;
