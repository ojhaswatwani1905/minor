import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient, mapAlertToDb } from '../database/supabase.js';

const SESSIONS_FILE = 'deadman_sessions';

/**
 * Ensures deadman_sessions.json exists
 */
const getSessions = async () => {
  const sessions = await readJson(SESSIONS_FILE);
  return Array.isArray(sessions) ? sessions : [];
};

const saveSessions = async (sessions) => {
  return await writeJson(SESSIONS_FILE, sessions);
};

/**
 * 1. Start Dead Man's Switch Safety Session
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

    const interval = parseInt(intervalSeconds, 10);
    if (isNaN(interval) || interval < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervalSeconds. Minimum safety interval is 10 seconds.'
      });
    }

    const sessions = await getSessions();
    const now = new Date();
    const nowIso = now.toISOString();
    const nextDeadlineAt = new Date(now.getTime() + interval * 1000).toISOString();

    // Deactivate any currently active sessions for this tourist
    sessions.forEach(s => {
      if (s.userId === userId && (s.status === 'ACTIVE' || s.status === 'PAUSED')) {
        s.status = 'SUPERSEDED';
        s.supersededAt = nowIso;
        s.updatedAt = nowIso;
      }
    });

    const sessionId = `dms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newSession = {
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

    sessions.unshift(newSession);
    await saveSessions(sessions);

    console.log(`[DEAD MAN SWITCH] Tourist ${userName} (${userId}) started session ${sessionId} with interval ${interval}s. Deadline: ${nextDeadlineAt}`);

    res.status(201).json({
      success: true,
      message: 'Dead Man\'s Switch session activated successfully.',
      session: newSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Dead Man's Switch Status for Tourist
 */
export const getDeadManStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.query.userId || req.user?.id;
    const sessions = await getSessions();

    // Find latest active or recently modified session for this user
    let userSession = null;
    if (targetUserId) {
      userSession = sessions.find(s => s.userId === targetUserId && (s.status === 'ACTIVE' || s.status === 'PAUSED' || s.status === 'ESCALATED')) ||
        sessions.find(s => s.userId === targetUserId);
    } else if (sessions.length > 0) {
      userSession = sessions[0];
    }

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
    const sessions = await getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId || (userId && s.userId === userId && s.status === 'ACTIVE'));

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'No matching Dead Man\'s Switch session found.'
      });
    }

    const session = sessions[idx];

    // Authorization check: only owning user can check in
    if (userId && session.userId && session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot check in to another tourist\'s safety session.'
      });
    }

    // If already escalated, reject check-in with 409 Conflict
    if (session.status === 'ESCALATED') {
      return res.status(409).json({
        success: false,
        message: 'Emergency incident has already been escalated for this missed deadline. Please contact emergency response officers.',
        escalationIncidentId: session.escalationIncidentId,
        session
      });
    }

    if (session.status === 'STOPPED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in: Dead Man\'s Switch session is stopped.'
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const nextDeadlineAt = new Date(now.getTime() + session.intervalSeconds * 1000).toISOString();

    session.lastCheckInAt = nowIso;
    session.nextDeadlineAt = nextDeadlineAt;
    session.status = 'ACTIVE';
    session.pausedAt = null;
    session.pausedRemainingMs = null;
    if (lastKnownLocation) session.lastKnownLocation = lastKnownLocation;
    if (hardwareTelemetry) session.hardwareTelemetry = hardwareTelemetry;
    session.updatedAt = nowIso;

    if (!session.history) session.history = [];
    session.history.unshift({
      timestamp: nowIso,
      event: 'CHECK_IN_CONFIRMED',
      nextDeadlineAt,
      location: lastKnownLocation || null
    });

    await saveSessions(sessions);

    console.log(`[DEAD MAN SWITCH] Tourist ${session.userName} confirmed check-in! Next deadline advanced to ${nextDeadlineAt}`);

    res.json({
      success: true,
      message: 'Check-in confirmed. Dead Man\'s Switch timer reset.',
      session,
      remainingSeconds: session.intervalSeconds
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
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId || (userId && s.userId === userId && s.status === 'ACTIVE'));

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active Dead Man\'s Switch session not found.' });
    }

    if (userId && session.userId && session.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `Cannot pause session in ${session.status} status.` });
    }

    const now = Date.now();
    const deadlineTime = new Date(session.nextDeadlineAt).getTime();
    const remainingMs = Math.max(0, deadlineTime - now);

    session.status = 'PAUSED';
    session.pausedAt = new Date().toISOString();
    session.pausedRemainingMs = remainingMs;
    session.updatedAt = new Date().toISOString();

    await saveSessions(sessions);

    res.json({
      success: true,
      message: 'Dead Man\'s Switch timer paused.',
      session
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
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId || (userId && s.userId === userId && s.status === 'PAUSED'));

    if (!session) {
      return res.status(404).json({ success: false, message: 'Paused Dead Man\'s Switch session not found.' });
    }

    if (userId && session.userId && session.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (session.status !== 'PAUSED') {
      return res.status(400).json({ success: false, message: `Cannot resume session in ${session.status} status.` });
    }

    const remainingMs = session.pausedRemainingMs || (session.intervalSeconds * 1000);
    const nextDeadlineAt = new Date(Date.now() + remainingMs).toISOString();

    session.status = 'ACTIVE';
    session.nextDeadlineAt = nextDeadlineAt;
    session.pausedAt = null;
    session.pausedRemainingMs = null;
    session.updatedAt = new Date().toISOString();

    await saveSessions(sessions);

    res.json({
      success: true,
      message: 'Dead Man\'s Switch timer resumed.',
      session,
      remainingSeconds: Math.round(remainingMs / 1000)
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
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId || (userId && s.userId === userId && (s.status === 'ACTIVE' || s.status === 'PAUSED')));

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active Dead Man\'s Switch session not found.' });
    }

    if (userId && session.userId && session.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    session.status = 'STOPPED';
    session.stoppedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    await saveSessions(sessions);

    res.json({
      success: true,
      message: 'Dead Man\'s Switch stopped successfully.',
      session
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
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId || (userId && s.userId === userId && s.status === 'ACTIVE'));

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (location) session.lastKnownLocation = location;
    if (hardwareTelemetry) session.hardwareTelemetry = hardwareTelemetry;
    session.updatedAt = new Date().toISOString();

    await saveSessions(sessions);
    res.json({ success: true, message: 'Telemetry updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Admin List All Dead Man Switch Sessions
 */
export const getAllDeadManSessions = async (req, res, next) => {
  try {
    const sessions = await getSessions();
    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};
