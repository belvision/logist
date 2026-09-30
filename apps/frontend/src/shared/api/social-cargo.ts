import type { SocialCargoResponse, SocialCargoFilters } from '@/types/social-cargo';
import { client } from './api';

const api = client as any;

interface GetSocialCargosParams extends SocialCargoFilters {
  limit?: number;
  offset?: number;
}

export async function getSocialCargos(params: GetSocialCargosParams = {}): Promise<SocialCargoResponse> {
  const query: Record<string, string> = {};
  
  if (params.limit) query['limit'] = params.limit.toString();
  if (params.offset) query['offset'] = params.offset.toString();
  if (params.contains) query['contains'] = params.contains;
  if (params.notContains) query['notContains'] = params.notContains;

  const response = await api['social-cargo'].$get({ query });

  if (!response.ok) {
    throw new Error(`Failed to fetch social cargos: ${response.statusText}`);
  }

  const data: SocialCargoResponse = await response.json();
  return data;
}

export async function markCargoAsIrrelevant(cargoId: number): Promise<{ success: boolean; error?: string; data?: { id_cargo: number; irrelevant: number } }> {
  const { clientAuth } = await import('./api');
  const apiAuth = clientAuth as any;
  
  const response = await apiAuth['social-cargo'][cargoId]['irrelevant'].$post();

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to mark cargo as irrelevant' }));
    console.error('❌ [API] Error response:', errorData);
    throw new Error(errorData.error || 'Failed to mark cargo as irrelevant');
  }

  const result = await response.json();
  return result;
}
