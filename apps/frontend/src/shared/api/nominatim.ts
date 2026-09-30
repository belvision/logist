import { client, clientAuth } from './api';

const api = client as any;
const apiAuth = clientAuth as any;

export interface Place {
  place_id: number;
  name: string;
  lat: number;
  lon: number;
}

export interface NominatimSearchItem {
  place?: Record<string, { lat: number; lon: number }>;
  label?: string;
}

export interface NominatimSearchResponse {
  items: NominatimSearchItem[];
}

/**
 * Поиск мест через Nominatim API
 * @param query - Поисковый запрос
 * @param useAuth - Использовать авторизованный клиент (опционально)
 */
export async function searchPlaces(
  query: string,
  useAuth: boolean = false
): Promise<NominatimSearchResponse> {
  const clientToUse = useAuth ? apiAuth : api;
  const endpoint = useAuth ? 'search-auth' : 'search';
  const res = await clientToUse['nominatim']['places'][endpoint].$get({
    query: { q: query }
  });
  return await res.json();
}

