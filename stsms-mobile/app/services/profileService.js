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

  updateGuardian: async (guardianData) => {
    return await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(guardianData),
    });
  },

  uploadAvatar: async (avatarData) => {
    return await apiFetch('/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarData }),
    });
  }
};
