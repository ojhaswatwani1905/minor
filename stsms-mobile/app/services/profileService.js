import { apiFetch } from '../utils/api';

export const profileService = {
  getProfile: async () => {
    return await apiFetch('/profile/me');
  },

  updateProfile: async (profileData) => {
    return await apiFetch('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  updateGuardian: async (guardianData) => {
    return await apiFetch('/profile/guardian', {
      method: 'POST',
      body: JSON.stringify(guardianData),
    });
  }
};
