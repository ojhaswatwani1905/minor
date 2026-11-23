import { apiFetch } from '../utils/api';
import { storage } from '../utils/storage';

const DEADMAN_STORAGE_KEY = 'stsms_active_deadman_session';

export const deadManService = {
  /**
   * Start Dead Man's Switch safety session
   */
  startSession: async (intervalSeconds = 900, telemetry = {}, user = {}) => {
    const payload = {
      userId: user.id,
      userName: user.fullName || user.name || 'Active Traveller',
      userPhone: user.phone || '+91 98765 43210',
      intervalSeconds,
      lastKnownLocation: telemetry.location || null,
      hardwareTelemetry: telemetry.hardware || null
    };

    const res = await apiFetch('/deadman/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success && res.session) {
      await storage.setItem(DEADMAN_STORAGE_KEY, JSON.stringify(res.session));
    }
    return res;
  },

  /**
   * Get Dead Man's Switch status
   */
  getStatus: async (userId) => {
    try {
      const endpoint = userId ? `/deadman/status/${userId}` : '/deadman/status';
      const res = await apiFetch(endpoint);
      if (res.success && res.session) {
        await storage.setItem(DEADMAN_STORAGE_KEY, JSON.stringify(res.session));
        return res;
      }
    } catch (e) {
      console.warn('[DEADMAN SERVICE OFFLINE FETCH]', e.message);
    }

    // Offline cache fallback
    try {
      const cached = await storage.getItem(DEADMAN_STORAGE_KEY);
      if (cached) {
        const session = JSON.parse(cached);
        const remaining = Math.max(0, Math.round((new Date(session.nextDeadlineAt).getTime() - Date.now()) / 1000));
        return {
          success: true,
          hasActiveSession: session.status === 'ACTIVE' || session.status === 'PAUSED',
          session,
          remainingSeconds: remaining,
          effectiveStatus: session.status === 'PAUSED' ? 'PAUSED' : (remaining <= 0 ? 'OVERDUE' : 'ACTIVE'),
          isOffline: true
        };
      }
    } catch (err) {}

    return { success: true, hasActiveSession: false, session: null, remainingSeconds: 0, effectiveStatus: 'INACTIVE' };
  },

  /**
   * Tourist check-in ("I AM SAFE")
   */
  checkIn: async (sessionId, telemetry = {}, userId = null) => {
    const payload = {
      sessionId,
      userId,
      lastKnownLocation: telemetry.location || null,
      hardwareTelemetry: telemetry.hardware || null
    };

    const res = await apiFetch('/deadman/check-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success && res.session) {
      await storage.setItem(DEADMAN_STORAGE_KEY, JSON.stringify(res.session));
    }
    return res;
  },

  /**
   * Pause Dead Man's Switch session
   */
  pause: async (sessionId, userId = null) => {
    const res = await apiFetch('/deadman/pause', {
      method: 'POST',
      body: JSON.stringify({ sessionId, userId })
    });
    if (res.success && res.session) {
      await storage.setItem(DEADMAN_STORAGE_KEY, JSON.stringify(res.session));
    }
    return res;
  },

  /**
   * Resume Dead Man's Switch session
   */
  resume: async (sessionId, userId = null) => {
    const res = await apiFetch('/deadman/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId, userId })
    });
    if (res.success && res.session) {
      await storage.setItem(DEADMAN_STORAGE_KEY, JSON.stringify(res.session));
    }
    return res;
  },

  /**
   * Stop Dead Man's Switch session
   */
  stop: async (sessionId, userId = null) => {
    const res = await apiFetch('/deadman/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId, userId })
    });
    await storage.removeItem(DEADMAN_STORAGE_KEY);
    return res;
  },

  /**
   * Update background telemetry
   */
  updateTelemetry: async (sessionId, telemetry = {}, userId = null) => {
    return await apiFetch('/deadman/telemetry', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        userId,
        location: telemetry.location,
        hardwareTelemetry: telemetry.hardware
      })
    });
  }
};
