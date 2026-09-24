import { apiFetch } from '../utils/api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/notifications${query ? `?${query}` : ''}`;
    return await apiFetch(endpoint);
  },

  markAsRead: async () => {
    return await apiFetch('/notifications/mark-read', {
      method: 'PUT',
    });
  },

  clearNotifications: async () => {
    return await apiFetch('/notifications/clear', {
      method: 'DELETE',
    });
  },
};
