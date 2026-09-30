import { clientAuth } from './api';

const api = clientAuth as any;

export interface CarSearchParams {
  departure_place_id?: number;
  arrival_place_id?: number;
  radius?: number;
  tonn_min?: number;
  tonn_max?: number;
  m3_min?: number;
  m3_max?: number;
}

export interface CarSearchItem {
  id_cars: number;
  title: string;
  tonn_min?: number;
  tonn_max?: number;
  m3_min?: number;
  m3_max?: number;
  price?: number;
  phone?: string;
  [key: string]: unknown;
}

export interface CarSearchResponse {
  items: CarSearchItem[];
  total?: number;
  search_location?: {
    name: string;
    lat: number;
    lon: number;
  };
}

/**
 * Поиск автомобилей с авторизацией
 */
export async function searchCarsAuth(params: CarSearchParams): Promise<CarSearchResponse> {
  const query: Record<string, string> = {};
  
  if (params.departure_place_id) query['departure_place_id'] = params.departure_place_id.toString();
  if (params.arrival_place_id) query['arrival_place_id'] = params.arrival_place_id.toString();
  if (params.radius) query['radius'] = params.radius.toString();
  if (params.tonn_min !== undefined) query['tonn_min'] = params.tonn_min.toString();
  if (params.tonn_max !== undefined) query['tonn_max'] = params.tonn_max.toString();
  if (params.m3_min !== undefined) query['m3_min'] = params.m3_min.toString();
  if (params.m3_max !== undefined) query['m3_max'] = params.m3_max.toString();

  const res = await api['car-search-public']['search-auth'].$get({ query });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as any).error || 'Ошибка поиска автомобилей');
  }
  
  return await res.json();
}

