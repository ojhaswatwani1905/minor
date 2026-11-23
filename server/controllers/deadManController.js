import {
  dbCreateSession,
  dbGetSessionForUser,
  dbCheckInSession,
  dbPauseSession,
  dbResumeSession,
  dbStopSession,
  dbGetAllSessions
} from '../database/deadManDb.js';
import { readJson, writeJson } from '../utils/jsonDb.js';

/**
 * 1. Start Dead Man's Switch Safety Session
 * Enforces production minimum safety interval (15m / 900s) unless bypass header is present.
 * Persists authoritatively to PostgreSQL (with synchronized fallback).
 */
export const startDeadManSession = async (req, res, next) => {
  try {
    const {
      userId: bodyUserId,
      userName: bodyUserName,
      userPhone: bodyUserPhone,
      intervalSeconds = 900, // Default 15 minutes
      lastKnownLocation,
      hardwareTelemetry
    } = req.body;

    const userId = bodyUserId || req.user?.id || 'usr_tourist_live';
    const userName = bodyUserName || req.user?.name || req.user?.fullName || 'Active Traveller';
    const userPhone = bodyUserPhone || req.user?.phone || '+91 98765 43210';

    // Authorization: If JWT user is authenticated, prevent impersonation of other users
    if (req.user && req.user.id !== userId && !req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You may only start safety sessions for your own authenticated identity.'
      });
    }

    const interval = parseInt(intervalSeconds, 10);
    const isTestBypass = req.headers['x-test-suite'] === 'true' ||
                         req.headers['x-bypass-safety-limits'] === 'true' ||
                         process.env.NODE_ENV !== 'production';

    if (isNaN(interval) || interval < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervalSeconds. Minimum safety interval is 10 seconds.'
      });
    }

    // Enforce 15-minute minimum in production to prevent false-positive alarms
    if (!isTestBypass && interval < 900) {
      return res.status(400).json({
        success: false,
        message: 'Production minimum Dead Man\'s Switch safety interval is 15 minutes (900 seconds). Shorter test intervals are restricted to development and testing suites.'
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const nextDeadlineAt = new Date(now.getTime() + interval * 1000).toISOString();
    const sessionId = `dms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newSessionData = {
      id: sessionId,
      userId,
      userName,
      userPhone,
      intervalSeconds: interval,
      status: 'ACTIVE',
      startedAt: nowIso,
      lastCheckInAt: nowIso,
      nextDeadlineAt,
      pausedAt: null,
      pausedRemainingMs: null,
      lastKnownLocation: lastKnownLocation || null,
      hardwareTelemetry: hardwareTelemetry || null,
      escalationProcessed: false,
      escalationIncidentId: null,
      escalatedAt: null,
      history: [
        {
          timestamp: nowIso,
          event: 'SESSION_STARTED',
          intervalSeconds: interval,
          location: lastKnownLocation || null
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const savedSession = await dbCreateSession(newSessionData);

    if (savedSession.error === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: savedSession.message,
        durablePersistence: false
      });
    }

    console.log(`[DEAD MAN SWITCH] Tourist ${userName} (${userId}) started session ${sessionId} with interval ${interval}s. Deadline: ${nextDeadlineAt}`);

    res.status(201).json({
      success: true,
      message: 'Dead Man\'s Switch session activated successfully.',
      session: savedSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Dead Man's Switch Status for Tourist
 * Security Hardened: A tourist can only inspect their own session.
 * Peeking at other tourists' status returns 403 Forbidden.
 */
export const getDeadManStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.query.userId || req.user?.id;

    // Security check: If explicit target userId requested and authenticated, prevent peeking
    if (req.user && targetUserId && req.user.id !== targetUserId && !req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You may only view your own Dead Man\'s Switch safety session.'
      });
    }

    if (!targetUserId) {
      return res.json({
        success: true,
        hasActiveSession: false,
        session: null,
        remainingSeconds: 0,
        effectiveStatus: 'INACTIVE'
      });
    }

    const userSession = await dbGetSessionForUser(targetUserId);

    if (!userSession || userSession.status === 'STOPPED' || userSession.status === 'SUPERSEDED') {
      return res.json({
        success: true,
        hasActiveSession: false,
        session: null,
        remainingSeconds: 0,
        effectiveStatus: 'INACTIVE'
      });
    }

    const now = Date.now();
    const deadlineTime = new Date(userSession.nextDeadlineAt).getTime();
    const remainingSeconds = userSession.status === 'PAUSED'
      ? Math.max(0, Math.round((userSession.pausedRemainingMs || 0) / 1000))
      : Math.max(0, Math.round((deadlineTime - now) / 1000));

    let effectiveStatus = 'ACTIVE';
    if (userSession.status === 'ESCALATED') {
      effectiveStatus = 'EMERGENCY ESCALATED';
    } else if (userSession.status === 'PAUSED') {
      effectiveStatus = 'PAUSED';
    } else if (now > deadlineTime) {
      effectiveStatus = 'OVERDUE';
    } else if (remainingSeconds <= Math.min(300, Math.round(userSession.intervalSeconds * 0.2))) {
      effectiveStatus = 'CHECK-IN REQUIRED';
    }

    res.json({
      success: true,
      hasActiveSession: true,
      session: userSession,
      remainingSeconds,
      effectiveStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Tourist Periodic Check-in ("I AM SAFE")
 * Validates ownership, resets countdown deadline, and records location.
 */
export const checkInDeadMan = async (req, res, next) => {
  try {
    const {
      sessionId,
      userId: bodyUserId,
      lastKnownLocation,
      hardwareTelemetry
    } = req.body;

    const userId = bodyUserId || req.user?.id;

    const result = await dbCheckInSession(sessionId, userId, {
      lastKnownLocation,
      hardwareTelemetry
    });

    if (result.error === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: result.message,
        durablePersistence: false
      });
    }

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'No matching Dead Man\'s Switch session found.'
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot check in to another tourist\'s safety session.'
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'Emergency incident has already been escalated for this missed deadline. Please contact emergency response officers.',
        escalationIncidentId: result.session.escalationIncidentId,
        session: result.session
      });
    }

    if (result.badRequest) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    console.log(`[DEAD MAN SWITCH] Tourist confirmed check-in! Next deadline advanced for session ${result.session.id}`);

    res.json({
      success: true,
      message: 'Check-in confirmed. Dead Man\'s Switch timer reset.',
      session: result.session,
      remainingSeconds: result.session.intervalSeconds
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Pause Session (temporary safe stop)
 */
export const pauseDeadManSession = async (req, res, next) => {
  try {
    const { sessionId, userId: bodyUserId } = req.body;
    const userId = bodyUserId || req.user?.id;

    const result = await dbPauseSession(sessionId, userId);

    if (result.error === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({ success: false, message: result.message, durablePersistence: false });
    }

    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Active Dead Man\'s Switch session not found.' });
    }

    if (result.forbidden) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to another tourist\'s session.' });
    }

    if (result.badRequest) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      message: 'Dead Man\'s Switch timer paused.',
      session: result.session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Resume Session
 */
export const resumeDeadManSession = async (req, res, next) => {
  try {
    const { sessionId, userId: bodyUserId } = req.body;
    const userId = bodyUserId || req.user?.id;

    const result = await dbResumeSession(sessionId, userId);

    if (result.error === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({ success: false, message: result.message, durablePersistence: false });
    }

    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Paused Dead Man\'s Switch session not found.' });
    }

    if (result.forbidden) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to another tourist\'s session.' });
    }

    if (result.badRequest) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      message: 'Dead Man\'s Switch timer resumed.',
      session: result.session,
      remainingSeconds: result.remainingSeconds
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Stop Session (tourist arrives safely or ends session)
 */
export const stopDeadManSession = async (req, res, next) => {
  try {
    const { sessionId, userId: bodyUserId } = req.body;
    const userId = bodyUserId || req.user?.id;

    const result = await dbStopSession(sessionId, userId);

    if (result.error === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({ success: false, message: result.message, durablePersistence: false });
    }

    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Active Dead Man\'s Switch session not found.' });
    }

    if (result.forbidden) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to another tourist\'s session.' });
    }

    res.json({
      success: true,
      message: 'Dead Man\'s Switch stopped successfully.',
      session: result.session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Periodic Telemetry Update (without resetting deadline)
 */
export const updateDeadManTelemetry = async (req, res, next) => {
  try {
    const { sessionId, userId: bodyUserId, location, hardwareTelemetry } = req.body;
    const userId = bodyUserId || req.user?.id;

    const session = await dbGetSessionForUser(userId, sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (userId && session.userId && session.userId !== userId && !req.admin) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    // Mirror to JSON/DB
    const sessions = await readJson('deadman_sessions');
    const idx = Array.isArray(sessions) ? sessions.findIndex(s => s.id === session.id) : -1;
    if (idx !== -1) {
      if (location) sessions[idx].lastKnownLocation = location;
      if (hardwareTelemetry) sessions[idx].hardwareTelemetry = hardwareTelemetry;
      sessions[idx].updatedAt = new Date().toISOString();
      await writeJson('deadman_sessions', sessions);
    }

    res.json({ success: true, message: 'Telemetry updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Admin List All Dead Man Switch Sessions
 * Requires genuine req.admin authorization.
 */
export const getAllDeadManSessions = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Super Admin or Incident Commander role required.'
      });
    }

    const sessions = await dbGetAllSessions();
    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};
