import { z } from 'zod';

export const CreateCargoSchema = z.object({
  id_company: z.string().uuid(),
  created_by: z.string().uuid().optional(), // Добавляется автоматически из контекста пользователя
  departure_point: z.string().min(1),
  arrival_point: z.string().min(1),
  id_car_type: z.number().int(),
  id_tip_zagryzki: z.number().int(),
  opisanie: z.string().optional(),
  tonn: z.number(),
  m3: z.number(),
  // Размеры груза в см (опциональные)
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  price: z.string().optional(),
  payment: z.enum(['Наличный', 'Безналичный', 'Карта', 'Перевод']),
  date_start: z.string().datetime(),
  date_end: z.string().datetime(),
  irrelevant: z.number().int().optional(),
  departure_place_id: z.union([
    z.record(z.string(), z.object({ lat: z.number(), lon: z.number() })),
    z.object({
      waypoints: z.array(z.object({
        place_id: z.number(),
        lat: z.number(),
        lon: z.number(),
        name: z.string().optional()
      })).optional()
    }).and(z.record(z.string(), z.object({ lat: z.number(), lon: z.number() })))
  ]).optional(),
  arrival_place_id: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  status: z.number().int().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const UpdateCargoSchema = CreateCargoSchema.partial();

export type CreateCargoDto = z.infer<typeof CreateCargoSchema>;
export type UpdateCargoDto = z.infer<typeof UpdateCargoSchema>;
