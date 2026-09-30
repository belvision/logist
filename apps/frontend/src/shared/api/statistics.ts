import { handleApiError } from "@/lib/toast";
import { clientAuth } from ".";

export const getStatistics = async (companyId: string | number): Promise<any[]> => {
    try {
      const res = await (clientAuth as any)['company'][companyId].stats.$get();
      const data = await res.json();
      return data;
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки грузов');
      return [];
    }
  };