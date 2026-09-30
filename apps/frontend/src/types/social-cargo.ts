export interface SocialCargo {
  id_cargo: number;
  departure_point: string;
  arrival_point: string;
  id_car_type: number;
  car_type_name?: string;
  opisanie: string | null;
  tonn: number;
  price: string | null;
  date_start: string;
  date_end: string;
  departure_place_id: Record<string, { lat: number; lon: number }>;
  arrival_place_id: Record<string, { lat: number; lon: number }>;
  status: number | null;
  tel_1: string | null;
  tel_2: string | null;
}

export interface SocialCargoResponse {
  success: boolean;
  data: SocialCargo[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SocialCargoFilters {
  contains?: string;
  notContains?: string;
}

