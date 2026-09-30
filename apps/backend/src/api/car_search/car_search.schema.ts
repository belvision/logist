import { z } from 'zod';

// Схема валидации входных данных для поиска автомобилей по грузу.
// id_cargo — идентификатор груза, по которому подбираются автомобили.
// radius — радиус поиска вокруг точки отправления груза (в километрах). По умолчанию 50 км.
export const CarSearchSchema = z.object({
  id_cargo: z.number().int().positive(),
  radius: z.number().int().positive().optional(),
});

export type CarSearchDto = z.infer<typeof CarSearchSchema>;

// Утилита нормализации данных после валидации.
export function sanitizeCarSearchDto(dto: CarSearchDto): CarSearchDto {
  return {
    ...dto,
    // Если радиус не передан, используем значение по умолчанию.
    radius: dto.radius ?? 50,
  };
}