import { apiFetch } from '../utils/api';

export const alertService = {
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/alerts${query ? `?${query}` : ''}`;
    return await apiFetch(endpoint);
  },

  getAlertById: async (id) => {
    return await apiFetch(`/alerts/${id}`);
  },

  updateAlertStatus: async (id, status, note) => {
    return await apiFetch(`/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  notifyGuardian: async (alertId) => {
    return await apiFetch('/alerts/notify-guardian', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  },

  simulateSosAlert: async () => {
    return await apiFetch('/alerts/simulate', {
      method: 'POST',
    });
  },
};
