import { z } from 'zod';

export const CreateCarSchema = z.object({
  id_company: z.string().uuid(),
  title: z.string().min(1),
  id_car_type: z.number().int(),
  id_tip_zagryzki: z.number().int(),
  phone: z.string().min(5),
  tonn_min: z.number(),
  tonn_max: z.number(),
  m3_min: z.number(),
  m3_max: z.number(),
  price: z.number().optional(),
  year: z.number().int().nullable().optional(),
  subscription: z.boolean().optional(),
  search: z.boolean().optional(),
  places: z
    .record(
      z.string(),
      z.object({ lat: z.number(), lon: z.number(), label: z.string().optional() })
    )
    .optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const UpdateCarSchema = CreateCarSchema.partial();

export type CreateCarDto = z.infer<typeof CreateCarSchema>;
export type UpdateCarDto = z.infer<typeof UpdateCarSchema>;

// Только переключатели
export const ToggleCarFlagsSchema = z.object({
  subscription: z.boolean().optional(),
  search: z.boolean().optional(),
}).refine((v) => v.subscription !== undefined || v.search !== undefined, {
  message: 'Нужно передать subscription и/или search',
});

export type ToggleCarFlagsDto = z.infer<typeof ToggleCarFlagsSchema>;

// Схемы для управления водителями
export const AddDriverToCarSchema = z.object({
  id_user: z.string().uuid(),
});

export const RemoveDriverFromCarSchema = z.object({
  id_user: z.string().uuid(),
});

export type AddDriverToCarDto = z.infer<typeof AddDriverToCarSchema>;
export type RemoveDriverFromCarDto = z.infer<typeof RemoveDriverFromCarSchema>;

