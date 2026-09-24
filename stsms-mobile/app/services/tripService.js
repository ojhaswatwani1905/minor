import { apiFetch } from '../utils/api';

export const tripService = {
  getTrips: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`/trips${query ? `?${query}` : ''}`);
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

  addCheckpoint: async (id, checkpointName) => {
    return await apiFetch(`/trips/${id}/checkpoints`, {
      method: 'POST',
      body: JSON.stringify({ checkpointName }),
    });
  },

  deleteTrip: async (id) => {
    return await apiFetch(`/trips/${id}`, {
      method: 'DELETE',
    });
  }
};
