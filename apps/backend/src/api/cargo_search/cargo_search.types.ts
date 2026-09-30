export interface CarsSearchRequest {
  id_cars: number;
}

export interface CarsSearchResponse {
  items: Array<{
    id_cargo: number;
    id_company: string;
    departure_point: string;
    arrival_point: string;
    id_car_type: number;
    id_tip_zagryzki: number;
    opisanie: string | null;
    tonn: number;
    m3: number;
    price: string | null;
    payment: 'Наличный' | 'Безналичный' | 'Карта' | 'Перевод';
    date_start: Date;
    date_end: Date;
    irrelevant: number | null;
    departure_place_id: Record<string, { lat: number; lon: number }>;
    arrival_place_id: Record<string, { lat: number; lon: number }>;
    status: number | null;
  }>;
}
