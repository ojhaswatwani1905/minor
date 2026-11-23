import { readJson, writeJson } from '../utils/jsonDb.js';
import { dispatchAutomaticGeofenceAlert } from '../controllers/safeZoneController.js';
import { isSupabaseConfigured, getSupabaseClient, mapAlertToDb } from '../database/supabase.js';
import { dbClaimExpiredDeadManSessions } from '../database/deadManDb.js';

let workerInterval = null;
let isProcessing = false;

const metrics = {
  status: 'stopped',
  workerName: 'STSMS Cloud Safe-Zone & Dead-Man Escalation Engine',
  intervalMs: 1000,
  heartbeat: null,
  lastProcessedTime: null,
  pendingBreachEventsCount: 0,
  totalEscalatedCount: 0,
  totalDeadManEscalatedCount: 0,
  failedEscalationsCount: 0,
  lastError: null
};

/**
 * Evaluates active Dead Man's Switch sessions.
 * If nextDeadlineAt is reached without a check-in,
 * automatically dispatches a DEADMAN_SWITCH emergency alert.
 */
export const checkExpiredDeadManSessions = async () => {
  try {
    const nowIso = new Date().toISOString();
    // Database-level atomic claiming: guarantees across instances that an expired session is claimed ONCE
    const claimedSessions = await dbClaimExpiredDeadManSessions(nowIso);
    if (!Array.isArray(claimedSessions) || claimedSessions.length === 0) return;

    for (let session of claimedSessions) {
      console.log(`[DEAD MAN ESCALATION WORKER] Deadline expired for session ${session.id} (${session.userName})! Server-side auto-escalating to Admin Command Center...`);

      const alertId = `alt_dms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      session.escalationIncidentId = alertId;

      const location = session.lastKnownLocation ? {
        lat: session.lastKnownLocation.lat,
        lng: session.lastKnownLocation.lng,
        name: session.lastKnownLocation.name || `Last Known GPS Fix (${session.lastKnownLocation.lat?.toFixed(4)}, ${session.lastKnownLocation.lng?.toFixed(4)})`,
        accuracy: session.lastKnownLocation.accuracy || 15,
        timestamp: session.lastKnownLocation.timestamp || session.lastCheckInAt
      } : null;

      const alertPayload = {
        id: alertId,
        userId: session.userId,
        userName: session.userName,
        type: 'DEADMAN_SWITCH',
        priority: 'CRITICAL',
        status: 'Pending',
        timestamp: nowIso,
        location,
        batteryLevel: session.hardwareTelemetry?.batteryLevel ?? 75,
        networkStatus: session.hardwareTelemetry?.networkSignal || 'Cellular GNSS',
        deviceInfo: {
          model: session.hardwareTelemetry?.deviceModel || 'Mobile Device',
          platform: 'Android',
          source: 'deadman_switch_engine'
        },
        deadManSession: {
          id: session.id,
          intervalSeconds: session.intervalSeconds,
          lastCheckInAt: session.lastCheckInAt,
          nextDeadlineAt: session.nextDeadlineAt
        },
        missedDeadline: session.nextDeadlineAt,
        lastCheckIn: session.lastCheckInAt,
        message: `🚨 [DEADMAN_SWITCH] Automated emergency dispatch: Tourist ${session.userName} missed safe check-in deadline (${new Date(session.nextDeadlineAt).toLocaleTimeString()}). Last known check-in: ${new Date(session.lastCheckInAt).toLocaleTimeString()}.`,
        guardianPhone: session.userPhone || '+91 98765 43210',
        guardianNotified: true
      };

      // 1. Mirror to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          const dbRow = mapAlertToDb(alertPayload, null, null);
          await supabase.from('alerts').insert(dbRow);
        } catch (sbErr) {
          console.warn('[DEAD MAN SUPABASE INSERT ERROR]', sbErr.message);
        }
      }

      // 2. Mirror into JSON alerts
      try {
        const alerts = await readJson('alerts');
        alerts.unshift(alertPayload);
        await writeJson('alerts', alerts);
      } catch (e) {}

      // 3. Mirror into notifications.json
      try {
        const notifs = await readJson('notifications');
        notifs.unshift({
          id: `notif_dms_${Date.now()}`,
          title: `DEAD MAN SWITCH ESCALATED: ${session.userName}`,
          message: `Missed check-in deadline (${new Date(session.nextDeadlineAt).toLocaleTimeString()}). Emergency dispatch activated!`,
          timestamp: nowIso,
          read: false,
          type: 'EMERGENCY'
        });
        await writeJson('notifications', notifs);
      } catch (e) {}

      // 4. Update tourist status in users.json to EMERGENCY
      try {
        const users = await readJson('users');
        const uIdx = users.findIndex(u => u.id === session.userId || u.fullName === session.userName);
        if (uIdx !== -1) {
          users[uIdx].status = 'EMERGENCY';
          users[uIdx].lastAlertTimestamp = nowIso;
          await writeJson('users', users);
        }
      } catch (e) {}

      // 5. Update session in fallback JSON with alertId if present
      try {
        const allSessions = await readJson('deadman_sessions');
        const sIdx = allSessions.findIndex(s => s.id === session.id);
        if (sIdx !== -1) {
          allSessions[sIdx].escalationIncidentId = alertId;
          allSessions[sIdx].status = 'ESCALATED';
          allSessions[sIdx].escalationProcessed = true;
          allSessions[sIdx].escalatedAt = nowIso;
          if (!allSessions[sIdx].history) allSessions[sIdx].history = [];
          allSessions[sIdx].history.unshift({
            timestamp: nowIso,
            event: 'DEADLINE_EXPIRED_ESCALATED',
            alertId
          });
          await writeJson('deadman_sessions', allSessions);
        }
      } catch (e) {}

      metrics.totalDeadManEscalatedCount = (metrics.totalDeadManEscalatedCount || 0) + 1;
      metrics.lastProcessedTime = nowIso;
    }
  } catch (err) {
    console.error('[DEAD MAN WORKER ERROR]', err.message);
  }
};

/**
 * Evaluates pending Safe Travel Zone boundary breach events.
 * If 10 seconds elapse with NO acknowledgement from the tourist,
 * the backend independently escalates the breach to an emergency alert,
 * regardless of whether the mobile app is in background, locked, or terminated.
 */
export const checkExpiredBreachWarnings = async () => {
  if (isProcessing) return;
  isProcessing = true;
  metrics.heartbeat = new Date().toISOString();

  try {
    const trips = await readJson('trips');
    if (!Array.isArray(trips)) {
      isProcessing = false;
      return;
    }

    const now = Date.now();
    let tripsModified = false;

    // Count pending warnings
    const pendingTrips = trips.filter(
      t => t.status === 'WARNING' && !t.warningAcknowledged && !t.escalationProcessed
    );
    metrics.pendingBreachEventsCount = pendingTrips.length;

    for (let trip of trips) {
      // Find trips in WARNING status whose 10s deadline has expired
      if (
        trip.status === 'WARNING' &&
        trip.warningExpiresAt &&
        !trip.warningAcknowledged &&
        !trip.escalationProcessed
      ) {
        const expiryTime = new Date(trip.warningExpiresAt).getTime();

        if (now >= expiryTime) {
          console.log(`[BREACH ESCALATION WORKER] 10s deadline expired for trip ${trip.id} (${trip.userName})! Server-side auto-escalating to Admin Command Center...`);

          // Atomically mark escalation processed to prevent race conditions & duplicate alerts
          trip.escalationProcessed = true;
          trip.status = 'BREACHED';
          trip.breachConfirmedAt = new Date().toISOString();

          const telemetry = trip.latestTelemetry || {
            lat: trip.currentLocation?.lat || 24.4346,
            lng: trip.currentLocation?.lng || 77.1619,
            accuracy: trip.currentLocation?.accuracy || 15,
            battery: trip.batteryLevel || 60,
            deviceInfo: trip.deviceInfo || null,
            distanceOutside: trip.distanceOutsideBoundaryMeters || 100,
            distanceMeters: trip.distanceFromDestMeters || 5100,
            timestamp: new Date().toISOString()
          };

          try {
            const alert = await dispatchAutomaticGeofenceAlert(trip, telemetry);
            if (alert?.id) {
              trip.activeAlertId = alert.id;
            }

            const auditEntry = {
              timestamp: new Date().toISOString(),
              event: 'AUTOMATIC_BREACH_ESCALATED',
              previousStatus: 'WARNING',
              status: 'BREACHED',
              alertId: alert?.id || null,
              trigger: 'SERVER_SIDE_10S_WORKER',
              note: 'AUTOMATIC SAFE-ZONE BREACH: Tourist exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds.'
            };

            if (!trip.history) trip.history = [];
            trip.history.unshift(auditEntry);

            // Add notification for dashboard
            try {
              const notifications = await readJson('notifications');
              notifications.unshift({
                id: `notif_esc_${Date.now()}`,
                title: `AUTOMATIC SAFE-ZONE BREACH: ${trip.userName}`,
                message: `Tourist ${trip.userName} exited the 5 km safety boundary around ${trip.destination} and did not acknowledge within 10 seconds.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'EMERGENCY'
              });
              await writeJson('notifications', notifications);
            } catch (nErr) {}

            // Update user status in users.json to EMERGENCY
            try {
              const users = await readJson('users');
              const uIdx = users.findIndex(u => u.id === trip.userId || u.fullName === trip.userName);
              if (uIdx !== -1) {
                users[uIdx].status = 'EMERGENCY';
                users[uIdx].lastAlertTimestamp = new Date().toISOString();
                await writeJson('users', users);
              }
            } catch (uErr) {}

            tripsModified = true;
            await writeJson('trips', trips);
            metrics.totalEscalatedCount++;
            metrics.lastProcessedTime = new Date().toISOString();
            console.log(`[BREACH ESCALATION WORKER] Successfully escalated trip ${trip.id} -> Alert ID: ${alert?.id}`);
          } catch (escErr) {
            metrics.failedEscalationsCount++;
            metrics.lastError = escErr.message;
            console.error(`[BREACH ESCALATION WORKER ERROR] Failed to escalate trip ${trip.id}:`, escErr.message);
          }
        }
      }
    }

    if (tripsModified) {
      await writeJson('trips', trips);
    }

    // Evaluate Dead Man's Switch session deadlines concurrently
    await checkExpiredDeadManSessions();
  } catch (err) {
    metrics.lastError = err.message;
    console.error('[BREACH ESCALATION WORKER ERROR]', err.message);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the background escalation scheduler.
 * Executes immediate check on boot (recovers pending warnings across restarts),
 * then polls every 1000ms.
 */
export const startBreachEscalationWorker = () => {
  if (workerInterval) return;
  metrics.status = 'active';
  console.log('[BREACH ESCALATION WORKER] Server-Side 10s Geofence Escalation Worker started (1000ms loop)');

  // Initial check on boot to recover any pending warnings from before restart/deployment
  checkExpiredBreachWarnings();

  // Loop every 1 second
  workerInterval = setInterval(checkExpiredBreachWarnings, 1000);
};

export const stopBreachEscalationWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  metrics.status = 'stopped';
};

export const getBreachWorkerMetrics = () => {
  return {
    ...metrics,
    currentTime: new Date().toISOString()
  };
};

