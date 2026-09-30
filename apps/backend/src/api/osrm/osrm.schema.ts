import { z } from 'zod';

// Схема для построения маршрута через OSRM
export const BuildRouteSchema = z.object({
  start: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  end: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  avoidMotorwayToll: z.boolean().optional(),
  preferShortest: z.boolean().optional(),
});

export type BuildRouteDto = z.infer<typeof BuildRouteSchema>;
