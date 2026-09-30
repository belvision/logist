import { z } from 'zod';

export const CargoSearchSchema = z.object({
  id_cars: z.number().int().positive(),
});

export type CargoSearchDto = z.infer<typeof CargoSearchSchema>;

// Утилита нормализации после валидации
export function sanitizeCargoSearchDto(dto: CargoSearchDto): CargoSearchDto {
  return {
    ...dto,
  };
}
