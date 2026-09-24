import { apiFetch } from '../utils/api';

export const profileService = {
  getProfile: async () => {
    return await apiFetch('/profile');
  },

  updateProfile: async (profileData) => {
    return await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return await apiFetch('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};
