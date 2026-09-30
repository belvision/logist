import { clientAuth } from './api';

export const getCompanyRoutes = async (companyId: string) => {
  const response = await (clientAuth as any)['routes']['by-company'].$get({
    query: { id_company: companyId }
  });
  return response.json();
};