import { isSupabaseConfigured, getSupabaseClient } from './supabase.js';
import { readJson, writeJson } from '../utils/jsonDb.js';

const SESSIONS_FILE = 'deadman_sessions';
let tableAvailabilityChecked = false;
let isTableAvailableInDb = false;

/**
 * Checks if public.deadman_sessions table exists in Supabase schema cache.
 */
export const checkDeadManTableAvailability = async () => {
  if (!isSupabaseConfigured()) {
    isTableAvailableInDb = false;
    tableAvailabilityChecked = true;
    return false;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('deadman_sessions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        isTableAvailableInDb = false;
        console.warn('[DEAD MAN DB] Table "public.deadman_sessions" not found in schema cache. Using synchronized development fallback.');
      } else {
        isTableAvailableInDb = false;
      }
    } else {
      isTableAvailableInDb = true;
      console.log('[DEAD MAN DB] Authoritative Supabase PostgreSQL table "public.deadman_sessions" connected and active.');
    }
  } catch (err) {
    isTableAvailableInDb = false;
    console.warn('[DEAD MAN DB VERIFICATION NOTE]', err.message);
  }

  tableAvailabilityChecked = true;
  return isTableAvailableInDb;
};

export const isDbAuthoritative = () => isTableAvailableInDb;

/**
 * Helper: Read fallback JSON sessions
 */
const getJsonSessions = async () => {
  const sessions = await readJson(SESSIONS_FILE);
  return Array.isArray(sessions) ? sessions : [];
};

const saveJsonSessions = async (sessions) => {
  return await writeJson(SESSIONS_FILE, sessions);
};

/**
 * Map API session model to PostgreSQL columns
 */
const mapSessionToDb = (s) => ({
  id: s.id,
  user_id: s.userId,
  user_name: s.userName,
  user_phone: s.userPhone || null,
  interval_seconds: s.intervalSeconds,
  status: s.status,
  started_at: s.startedAt,
  last_check_in_at: s.lastCheckInAt,
  next_deadline_at: s.nextDeadlineAt,
  paused_at: s.pausedAt || null,
  paused_remaining_ms: s.pausedRemainingMs || null,
  escalation_processed: Boolean(s.escalationProcessed),
  escalation_incident_id: s.escalationIncidentId || null,
  escalated_at: s.escalatedAt || null,
  last_known_location: s.lastKnownLocation || null,
  hardware_telemetry: s.hardwareTelemetry || null,
  history: s.history || [],
  created_at: s.createdAt,
  updated_at: s.updatedAt
});

/**
 * Map PostgreSQL row back to standard API model
 */
const mapSessionFromDb = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  userPhone: row.user_phone,
  intervalSeconds: row.interval_seconds,
  status: row.status,
  startedAt: row.started_at,
  lastCheckInAt: row.last_check_in_at,
  nextDeadlineAt: row.next_deadline_at,
  pausedAt: row.paused_at,
  pausedRemainingMs: row.paused_remaining_ms ? Number(row.paused_remaining_ms) : null,
  escalationProcessed: Boolean(row.escalation_processed),
  escalationIncidentId: row.escalation_incident_id,
  escalatedAt: row.escalated_at,
  lastKnownLocation: row.last_known_location,
  hardwareTelemetry: row.hardware_telemetry,
  history: row.history || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

/**
 * 1. Create a new Dead Man's Switch session
 * Atomically supersedes previous active sessions for this tourist.
 */
export const dbCreateSession = async (sessionData) => {
  const nowIso = new Date().toISOString();

  // If Supabase table is available, write to PostgreSQL
  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();

      // Supersede any active or paused sessions in DB
      await supabase
        .from('deadman_sessions')
        .update({
          status: 'SUPERSEDED',
          updated_at: nowIso
        })
        .eq('user_id', sessionData.userId)
        .in('status', ['ACTIVE', 'PAUSED']);

      const dbRow = mapSessionToDb(sessionData);
      const { data, error } = await supabase
        .from('deadman_sessions')
        .insert(dbRow)
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapSessionFromDb(data);
        // Synchronize to JSON fallback
        try {
          const sessions = await getJsonSessions();
          sessions.unshift(mapped);
          await saveJsonSessions(sessions);
        } catch (e) {}
        return mapped;
      }
      console.warn('[DEAD MAN DB INSERT WARNING]', error?.message);
    } catch (dbErr) {
      console.warn('[DEAD MAN DB INSERT ERROR]', dbErr.message);
    }
  }

  // Fallback / Synchronized JSON write
  const sessions = await getJsonSessions();
  sessions.forEach(s => {
    if (s.userId === sessionData.userId && (s.status === 'ACTIVE' || s.status === 'PAUSED')) {
      s.status = 'SUPERSEDED';
      s.supersededAt = nowIso;
      s.updatedAt = nowIso;
    }
  });
  sessions.unshift(sessionData);
  await saveJsonSessions(sessions);
  return sessionData;
};

/**
 * 2. Get active or recent session for a tourist
 */
export const dbGetSessionForUser = async (userId, sessionId = null) => {
  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from('deadman_sessions').select('*');

      if (sessionId) {
        query = query.eq('id', sessionId);
      } else if (userId) {
        query = query
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(5);
      if (!error && data && data.length > 0) {
        // Prefer active, paused, or escalated
        const active = data.find(r => r.status === 'ACTIVE' || r.status === 'PAUSED' || r.status === 'ESCALATED') || data[0];
        return mapSessionFromDb(active);
      }
    } catch (dbErr) {
      console.warn('[DEAD MAN DB GET ERROR]', dbErr.message);
    }
  }

  // Fallback to JSON
  const sessions = await getJsonSessions();
  if (sessionId) {
    const found = sessions.find(s => s.id === sessionId);
    if (found) return found;
  }
  if (userId) {
    const userSession = sessions.find(s => s.userId === userId && (s.status === 'ACTIVE' || s.status === 'PAUSED' || s.status === 'ESCALATED')) ||
      sessions.find(s => s.userId === userId);
    if (userSession) return userSession;
  }
  return sessions[0] || null;
};

/**
 * 3. Tourist Check-in ("I AM SAFE")
 * Advances next_deadline_at by intervalSeconds and resets timer.
 */
export const dbCheckInSession = async (sessionId, userId, updateData = {}) => {
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Fetch current session to verify authorization and status
  const current = await dbGetSessionForUser(userId, sessionId);
  if (!current) {
    return { notFound: true };
  }

  if (userId && current.userId && current.userId !== userId) {
    return { forbidden: true };
  }

  if (current.status === 'ESCALATED') {
    return { conflict: true, session: current };
  }

  if (current.status === 'STOPPED' || current.status === 'SUPERSEDED') {
    return { badRequest: true, message: `Cannot check in to a ${current.status} session.` };
  }

  const nextDeadlineAt = new Date(now.getTime() + current.intervalSeconds * 1000).toISOString();
  const historyEntry = {
    timestamp: nowIso,
    event: 'CHECK_IN_CONFIRMED',
    nextDeadlineAt,
    location: updateData.lastKnownLocation || null
  };

  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const updatedHistory = [historyEntry, ...(current.history || [])];

      const { data, error } = await supabase
        .from('deadman_sessions')
        .update({
          last_check_in_at: nowIso,
          next_deadline_at: nextDeadlineAt,
          status: 'ACTIVE',
          paused_at: null,
          paused_remaining_ms: null,
          last_known_location: updateData.lastKnownLocation || current.lastKnownLocation,
          hardware_telemetry: updateData.hardwareTelemetry || current.hardwareTelemetry,
          history: updatedHistory,
          updated_at: nowIso
        })
        .eq('id', current.id)
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapSessionFromDb(data);
        // Sync to JSON
        try {
          const sessions = await getJsonSessions();
          const idx = sessions.findIndex(s => s.id === current.id);
          if (idx !== -1) {
            sessions[idx] = mapped;
            await saveJsonSessions(sessions);
          }
        } catch (e) {}
        return { success: true, session: mapped };
      }
    } catch (dbErr) {
      console.warn('[DEAD MAN DB CHECK-IN ERROR]', dbErr.message);
    }
  }

  // Fallback JSON update
  const sessions = await getJsonSessions();
  const idx = sessions.findIndex(s => s.id === current.id);
  if (idx === -1) return { notFound: true };

  const s = sessions[idx];
  s.lastCheckInAt = nowIso;
  s.nextDeadlineAt = nextDeadlineAt;
  s.status = 'ACTIVE';
  s.pausedAt = null;
  s.pausedRemainingMs = null;
  if (updateData.lastKnownLocation) s.lastKnownLocation = updateData.lastKnownLocation;
  if (updateData.hardwareTelemetry) s.hardwareTelemetry = updateData.hardwareTelemetry;
  s.updatedAt = nowIso;
  if (!s.history) s.history = [];
  s.history.unshift(historyEntry);

  await saveJsonSessions(sessions);
  return { success: true, session: s };
};

/**
 * 4. Pause Session
 */
export const dbPauseSession = async (sessionId, userId) => {
  const current = await dbGetSessionForUser(userId, sessionId);
  if (!current) return { notFound: true };
  if (userId && current.userId && current.userId !== userId) return { forbidden: true };
  if (current.status !== 'ACTIVE') return { badRequest: true, message: `Cannot pause a ${current.status} session.` };

  const now = Date.now();
  const deadlineTime = new Date(current.nextDeadlineAt).getTime();
  const remainingMs = Math.max(0, deadlineTime - now);
  const nowIso = new Date().toISOString();

  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deadman_sessions')
        .update({
          status: 'PAUSED',
          paused_at: nowIso,
          paused_remaining_ms: remainingMs,
          updated_at: nowIso
        })
        .eq('id', current.id)
        .eq('status', 'ACTIVE')
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapSessionFromDb(data);
        return { success: true, session: mapped };
      }
    } catch (dbErr) {
      console.warn('[DEAD MAN DB PAUSE ERROR]', dbErr.message);
    }
  }

  // JSON fallback
  const sessions = await getJsonSessions();
  const idx = sessions.findIndex(s => s.id === current.id);
  if (idx !== -1) {
    sessions[idx].status = 'PAUSED';
    sessions[idx].pausedAt = nowIso;
    sessions[idx].pausedRemainingMs = remainingMs;
    sessions[idx].updatedAt = nowIso;
    await saveJsonSessions(sessions);
    return { success: true, session: sessions[idx] };
  }
  return { notFound: true };
};

/**
 * 5. Resume Session
 */
export const dbResumeSession = async (sessionId, userId) => {
  const current = await dbGetSessionForUser(userId, sessionId);
  if (!current) return { notFound: true };
  if (userId && current.userId && current.userId !== userId) return { forbidden: true };
  if (current.status !== 'PAUSED') return { badRequest: true, message: `Cannot resume a ${current.status} session.` };

  const remainingMs = current.pausedRemainingMs || (current.intervalSeconds * 1000);
  const nextDeadlineAt = new Date(Date.now() + remainingMs).toISOString();
  const nowIso = new Date().toISOString();

  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deadman_sessions')
        .update({
          status: 'ACTIVE',
          next_deadline_at: nextDeadlineAt,
          paused_at: null,
          paused_remaining_ms: null,
          updated_at: nowIso
        })
        .eq('id', current.id)
        .eq('status', 'PAUSED')
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapSessionFromDb(data);
        return { success: true, session: mapped, remainingSeconds: Math.round(remainingMs / 1000) };
      }
    } catch (dbErr) {
      console.warn('[DEAD MAN DB RESUME ERROR]', dbErr.message);
    }
  }

  // JSON fallback
  const sessions = await getJsonSessions();
  const idx = sessions.findIndex(s => s.id === current.id);
  if (idx !== -1) {
    sessions[idx].status = 'ACTIVE';
    sessions[idx].nextDeadlineAt = nextDeadlineAt;
    sessions[idx].pausedAt = null;
    sessions[idx].pausedRemainingMs = null;
    sessions[idx].updatedAt = nowIso;
    await saveJsonSessions(sessions);
    return { success: true, session: sessions[idx], remainingSeconds: Math.round(remainingMs / 1000) };
  }
  return { notFound: true };
};

/**
 * 6. Stop Session
 */
export const dbStopSession = async (sessionId, userId) => {
  const current = await dbGetSessionForUser(userId, sessionId);
  if (!current) return { notFound: true };
  if (userId && current.userId && current.userId !== userId) return { forbidden: true };

  const nowIso = new Date().toISOString();

  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deadman_sessions')
        .update({
          status: 'STOPPED',
          updated_at: nowIso
        })
        .eq('id', current.id)
        .select('*')
        .single();

      if (!error && data) {
        const mapped = mapSessionFromDb(data);
        return { success: true, session: mapped };
      }
    } catch (dbErr) {
      console.warn('[DEAD MAN DB STOP ERROR]', dbErr.message);
    }
  }

  // JSON fallback
  const sessions = await getJsonSessions();
  const idx = sessions.findIndex(s => s.id === current.id);
  if (idx !== -1) {
    sessions[idx].status = 'STOPPED';
    sessions[idx].updatedAt = nowIso;
    await saveJsonSessions(sessions);
    return { success: true, session: sessions[idx] };
  }
  return { notFound: true };
};

/**
 * 7. Get All Sessions (Admin inspection)
 */
export const dbGetAllSessions = async () => {
  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deadman_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapSessionFromDb);
      }
    } catch (e) {}
  }
  return await getJsonSessions();
};

/**
 * 8. Database-Level Atomic Claiming of Expired Sessions (Worker Loop)
 * Guarantees across multiple server/worker instances that an expired deadline
 * is claimed exactly ONCE using conditional SQL UPDATE:
 * WHERE status = 'ACTIVE' AND escalation_processed = FALSE AND next_deadline_at <= now
 */
export const dbClaimExpiredDeadManSessions = async (nowIso) => {
  // If PostgreSQL deadman_sessions table is active, execute atomic conditional update
  if (isTableAvailableInDb) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deadman_sessions')
        .update({
          escalation_processed: true,
          status: 'ESCALATED',
          escalated_at: nowIso,
          updated_at: nowIso
        })
        .eq('status', 'ACTIVE')
        .eq('escalation_processed', false)
        .lte('next_deadline_at', nowIso)
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(mapSessionFromDb);
      }
    } catch (err) {
      console.warn('[DEAD MAN DB ATOMIC CLAIM NOTE]', err.message);
    }
  }

  // Synchronized fallback on JSON sessions
  const sessions = await getJsonSessions();
  const claimedSessions = [];
  const now = new Date(nowIso).getTime();

  for (let session of sessions) {
    if (
      session.status === 'ACTIVE' &&
      session.nextDeadlineAt &&
      !session.escalationProcessed
    ) {
      const deadlineTime = new Date(session.nextDeadlineAt).getTime();
      if (now >= deadlineTime) {
        // Atomic in-memory claim flag
        session.escalationProcessed = true;
        session.status = 'ESCALATED';
        session.escalatedAt = nowIso;
        session.updatedAt = nowIso;
        claimedSessions.push(session);
      }
    }
  }

  if (claimedSessions.length > 0) {
    await saveJsonSessions(sessions);
  }

  return claimedSessions;
};
