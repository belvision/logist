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
    departure_coords: z.object({
      lat: z.number(),
      lon: z.number(),
    }).optional(), // координаты точки отправления
    arrival_coords: z.object({
      lat: z.number(),
      lon: z.number(),
    }).optional(), // координаты точки прибытия
    waypoints: z.array(z.number()).optional(), // промежуточные точки
    waypoint_coords: z.array(z.object({
      lat: z.number(),
      lon: z.number(),
    })).optional(), // координаты промежуточных точек
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

// Схема для сохранения маршрута
export const SaveRouteSchema = z.object({
  departure_point: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number(), name: z.string() })
  ),
  arrival_point: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number(), name: z.string() })
  ),
  places_departure: z.array(
    z.record(
      z.string(),
      z.object({ lat: z.number(), lon: z.number(), name: z.string() })
    )
  ).optional(), // Промежуточные точки в порядке следования
});

export type BuildRouteDto = z.infer<typeof BuildRouteSchema>;
export type FindCompanionCargosDto = z.infer<typeof FindCompanionCargosSchema>;
export type SaveRouteDto = z.infer<typeof SaveRouteSchema>;
