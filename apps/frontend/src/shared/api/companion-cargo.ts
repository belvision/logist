import { clientAuth } from './api';

const api = clientAuth as any;

export interface CompanionCargo {
  id_cargo: number;
  departure_place_id: number;
  arrival_place_id: number;
  departure_point: string;
  arrival_point: string;
  tonn?: number;
  m3?: number;
  car_type?: string;
  price?: string;
  opisanie?: string;
  download?: string;
  period?: string;
  payment?: string;
  date_start?: string;
  date_end?: string;
  statuse: number;
  match_percent: number;
  route?: {
    distance: number;
    duration: number;
    geometry: { coordinates: number[][] };
  };
  company?: {
    name: string;
    unp: string;
    entity_type: string;
    ur_address: string;
    tel_1: string;
    tel_2?: string;
    email?: string;
  };
}

export interface FindCompanionCargosRequest {
  user_route: {
    departure_place_id: number;
    arrival_place_id: number;
    departure_coords?: { lat: number; lon: number };
    arrival_coords?: { lat: number; lon: number };
    waypoints?: number[];
    waypoint_coords?: Array<{ lat: number; lon: number }>;
    user_route_geo?: Record<string, unknown>;
    user_route_nodes?: number[];
  };
  min_percent: number;
  withRoutes?: boolean;
  stepMeters?: number;
  toleranceMeters?: number;
}

export interface FindCompanionCargosResponse {
  items: CompanionCargo[];
}

export interface SavedRoute {
  id: number;
  departure_point: Record<string, { lat: number; lon: number; name: string }>;
  arrival_point: Record<string, { lat: number; lon: number; name: string }>;
  places_departure?: Array<Record<string, { lat: number; lon: number; name: string }>>;
}

export interface SaveRouteRequest {
  departure_point: Record<string, { lat: number; lon: number; name: string }>;
  arrival_point: Record<string, { lat: number; lon: number; name: string }>;
  places_departure?: Array<Record<string, { lat: number; lon: number; name: string }>>;
}

export const companionCargoApi = {
  /**
   * Поиск попутных грузов
   */
  async findCompanionCargos(request: FindCompanionCargosRequest): Promise<FindCompanionCargosResponse> {
    const res = await api['companion-cargo']['companion-cargos'].$post({ json: request });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error((errorData as any).error || 'Ошибка поиска попутных грузов');
    }
    return await res.json();
  },

  /**
   * Получить сохраненные маршруты
   */
  async getSavedRoutes(): Promise<{ routes: SavedRoute[] }> {
    const res = await api['companion-cargo']['saved-routes'].$get();
    if (!res.ok) {
      throw new Error('Ошибка загрузки сохраненных маршрутов');
    }
    return await res.json();
  },

  /**
   * Сохранить маршрут
   */
  async saveRoute(request: SaveRouteRequest): Promise<{ success: boolean; route?: SavedRoute; error?: string }> {
    const res = await api['companion-cargo']['saved-routes'].$post({ json: request });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error((errorData as any).error || 'Ошибка сохранения маршрута');
    }
    return await res.json();
  },
};

