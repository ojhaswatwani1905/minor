import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service-role key for backend operations (bypasses RLS), fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseUrl.trim() !== '' && 
    supabaseUrl.startsWith('http') && 
    supabaseKey && 
    supabaseKey.trim() !== ''
  );
};

let supabaseInstance = null;

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase connection failed: Missing or invalid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
};

/**
 * Maps a Supabase database row (from user's PostgreSQL 'alerts' table)
 * to the standard API response format expected by Admin and Expo applications.
 */
export const mapAlertFromDb = (row) => {
  if (!row) return null;

  // Status mapping: open | acknowledged | dispatched | resolved | false_alarm
  let status = 'Pending';
  if (row.status === 'open') status = 'Pending';
  else if (row.status === 'acknowledged') status = 'Acknowledged';
  else if (row.status === 'dispatched') status = 'Active Rescue';
  else if (row.status === 'resolved') status = 'Resolved';
  else if (row.status === 'false_alarm') status = 'False Alarm';

  // State mapping: normal | warning | deviation | unresponsive | sos
  const isSos = row.state === 'sos';
  const type = isSos ? 'MANUAL_SOS' : (row.state ? row.state.toUpperCase() : 'MANUAL_SOS');
  const priority = isSos ? 'CRITICAL' : (row.state === 'warning' ? 'HIGH' : 'MEDIUM');

  // Location: lat and lon are generated columns in user schema
  let location = null;
  if (row.lat != null && row.lon != null) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    location = {
      lat,
      lng,
      name: `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    };
  }

  // Rescue notes & resolution details
  const rescueNotes = [];
  if (row.resolution) {
    rescueNotes.push({
      timestamp: row.resolved_at || row.updated_at,
      note: row.resolution,
      author: 'SAR Operator'
    });
  }

  // Extract traveller name from joined profile or fallback
  const userName = row.profiles?.full_name || row.userName || 'Active Traveller';

  return {
    id: row.id,
    userId: row.user_id,
    userName,
    tripId: row.trip_id,
    tripInfo: row.trips?.title || 'Expedition Trip',
    type,
    priority,
    message: row.message || `🚨 Emergency distress beacon (${type})`,
    location,
    batteryLevel: row.battery != null ? row.battery : null,
    networkStatus: row.source === 'app' ? 'Mobile App (Cellular/Wi-Fi)' : (row.source ? row.source.toUpperCase() : 'Online'),
    deviceInfo: { source: row.source },
    timestamp: row.raised_at || row.updated_at || new Date().toISOString(),
    status,
    guardianNotified: false,
    rescueNotes
  };
};

/**
 * Maps incoming API alert payload to Supabase SQL column schema.
 */
export const mapAlertToDb = (payload, defaultUserId, defaultTripId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const userId = (payload.userId && uuidRegex.test(payload.userId)) 
    ? payload.userId 
    : defaultUserId;

  const tripId = (payload.tripId && uuidRegex.test(payload.tripId)) 
    ? payload.tripId 
    : defaultTripId;

  // Status mapping
  let dbStatus = 'open';
  if (payload.status === 'Acknowledged') dbStatus = 'acknowledged';
  else if (payload.status === 'Active Rescue') dbStatus = 'dispatched';
  else if (payload.status === 'Resolved') dbStatus = 'resolved';
  else if (payload.status === 'False Alarm') dbStatus = 'false_alarm';

  // State mapping
  const state = payload.priority === 'CRITICAL' || payload.type === 'MANUAL_SOS' ? 'sos' : 'warning';

  const row = {
    user_id: userId,
    trip_id: tripId,
    state,
    status: dbStatus,
    source: 'app',
    message: payload.message || `🚨 MANUAL SOS triggered by ${payload.userName || 'Traveller'}!`,
    battery: payload.batteryLevel != null ? parseInt(payload.batteryLevel, 10) : null
  };

  // Location geometry point (PostGIS generated columns lat/lon calculate automatically)
  if (payload.location && payload.location.lat != null && payload.location.lng != null) {
    const lat = Number(payload.location.lat);
    const lng = Number(payload.location.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      row.location = `POINT(${lng} ${lat})`;
    }
  }

  return row;
};

/**
 * Verifies live Supabase connectivity and checks accessible tables.
 */
export const verifySupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env'
    };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('alerts')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      };
    }

    return {
      connected: true,
      message: 'Supabase PostgreSQL connected successfully. Table "alerts" is accessible.'
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
};
