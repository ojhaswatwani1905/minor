import { apiFetch } from '../utils/api';
import { storage } from '../utils/storage';

const SAFE_ZONE_STORAGE_KEY = 'stsms_active_safe_zone';

export const safeZoneService = {
  // Query destination coordinates via server geocoding proxy
  geocode: async (query) => {
    return await apiFetch(`/safe-zones/geocode?q=${encodeURIComponent(query || '')}`);
  },

  // Reverse geocode arbitrary coordinates to human-readable address
  reverseGeocode: async (lat, lng) => {
    return await apiFetch(`/safe-zones/reverse-geocode?lat=${lat}&lng=${lng}`);
  },

  // Create and activate a Safe Travel Zone (5km boundary)
  createSafeZone: async (tripData) => {
    const res = await apiFetch('/safe-zones', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
    if (res.success && res.trip) {
      await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
    }
    return res;
  },

  // Fetch active safe zone trip from server or local offline cache
  getActiveSafeZone: async (userId) => {
    try {
      const endpoint = userId ? `/safe-zones/active/${userId}` : '/safe-zones/active';
      const res = await apiFetch(endpoint);
      if (res.success && res.trip) {
        await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
        return res;
      }
    } catch (e) {
      console.warn('[SAFE ZONE SERVICE OFFLINE FETCH]', e.message);
    }

    // Fallback to local storage if offline
    try {
      const cached = await storage.getItem(SAFE_ZONE_STORAGE_KEY);
      if (cached) {
        return { success: true, active: true, trip: JSON.parse(cached), isOfflineCached: true };
      }
    } catch (err) {}

    return { success: true, active: false, trip: null };
  },

  // Send real-time GPS fix and receive FSM state transition
  sendLocationUpdate: async (tripId, telemetry) => {
    return await apiFetch(`/safe-zones/${tripId}/location`, {
      method: 'POST',
      body: JSON.stringify(telemetry),
    });
  },

  // Tourist confirms "I AM SAFE" within the 10-second grace window (no alert created)
  acknowledgeWarning: async (tripId, data = {}) => {
    const res = await apiFetch(`/safe-zones/${tripId}/acknowledge-warning`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.trip) {
      await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
    }
    return res;
  },

  // 10-second grace countdown expired with no acknowledgement: escalate to emergency SOS
  escalateBreach: async (tripId, telemetry = {}) => {
    const res = await apiFetch(`/safe-zones/${tripId}/escalate-breach`, {
      method: 'POST',
      body: JSON.stringify(telemetry),
    });
    if (res.success && res.trip) {
      await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
    }
    return res;
  },

  // Tourist confirms "I Am Safe" after warning/breach
  confirmSafe: async (tripId, note = 'Tourist confirmed safe in-app') => {
    const res = await apiFetch(`/safe-zones/${tripId}/confirm-safe`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    if (res.success && res.trip) {
      await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
    }
    return res;
  },

  // Pause, resume or complete trip
  updateStatus: async (tripId, action) => {
    const res = await apiFetch(`/safe-zones/${tripId}/status`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (action === 'COMPLETE') {
      await storage.removeItem(SAFE_ZONE_STORAGE_KEY);
    } else if (res.success && res.trip) {
      await storage.setItem(SAFE_ZONE_STORAGE_KEY, JSON.stringify(res.trip));
    }
    return res;
  },

  // Clear local cache on logout or trip end
  clearCache: async () => {
    await storage.removeItem(SAFE_ZONE_STORAGE_KEY);
  }
};

