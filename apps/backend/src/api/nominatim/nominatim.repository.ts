// apps/backend/src/api/nominatim/nominatim.repository.ts
import { PlaceSearchResponse } from './nominatim.types';

/**
 * Поиск населённых пунктов через внешний Nominatim-совместимый сервис
 */
export async function searchPlaces(query: string): Promise<PlaceSearchResponse[]> {
  const baseUrl = process.env.GEO_SEARCH_BASE_URL || 'http://10.1.1.215:8080/search';
  const url = `${baseUrl}?format=json&accept-language=ru&q=${encodeURIComponent(query)}&limit=11`;

  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      return [];
    }
    
    const arr = await resp.json().catch(() => []) as any[];
    if (!Array.isArray(arr)) {
      return [];
    }

    const items: PlaceSearchResponse[] = arr.slice(0, 10).map((it: any) => {
      const lat = Number(it.lat);
      const lon = Number(it.lon);
      const placeId = String(it.place_id ?? '');
      // Лейбл на русском
      const label = String(
        it.display_name || it.name || it.address?.city || it.address?.town || it.address?.village || 'Населённый пункт'
      );
      return {
        label,
        place: {
          [placeId]: { lat, lon },
        },
      };
    });

    return items;
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}
