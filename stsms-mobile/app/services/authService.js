import { apiFetch } from '../utils/api';

export const authService = {
  login: async (email, password) => {
    return await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  forgotPassword: async (email) => {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getMe: async () => {
    return await apiFetch('/auth/me');
  },
};
