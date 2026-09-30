import { client, clientAuth } from './api';

const api = client as any;
const apiAuth = clientAuth as any;

export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

export interface RouteData {
  distance: number;
  duration: number;
  geometry: RouteGeometry;
}

export interface BuildRouteRequest {
  points: RoutePoint[];
  avoidMotorwayToll?: boolean;
  preferShortest?: boolean;
}

export interface BuildRouteResponse {
  ok: boolean;
  data?: RouteData;
  error?: string;
}

/**
 * Построить маршрут через OSRM
 */
export async function buildRoute(
  request: BuildRouteRequest
): Promise<BuildRouteResponse> {
  const res = await api['osrm']['route'].$post({ json: request });
  return await res.json();
}

export interface CompanionRouteData extends RouteData {
  nodes?: number[];
  departure_point?: string;
  arrival_point?: string;
}

/**
 * Построить маршрут через companion-cargo endpoint (возвращает nodes)
 */
export async function buildCompanionRoute(
  request: BuildRouteRequest
): Promise<CompanionRouteData> {
  const res = await api['companion-cargo']['build-route'].$post({ json: request });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as any).error || 'Ошибка построения маршрута');
  }
  return await res.json();
}

/**
 * Построить маршрут через OSRM с авторизацией
 */
export async function buildRouteAuth(
  request: BuildRouteRequest
): Promise<BuildRouteResponse> {
  const res = await apiAuth['osrm']['route-auth'].$post({ json: request });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as any).error || 'Ошибка построения маршрута');
  }
  return await res.json();
}

