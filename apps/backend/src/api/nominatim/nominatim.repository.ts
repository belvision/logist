// apps/backend/src/api/nominatim/nominatim.repository.ts
import { PlaceSearchResponse } from './nominatim.types';

/**
 * Поиск населённых пунктов через внешний Nominatim-совместимый сервис
 */
export async function searchPlaces(query: string): Promise<PlaceSearchResponse[]> {
  const baseUrl = process.env.NOMINATIM_URL || 'http://10.1.1.215:8080';
  const searchUrl = `${baseUrl}/search`;
  const url = `${searchUrl}?format=json&accept-language=ru&q=${encodeURIComponent(query)}&limit=11`;

  console.log('[NOMINATIM] Searching for:', query);
  console.log('[NOMINATIM] URL:', url);

  try {
    const resp = await fetch(url, { 
      method: 'GET',
      headers: {
        'User-Agent': 'LogistGo.pro/1.0 (contact@logistgo.pro)'
      }
    });
    if (!resp.ok) {
      console.error('Nominatim API error:', resp.status, resp.statusText);
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
