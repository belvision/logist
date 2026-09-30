export interface PlaceSearchResponse {
  label: string;
  place: Record<string, { lat: number; lon: number }>;
}

export interface PlaceSearchResult {
  items: PlaceSearchResponse[];
}

export interface SearchPlacesRequest {
  q: string;
}

export interface SearchPlacesResponse {
  items: PlaceSearchResponse[];
}
