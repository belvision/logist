import { z } from 'zod';

// Схема для построения маршрута
export const BuildRouteSchema = z.object({
  points: z.array(z.object({
    lat: z.number(),
    lon: z.number(),
  })).min(2),
  avoidMotorwayToll: z.boolean().optional(),
  preferShortest: z.boolean().optional(),
});

// Схема для поиска попутных грузов
export const FindCompanionCargosSchema = z.object({
  user_route: z.object({
    departure_place_id: z.number(),
    arrival_place_id: z.number(),
    waypoints: z.array(z.number()).optional(), // промежуточные точки
  }),
  min_percent: z.number().min(0).max(100).optional(),
  avoidMotorwayToll: z.boolean().optional(),
  preferShortest: z.boolean().optional(),
  withRoutes: z.boolean().optional(),
  stepMeters: z.number().optional(),
  toleranceMeters: z.number().optional(),
  user_route_geo: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.array(z.number())),
  }).optional(), // геометрия маршрута пользователя
  user_route_nodes: z.array(z.number()).optional(), // nodes маршрута пользователя
});

export type BuildRouteDto = z.infer<typeof BuildRouteSchema>;
export type FindCompanionCargosDto = z.infer<typeof FindCompanionCargosSchema>;
