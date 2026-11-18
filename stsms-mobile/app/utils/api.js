import { storage } from './storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production public HTTPS backend default (Render / Cloud deployment)
export const PRODUCTION_API_URL = 'https://stsms-backend.onrender.com/api';

export const getServerBaseUrl = async () => {
  try {
    const custom = await storage.getItem('stsms_custom_server_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {}

  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }

  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl && extraUrl.trim()) {
    return extraUrl.trim().replace(/\/+$/, '');
  }

  // Stable public HTTPS backend default
  return PRODUCTION_API_URL;
};

export const setServerBaseUrl = async (url) => {
  if (url && url.trim()) {
    await storage.setItem('stsms_custom_server_url', url.trim());
  } else {
    await storage.removeItem('stsms_custom_server_url');
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = await storage.getItem('stsms_mobile_token');
  const baseUrl = await getServerBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // 30-second timeout to handle mobile cellular networks, cold-starts, and remote endpoints safely
  const timeoutMs = options.timeoutMs || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch (e) {}
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error(`Server returned invalid response (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.message || `API Request Failed (${response.status})`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.message || '';
    if (
      err.name === 'AbortError' ||
      msg.toLowerCase().includes('cancel') ||
      msg.toLowerCase().includes('abort')
    ) {
      throw new Error('Connection timed out. Please check your internet connection or verify the server is running.');
    }
    if (msg.toLowerCase().includes('network request failed')) {
      throw new Error('Unable to connect to STSMS server. Please verify your mobile data or Wi-Fi connectivity.');
    }
    console.error(`[Mobile API Error] ${url}:`, msg);
    throw err;
  }
};
