const API_BASE_URL = '/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('stsms_admin_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Server returned non-JSON response (${response.status}). Ensure Express server on port 5001 is active.`);
  }

  if (!response.ok) {
    throw new Error(data.message || `API Error (${response.status})`);
  }

  return data;
};
