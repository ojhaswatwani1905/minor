import { apiFetch } from '../utils/api';

export const reportService = {
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/reports${query ? `?${query}` : ''}`;
    return await apiFetch(endpoint);
  },
};
