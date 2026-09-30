import { SearchPlacesSchema, sanitizeSearchPlacesDto } from './nominatim.schema';
import { searchPlacesService } from './nominatim.service';

// ===== Поиск населённых пунктов =====
export async function searchPlacesHandler(c: any) {
  const q = (c.req.query('q') || '').toString().trim();
  if (q.length < 3) {
    return c.json({ items: [] }, 200);
  }

  const parsed = SearchPlacesSchema.safeParse({ q });
  if (!parsed.success) {
    return c.json({ error: 'Query должен содержать минимум 3 символа' }, 400);
  }

  const dto = sanitizeSearchPlacesDto(parsed.data);
  const res = await searchPlacesService(dto);
  
  return c.json(res.ok ? { items: res.items } : { error: res.error }, res.status);
}
