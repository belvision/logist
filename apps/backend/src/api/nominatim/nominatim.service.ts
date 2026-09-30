import { SearchPlacesDto } from './nominatim.schema';
import { searchPlaces } from './nominatim.repository';

/**
 * Поиск населённых пунктов
 */
export async function searchPlacesService(dto: SearchPlacesDto) {
  try {
    const items = await searchPlaces(dto.q);
    return { ok: true as const, status: 200, items };
  } catch (error) {
    console.error('Search places service error:', error);
    return { ok: false as const, status: 500, error: 'Ошибка поиска населённых пунктов' };
  }
}
