import { apiFetch } from '../utils/api';

export const monitoringService = {
  getLiveLocations: async () => {
    return await apiFetch('/monitoring/live-locations');
  },

  getMovementHistory: async (userId) => {
    return await apiFetch(`/monitoring/history/${userId}`);
  },
};
