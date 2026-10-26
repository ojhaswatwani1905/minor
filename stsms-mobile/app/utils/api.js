import { storage } from './storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getDetectedHost = () => {
  if (Platform.OS === 'web') return 'localhost';
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri && hostUri.includes(':')) {
    return hostUri.split(':')[0];
  }
  return '10.140.187.216';
};

export const DEFAULT_SERVER_PORT = '5001';

export const getServerBaseUrl = async () => {
  try {
    const custom = await storage.getItem('stsms_custom_server_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (e) {}

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const host = getDetectedHost();
  return `http://${host}:${DEFAULT_SERVER_PORT}/api`;
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

  // 8-second timeout for mobile networks
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Check that your phone and computer are on the same Wi-Fi network.');
    }
    console.error(`[Mobile API Error] ${url}:`, err.message);
    throw err;
  }
};
