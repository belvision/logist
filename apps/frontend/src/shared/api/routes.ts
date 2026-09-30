import { clientAuth } from './api';

const api = clientAuth as any;

export const getCompanyRoutes = async (companyId?: string) => {
  const response = await api['routes']['by-company'].$get({
    query: { id_company: companyId }
  });
  return response.json();
};

export interface CreateRouteRequest {
  id_cars?: number;
  id_driver?: string | null;
  departure_point: string;
  arrival_point: string;
  date_start?: string;
  opisanie?: string;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Array<{ place_id: number; name: string; lat: number; lon: number }> }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
}

export const createRoute = async (data: CreateRouteRequest) => {
  const response = await api.routes.$post({ json: data });
  return response.json();
};

export const deleteRoute = async (routeId: number) => {
  const response = await api.routes[routeId].$delete();
  return response.json();
};

export interface UpdateRouteRequest {
  id_cars?: number;
  id_driver?: string | null;
  departure_point?: string;
  arrival_point?: string;
  date_start?: string;
  opisanie?: string;
  places_departure?: Record<string, { lat: number; lon: number; waypoints?: Array<{ place_id: number; name: string; lat: number; lon: number }> }>;
  places_arrival?: Record<string, { lat: number; lon: number }>;
}

export const updateRoute = async (routeId: number, data: UpdateRouteRequest) => {
  const response = await api.routes[routeId].$patch({ json: data });
  return response.json();
};