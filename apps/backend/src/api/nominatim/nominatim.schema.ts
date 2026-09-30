import { z } from 'zod';

// Схема для поиска населённых пунктов
export const SearchPlacesSchema = z.object({
  q: z.string().min(3).max(100),
});

export type SearchPlacesDto = z.infer<typeof SearchPlacesSchema>;

// Утилита нормализации после валидации
export function sanitizeSearchPlacesDto(dto: SearchPlacesDto): SearchPlacesDto {
  return {
    ...dto,
    q: dto.q.trim(),
  };
}
