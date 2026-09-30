import { z } from 'zod';

// Схема валидации входных данных для публичного поиска автомобилей.
// location - место поиска (название города/адрес)
// radius - радиус поиска в километрах (по умолчанию 50)
// tonn_min, tonn_max - фильтры по грузоподъемности
// m3_min, m3_max - фильтры по объему
export const CarSearchPublicSchema = z.object({
  location: z.string().min(1, 'Место поиска обязательно'),
  radius: z.number().int().positive().optional(),
  tonn_min: z.number().positive().optional(),
  tonn_max: z.number().positive().optional(),
  m3_min: z.number().positive().optional(),
  m3_max: z.number().positive().optional(),
});

export type CarSearchPublicDto = z.infer<typeof CarSearchPublicSchema>;

// Утилита нормализации данных после валидации.
export function sanitizeCarSearchPublicDto(dto: CarSearchPublicDto): CarSearchPublicDto {
  return {
    ...dto,
    radius: dto.radius ?? 50,
  };
}
