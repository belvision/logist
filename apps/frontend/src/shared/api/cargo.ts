import { clientAuth } from '.';
import { handleApiError } from '@/lib/toast';

export interface Cargo {
    id: number;
    name: string;
    description?: string;
    tonn: number;
    m3: number;
    departure_point?: string;
    arrival_point?: string;
}


export const getCargos = async (companyId: string | number): Promise<any[]> => {
    try {
      const res = await (clientAuth as any)['cargo']['by-company'][companyId].$get();
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки грузов');
      return [];
    }
  };


export const getCargoById = async (id: number | string): Promise<any> => {
    try {
      const res = await (clientAuth as any)['cargo'][id].$get();
      return await res.json();
    } catch (error) {
      handleApiError(error, 'Не удалось получить груз');
    }
};

export const deleteCargo = async (id: number | string): Promise<any> => {
    try {
      const res = await (clientAuth as any)['cargo'][id].$delete();
      return await res.json();
    } catch (error) {
      handleApiError(error, 'Не удалось удалить груз');
    }
};

export const searchCarsForCargo = async (cargoId: number, radius?: number): Promise<any[]> => {
  try {
    const query: Record<string, string> = {};
    if (radius) {
      query['radius'] = radius.toString();
    }
    const res = await (clientAuth as any)['car-search'][cargoId].$get({ query });
    if (!res.ok) {
      throw new Error('Не удалось найти автомобили для груза');
    }
    const data = await res.json();
    return data.items ?? [];
  } catch (error) {
    handleApiError(error, 'Не удалось найти автомобили для груза');
    return [];
  }
};
