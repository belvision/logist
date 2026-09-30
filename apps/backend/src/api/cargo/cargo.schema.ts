import { z } from 'zod';

export const CreateCargoSchema = z.object({
  id_company: z.string().uuid(),
  departure_point: z.string().min(1),
  arrival_point: z.string().min(1),
  id_car_type: z.number().int(),
  id_tip_zagryzki: z.number().int(),
  opisanie: z.string().optional(),
  tonn: z.number(),
  m3: z.number(),
  price: z.string().optional(),
  payment: z.enum(['Наличный', 'Безналичный', 'Карта', 'Перевод']),
  date_start: z.string().datetime(),
  date_end: z.string().datetime(),
  irrelevant: z.number().int().optional(),
  departure_place_id: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  arrival_place_id: z.record(
    z.string(),
    z.object({ lat: z.number(), lon: z.number() })
  ).optional(),
  status: z.number().int().optional(),
});

export const UpdateCargoSchema = CreateCargoSchema.partial();

export type CreateCargoDto = z.infer<typeof CreateCargoSchema>;
export type UpdateCargoDto = z.infer<typeof UpdateCargoSchema>;
