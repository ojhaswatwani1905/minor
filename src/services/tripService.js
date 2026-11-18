import { apiFetch } from '../utils/api';

export const tripService = {
  getTrips: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/trips${query ? `?${query}` : ''}`;
    return await apiFetch(endpoint);
  },

  getTripById: async (id) => {
    return await apiFetch(`/trips/${id}`);
  },

  createTrip: async (tripData) => {
    return await apiFetch('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  },

  updateTrip: async (id, tripData) => {
    return await apiFetch(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  },

  deleteTrip: async (id) => {
    return await apiFetch(`/trips/${id}`, {
      method: 'DELETE',
    });
  },

  addCheckpoint: async (id, checkpointData) => {
    return await apiFetch(`/trips/${id}/checkpoints`, {
      method: 'POST',
      body: JSON.stringify(checkpointData),
    });
  },

  getAllSafeZones: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`/safe-zones/all${query ? `?${query}` : ''}`);
  },

  getSafeZoneIncidents: async () => {
    return await apiFetch('/safe-zones/incidents');
  },

  updateSafeZoneStatus: async (id, action) => {
    return await apiFetch(`/safe-zones/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  confirmSafe: async (id, note) => {
    return await apiFetch(`/safe-zones/${id}/confirm-safe`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};
