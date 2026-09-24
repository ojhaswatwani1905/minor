import { apiFetch } from '../utils/api';

export const locationService = {
  // Sync live mobile GPS coordinates to Express backend
  sendLocationUpdate: async (locationData) => {
    return await apiFetch('/monitoring/location-update', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  },

  getLiveLocations: async () => {
    return await apiFetch('/monitoring/live-locations');
  },

  getMovementHistory: async (userId) => {
    return await apiFetch(`/monitoring/history/${userId}`);
  }
};
