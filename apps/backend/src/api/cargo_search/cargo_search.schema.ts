import { z } from 'zod';

export const CargoSearchSchema = z.object({
  id_cars: z.number().int().positive(),
  radius: z.number().int().min(1).max(500).optional(),
});

export type CargoSearchDto = z.infer<typeof CargoSearchSchema>;

export function sanitizeCargoSearchDto(input: CargoSearchDto) {
  return {
    id_cars: input.id_cars,
    radius: input.radius ?? 20,
  } satisfies CargoSearchDto;
}
