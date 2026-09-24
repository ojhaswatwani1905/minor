import { apiFetch } from '../utils/api';

export const userService = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/users${query ? `?${query}` : ''}`;
    return await apiFetch(endpoint);
  },

  getUserById: async (id) => {
    return await apiFetch(`/users/${id}`);
  },

  createUser: async (userData) => {
    return await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id, userData) => {
    return await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    return await apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
