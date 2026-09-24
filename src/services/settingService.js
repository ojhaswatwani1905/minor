import { apiFetch } from '../utils/api';

export const settingService = {
  getSettings: async () => {
    return await apiFetch('/settings');
  },

  updateSettings: async (settingsData) => {
    return await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  downloadBackupUrl: '/api/settings/backup',
};
