import { storage } from '../utils/storage';
import { apiFetch } from '../utils/api';

const OFFLINE_PINGS_KEY = 'offline_location_pings_v1';
const OFFLINE_HAZARDS_KEY = 'offline_hazards_v1';
const BACKOFF_STATE_KEY = 'network_backoff_state_v1';

export const offlineStorage = {
  // Save location ping to offline queue
  saveOfflinePing: async (pingData) => {
    try {
      // Auto-purge logs older than 7 days before appending (Rules.md Data Privacy law)
      await offlineStorage.purgeOldLogs();

      const existing = (await storage.getItem(OFFLINE_PINGS_KEY)) || [];
      existing.push({
        ...pingData,
        queuedAt: new Date().toISOString()
      });
      await storage.setItem(OFFLINE_PINGS_KEY, existing);
      console.log(`[OFFLINE STORE] Saved location ping offline (${existing.length} queued)`);
      return existing.length;
    } catch (err) {
      console.error('[OFFLINE STORE ERROR]', err.message);
      return 0;
    }
  },

  // Auto-purge local location logs older than 7 days (Rules.md Data Privacy requirement)
  purgeOldLogs: async () => {
    try {
      const existing = (await storage.getItem(OFFLINE_PINGS_KEY)) || [];
      if (existing.length === 0) return 0;

      const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
      const validLogs = existing.filter(ping => {
        const time = new Date(ping.queuedAt || Date.now()).getTime();
        return time > sevenDaysAgo;
      });

      if (validLogs.length !== existing.length) {
        const purgedCount = existing.length - validLogs.length;
        await storage.setItem(OFFLINE_PINGS_KEY, validLogs);
        console.log(`[DATA PRIVACY PURGE] Purged ${purgedCount} location logs older than 7 days from local SQLite store.`);
        return purgedCount;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  // Exponential Network Back-Off Manager (Rules.md: 3 consecutive failures => 30m pause)
  getBackOffStatus: async () => {
    try {
      const state = (await storage.getItem(BACKOFF_STATE_KEY)) || { failedCount: 0, pausedUntil: null };
      const now = Date.now();

      if (state.pausedUntil && now < state.pausedUntil) {
        const remainingMins = Math.ceil((state.pausedUntil - now) / 60000);
        return {
          isPaused: true,
          remainingMins,
          failedCount: state.failedCount,
          reason: `Rules.md Modem Rest: 3 failed network calls. Sync paused for next ${remainingMins} mins to preserve battery.`
        };
      }
      return { isPaused: false, failedCount: state.failedCount };
    } catch (e) {
      return { isPaused: false, failedCount: 0 };
    }
  },

  recordSyncSuccess: async () => {
    try {
      await storage.setItem(BACKOFF_STATE_KEY, { failedCount: 0, pausedUntil: null });
    } catch (e) {}
  },

  recordSyncFailure: async () => {
    try {
      const state = (await storage.getItem(BACKOFF_STATE_KEY)) || { failedCount: 0, pausedUntil: null };
      const newCount = state.failedCount + 1;
      let pausedUntil = null;

      if (newCount >= 3) {
        // Pause network calls for 30 minutes
        pausedUntil = Date.now() + 30 * 60 * 1000;
        console.log(`[EXPONENTIAL NETWORK BACK-OFF] 3 consecutive background network syncs failed. Pausing network modem for 30 minutes!`);
      }

      await storage.setItem(BACKOFF_STATE_KEY, { failedCount: newCount, pausedUntil });
      return { failedCount: newCount, isPaused: newCount >= 3, pausedUntil };
    } catch (e) {
      return { failedCount: 1, isPaused: false };
    }
  },

  // Get all pending pings
  getPendingPings: async () => {
    try {
      return (await storage.getItem(OFFLINE_PINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  // Flush queued location pings to backend when online
  flushPendingPings: async () => {
    try {
      const backoff = await offlineStorage.getBackOffStatus();
      if (backoff.isPaused) {
        console.log(`[OFFLINE SYNC SKIPPED] ${backoff.reason}`);
        return 0;
      }

      const pending = (await storage.getItem(OFFLINE_PINGS_KEY)) || [];
      if (pending.length === 0) return 0;

      console.log(`[OFFLINE SYNC] Syncing ${pending.length} buffered location pings to server...`);
      for (const ping of pending) {
        await apiFetch('/monitoring/telemetry', {
          method: 'POST',
          body: JSON.stringify(ping)
        });
      }

      await storage.removeItem(OFFLINE_PINGS_KEY);
      await offlineStorage.recordSyncSuccess();
      console.log(`[OFFLINE SYNC COMPLETE] ${pending.length} location pings synced.`);
      return pending.length;
    } catch (err) {
      console.error('[OFFLINE SYNC FAILED]', err.message);
      await offlineStorage.recordSyncFailure();
      return 0;
    }
  }
};
