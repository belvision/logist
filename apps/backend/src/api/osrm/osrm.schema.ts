import { z } from 'zod';

// Схема для построения маршрута через OSRM
export const BuildRouteSchema = z.object({
  points: z.array(z.object({
    lat: z.number(),
    lon: z.number(),
  })).min(2),
  avoidMotorwayToll: z.boolean().optional(),
  preferShortest: z.boolean().optional(),
});

export type BuildRouteDto = z.infer<typeof BuildRouteSchema>;
