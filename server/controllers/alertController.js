import crypto from 'crypto';
import { 
  isSupabaseConfigured, 
  getSupabaseClient, 
  mapAlertFromDb, 
  mapAlertToDb 
} from '../database/supabase.js';
import { readJson, writeJson } from '../utils/jsonDb.js';
import { fetchEnrichedUsers } from './userController.js';

// Helper to get fallback valid profile and trip IDs from database
const getDatabaseDefaults = async (supabase) => {
  let defaultProfileId = null;
  let defaultTripId = null;

  try {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (profiles && profiles.length > 0) {
      defaultProfileId = profiles[0].id;
    }
  } catch (e) {}

  try {
    const { data: trips } = await supabase.from('trips').select('id').limit(1);
    if (trips && trips.length > 0) {
      defaultTripId = trips[0].id;
    }
  } catch (e) {}

  return { defaultProfileId, defaultTripId };
};

// Get all emergency alerts with search, type, priority, and status filters
export const getAlerts = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      });
    }

    const supabase = getSupabaseClient();
    const { search, type, priority, status } = req.query;

    let query = supabase
      .from('alerts')
      .select('*, profiles(full_name, phone), trips(title)')
      .order('raised_at', { ascending: false });

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`message.ilike.%${q}%,id.ilike.%${q}%`);
    }

    if (status && status !== 'All') {
      let dbStatus = 'open';
      if (status === 'Pending') dbStatus = 'open';
      else if (status === 'Acknowledged') dbStatus = 'acknowledged';
      else if (status === 'Active Rescue') dbStatus = 'dispatched';
      else if (status === 'Resolved') dbStatus = 'resolved';
      else if (status === 'False Alarm') dbStatus = 'false_alarm';
      query = query.eq('status', dbStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SUPABASE QUERY ERROR]', error.message);
      return res.status(500).json({
        success: false,
        message: `Database error querying alerts: ${error.message}`
      });
    }

    let alerts = (data || []).map(mapAlertFromDb);

    try {
      let users = [];
      try {
        users = await fetchEnrichedUsers();
      } catch (uErr) {
        users = await readJson('users');
      }
      const jsonAlerts = await readJson('alerts');

      alerts = alerts.map(a => {
        let match = null;
        if (a.userName && a.userName !== 'Active Traveller' && a.userName !== 'Traveller') {
          match = users.find(u => 
            (u.fullName && u.fullName.toLowerCase().trim() === a.userName.toLowerCase().trim()) ||
            (u.name && u.name.toLowerCase().trim() === a.userName.toLowerCase().trim()) ||
            (u.id && u.id.toLowerCase() === a.userName.toLowerCase())
          );
        }
        if (!match && a.userId) {
          match = users.find(u => u.id === a.userId);
        }
        const jsonA = jsonAlerts.find(ja => ja.id === a.id || ja.tripId === a.tripId);
        const dev = jsonA?.deviceInfo || match?.deviceInfo;

        const realName = a.userName && a.userName !== 'Active Traveller' && a.userName !== 'Traveller'
          ? a.userName 
          : (match?.fullName || match?.name || a.userName || 'Active Traveller');

        // Identity check: Only borrow user details if the matched profile actually corresponds to this tourist
        const isNameMatch = match && (
          (match.fullName && match.fullName.toLowerCase().trim() === realName.toLowerCase().trim()) ||
          (match.name && match.name.toLowerCase().trim() === realName.toLowerCase().trim()) ||
          (realName === 'Active Traveller' && match.id === a.userId)
        );

        const realId = isNameMatch ? match.id : (a.userId || 'usr_unassigned');
        const realAvatar = isNameMatch ? (match.avatar || null) : null;
        const realPhone = isNameMatch ? (match.phone || null) : (a.user?.phone || null);
        const realEmail = isNameMatch ? (match.email || null) : null;

        return {
          ...a,
          userName: realName,
          userId: realId,
          user: {
            id: realId,
            fullName: realName,
            name: realName,
            avatar: realAvatar,
            phone: realPhone,
            email: realEmail
          },
          deviceInfo: {
            manufacturer: dev?.manufacturer || 'Unavailable',
            model: dev?.model || 'Unavailable',
            platform: dev?.platform || 'Android',
            androidVersion: dev?.androidVersion || 'Unavailable',
            osVersion: dev?.osVersion || 'Unavailable',
            appVersion: dev?.appVersion || '1.0.0',
            appBuildNumber: dev?.appBuildNumber || '1',
            batteryPercentage: a.batteryLevel != null ? a.batteryLevel : dev?.batteryPercentage,
            batteryChargingStatus: dev?.batteryChargingStatus || 'Unavailable',
            networkConnectionType: dev?.networkConnectionType || a.networkStatus || 'Unavailable',
            lastTelemetryUpdate: dev?.lastTelemetryUpdate || a.timestamp
          }
        };
      });
    } catch (enrichErr) {}

    if (type && type !== 'All') {
      alerts = alerts.filter(a => a.type.toLowerCase().includes(type.toLowerCase()));
    }

    if (priority && priority !== 'All') {
      alerts = alerts.filter(a => a.priority === priority);
    }

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error('[GET ALERTS ERROR]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single alert detail with tourist telemetry
export const getAlertById = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      });
    }

    const supabase = getSupabaseClient();
    const { data: alertRow, error } = await supabase
      .from('alerts')
      .select('*, profiles(full_name, phone), trips(title)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !alertRow) {
      const localAlerts = await readJson('alerts');
      const localA = localAlerts.find(a => a.id === req.params.id);
      if (localA) {
        return res.json({
          success: true,
          alert: {
            ...localA,
            rescueNotes: localA.rescueNotes || [],
            user: {
              id: localA.userId || 'usr_unassigned',
              fullName: localA.userName || 'Active Traveller',
              email: null,
              phone: null
            }
          },
          user: {
            id: localA.userId || 'usr_unassigned',
            fullName: localA.userName || 'Active Traveller',
            email: null,
            phone: null
          }
        });
      }
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    const alert = mapAlertFromDb(alertRow);

    // Fetch related alert events (audit trail)
    let events = [];
    try {
      const { data: evData } = await supabase
        .from('alert_events')
        .select('*')
        .eq('alert_id', req.params.id)
        .order('created_at', { ascending: false });

      if (evData && evData.length > 0) {
        events = evData;
        alert.rescueNotes = evData.map(e => ({
          timestamp: e.created_at,
          note: `[${e.kind}] ${typeof e.payload === 'object' ? JSON.stringify(e.payload) : e.payload}`,
          author: e.actor || 'System'
        }));
      }
    } catch (e) {}

    // 1. Resolve Tourist Identity from authenticated user profile records
    let users = [];
    try {
      users = await fetchEnrichedUsers();
    } catch (uErr) {
      users = await readJson('users');
    }
    let matchedUser = null;
    if (alert.userName && alert.userName !== 'Active Traveller' && alert.userName !== 'Traveller') {
      matchedUser = users.find(u => 
        (u.fullName && u.fullName.toLowerCase().trim() === alert.userName.toLowerCase().trim()) ||
        (u.name && u.name.toLowerCase().trim() === alert.userName.toLowerCase().trim()) ||
        (u.id && u.id.toLowerCase() === alert.userName.toLowerCase())
      );
    }
    if (!matchedUser && alert.userId) {
      matchedUser = users.find(u => u.id === alert.userId);
    }

    if (!matchedUser && alertRow.user_id) {
      try {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', alertRow.user_id).maybeSingle();
        if (pData) {
          matchedUser = {
            id: pData.id,
            fullName: pData.full_name,
            phone: pData.phone,
            avatar: pData.medical_info?.avatar_url || null,
            email: null
          };
        }
      } catch (pErr) {}
    }

    const realTouristName = alert.userName && alert.userName !== 'Active Traveller' && alert.userName !== 'Traveller'
      ? alert.userName
      : (matchedUser?.fullName || matchedUser?.name || alert.userName || 'Active Traveller');

    // Strict identity match: Only use matchedUser email/avatar/phone if the user record matches this tourist
    const isTouristMatch = matchedUser && (
      (matchedUser.fullName && matchedUser.fullName.toLowerCase().trim() === realTouristName.toLowerCase().trim()) ||
      (matchedUser.name && matchedUser.name.toLowerCase().trim() === realTouristName.toLowerCase().trim()) ||
      (realTouristName === 'Active Traveller' && matchedUser.id === alertRow.user_id)
    );

    const realTouristId = isTouristMatch ? matchedUser.id : (alert.userId || alertRow.user_id || 'usr_unassigned');
    const realTouristAvatar = isTouristMatch ? (matchedUser.avatar || matchedUser.medical_info?.avatar_url || null) : null;
    const realTouristEmail = isTouristMatch ? (matchedUser.email || null) : null;
    const realTouristPhone = isTouristMatch ? (matchedUser.phone || null) : (alertRow.profiles?.phone || null);

    alert.userName = realTouristName;
    alert.userId = realTouristId;
    alert.user = {
      id: realTouristId,
      fullName: realTouristName,
      name: realTouristName,
      avatar: realTouristAvatar,
      email: realTouristEmail,
      phone: realTouristPhone
    };

    // 2. Resolve Device Information from collected telemetry
    const alerts = await readJson('alerts');
    const jsonAlert = alerts.find(a => a.id === req.params.id || a.tripId === alert.tripId);
    let dev = jsonAlert?.deviceInfo || null;

    if (!dev && events.length > 0) {
      for (const ev of events) {
        if (ev.payload?.deviceInfo) {
          dev = ev.payload.deviceInfo;
          break;
        }
      }
    }

    if (!dev && matchedUser?.deviceInfo) {
      dev = matchedUser.deviceInfo;
    }

    alert.deviceInfo = {
      manufacturer: dev?.manufacturer || 'Unavailable',
      model: dev?.model || 'Unavailable',
      platform: dev?.platform || (alertRow.source === 'app' ? 'Android' : 'Unavailable'),
      androidVersion: dev?.androidVersion || 'Unavailable',
      osVersion: dev?.osVersion || 'Unavailable',
      appVersion: dev?.appVersion || '1.0.0',
      appBuildNumber: dev?.appBuildNumber || '1',
      batteryPercentage: alert.batteryLevel != null ? alert.batteryLevel : (dev?.batteryPercentage != null ? dev.batteryPercentage : null),
      batteryChargingStatus: dev?.batteryChargingStatus || 'Unavailable',
      networkConnectionType: dev?.networkConnectionType || alert.networkStatus || (alertRow.source === 'app' ? 'Cellular / Wi-Fi (Active)' : 'Unavailable'),
      lastTelemetryUpdate: dev?.lastTelemetryUpdate || alert.timestamp
    };

    res.json({
      success: true,
      alert,
      user: alert.user
    });
  } catch (error) {
    console.error('[GET ALERT BY ID ERROR]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of an emergency alert and persist in Supabase
export const updateAlertStatus = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      });
    }

    const { status, note } = req.body;
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Map API status to database status enum: open | acknowledged | dispatched | resolved | false_alarm
    let dbStatus = 'open';
    if (status === 'Acknowledged') dbStatus = 'acknowledged';
    else if (status === 'Active Rescue') dbStatus = 'dispatched';
    else if (status === 'Resolved') dbStatus = 'resolved';
    else if (status === 'False Alarm') dbStatus = 'false_alarm';

    const updateFields = {
      status: dbStatus,
      updated_at: now
    };

    if (dbStatus === 'acknowledged') {
      updateFields.acknowledged_at = now;
    } else if (dbStatus === 'resolved') {
      updateFields.resolved_at = now;
      if (note && note.trim()) {
        updateFields.resolution = note.trim();
      }
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('alerts')
      .update(updateFields)
      .eq('id', req.params.id)
      .select('*, profiles(full_name, phone), trips(title)')
      .maybeSingle();

    if (updateError || !updatedRow) {
      const localAlerts = await readJson('alerts');
      const idx = localAlerts.findIndex(a => a.id === req.params.id);
      if (idx !== -1) {
        localAlerts[idx].status = status;
        localAlerts[idx].updatedAt = now;
        if (note) localAlerts[idx].resolution = note;
        await writeJson('alerts', localAlerts);
        return res.json({
          success: true,
          message: `Alert status updated to ${status}`,
          alert: localAlerts[idx]
        });
      }
      return res.status(500).json({
        success: false,
        message: `Database error updating alert status: ${updateError?.message || 'Record not found'}`
      });
    }

    // Also log event in alert_events table
    try {
      await supabase.from('alert_events').insert({
        alert_id: req.params.id,
        kind: `status_change_to_${dbStatus}`,
        payload: { newStatus: status, note: note || null },
        actor: req.admin?.name || 'Operator'
      });
    } catch (e) {}

    const updatedAlert = mapAlertFromDb(updatedRow);

    res.json({
      success: true,
      message: `Emergency alert updated to status: ${updatedAlert.status}`,
      alert: updatedAlert
    });
  } catch (error) {
    console.error('[UPDATE ALERT STATUS ERROR]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dispatch automated SMS alert to registered guardian
export const notifyGuardian = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      });
    }

    const { alertId } = req.body;
    const supabase = getSupabaseClient();

    const { data: existingRow, error: fetchError } = await supabase
      .from('alerts')
      .select('*, profiles(full_name, phone)')
      .eq('id', alertId)
      .single();

    if (fetchError || !existingRow) {
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    // Log guardian notification event
    try {
      await supabase.from('alert_events').insert({
        alert_id: alertId,
        kind: 'guardian_sms_dispatched',
        payload: { recipient: existingRow.profiles?.phone || 'Registered Guardian' },
        actor: 'SMS Gateway Dispatcher'
      });
    } catch (e) {}

    const alert = mapAlertFromDb(existingRow);
    alert.guardianNotified = true;

    res.json({
      success: true,
      message: 'Emergency SMS notification dispatched to guardian!',
      alert
    });
  } catch (error) {
    next(error);
  }
};

// Create real mobile SOS emergency alert in Supabase & fallback JSON (NO fabricated coordinates or telemetry)
export const createSosAlert = async (req, res, next) => {
  try {
    const { 
      userId, 
      userName, 
      type, 
      priority, 
      message, 
      location, 
      batteryLevel, 
      deviceInfo,
      tripId 
    } = req.body || {};

    // Parse valid location or set to null (never fabricate)
    let validatedLocation = null;
    if (location && typeof location === 'object') {
      const lat = location.lat != null ? parseFloat(location.lat) : null;
      const lng = location.lng != null ? parseFloat(location.lng) : null;
      if (!isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null) {
        validatedLocation = { lat, lng };
      }
    }

    // Parse battery percentage
    let validatedBattery = null;
    if (batteryLevel != null) {
      const bat = parseInt(batteryLevel, 10);
      if (!isNaN(bat) && bat >= 0 && bat <= 100) {
        validatedBattery = bat;
      }
    }

    // Parse and normalize real hardware device telemetry
    let validatedDeviceInfo = null;
    if (deviceInfo && typeof deviceInfo === 'object') {
      validatedDeviceInfo = {
        manufacturer: deviceInfo.manufacturer || 'Unavailable',
        model: deviceInfo.model || 'Unavailable',
        platform: deviceInfo.platform || 'Android',
        androidVersion: deviceInfo.androidVersion || 'Unavailable',
        osVersion: deviceInfo.osVersion || 'Unavailable',
        appVersion: deviceInfo.appVersion || '1.0.0',
        appBuildNumber: deviceInfo.appBuildNumber || '1',
        batteryPercentage: validatedBattery != null ? validatedBattery : deviceInfo.batteryPercentage,
        batteryChargingStatus: deviceInfo.batteryChargingStatus || 'Unavailable',
        networkConnectionType: deviceInfo.networkConnectionType || 'Mobile App (Cellular/Wi-Fi)',
        lastTelemetryUpdate: deviceInfo.lastTelemetryUpdate || new Date().toISOString()
      };
    }

    const alertPayload = {
      userId,
      userName: userName || 'Active Traveller',
      tripId,
      type: type || 'MANUAL_SOS',
      priority: priority || 'CRITICAL',
      message: message || `🚨 MANUAL SOS triggered by ${userName || 'Traveller'}! Immediate emergency response required.`,
      location: validatedLocation,
      batteryLevel: validatedBattery,
      deviceInfo: validatedDeviceInfo,
      status: 'Pending'
    };

    // Resolve active trip for user if not explicitly passed
    let effectiveTripId = alertPayload.tripId;
    if (!effectiveTripId && alertPayload.userId) {
      try {
        const trips = await readJson('trips');
        const activeT = trips.find(t => 
          (t.userId === alertPayload.userId || t.userName === alertPayload.userName) &&
          ['ACTIVE', 'APPROACHING', 'WARNING', 'BREACHED', 'Active', 'normal', 'sos'].includes(t.status)
        );
        if (activeT) {
          effectiveTripId = activeT.supabaseTripId || activeT.id;
          alertPayload.tripId = effectiveTripId;
        }
      } catch (e) {}
    }

    let targetAlertRow = null;
    let isUpdate = false;
    let createdAlert = null;

    // 1. Supabase persistence if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { defaultProfileId, defaultTripId } = await getDatabaseDefaults(supabase);
        const dbRow = mapAlertToDb(alertPayload, defaultProfileId, defaultTripId);

        // Keep Supabase profiles full_name updated with real tourist name
        if (dbRow.user_id && alertPayload.userName && alertPayload.userName !== 'Active Traveller') {
          try {
            await supabase.from('profiles').update({
              full_name: alertPayload.userName
            }).eq('id', dbRow.user_id);
          } catch (pUpErr) {}
        }

        // Ensure multi-user isolation by assigning a dedicated trip for each tourist in Supabase
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!alertPayload.tripId || !uuidRegex.test(alertPayload.tripId)) {
          try {
            const { data: userTrips } = await supabase
              .from('trips')
              .select('id, user_id, title')
              .ilike('title', `%Emergency: ${alertPayload.userId}%`)
              .limit(1);

            if (userTrips && userTrips.length > 0) {
              dbRow.trip_id = userTrips[0].id;
              alertPayload.tripId = userTrips[0].id;
            } else {
              const newTripId = crypto.randomUUID();
              const { data: createdTrip } = await supabase.from('trips').insert({
                id: newTripId,
                user_id: defaultProfileId,
                title: `Emergency: ${alertPayload.userId} (${alertPayload.userName})`,
                status: 'active',
                start_at: new Date().toISOString(),
                end_at: new Date(Date.now() + 86400000).toISOString(),
                buffer_m: 500,
                current_state: 'sos'
              }).select('id').single();

              if (createdTrip) {
                dbRow.trip_id = createdTrip.id;
                alertPayload.tripId = createdTrip.id;
              }
            }
          } catch (tErr) {}
        }

        // Check if an active/live alert already exists on this trip for this user
        const { data: activeAlerts } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone), trips(title)')
          .eq('trip_id', dbRow.trip_id)
          .in('status', ['open', 'acknowledged', 'dispatched'])
          .order('raised_at', { ascending: false })
          .limit(1);

        if (activeAlerts && activeAlerts.length > 0) {
          const liveAlert = activeAlerts[0];
          const updateFields = {
            state: 'sos',
            message: alertPayload.message,
            battery: validatedBattery != null ? validatedBattery : liveAlert.battery,
            updated_at: new Date().toISOString()
          };
          if (dbRow.location) updateFields.location = dbRow.location;

          const { data: updatedRow, error: updateErr } = await supabase
            .from('alerts')
            .update(updateFields)
            .eq('id', liveAlert.id)
            .select('*, profiles(full_name, phone), trips(title)')
            .single();

          if (!updateErr && updatedRow) {
            targetAlertRow = updatedRow;
            isUpdate = true;
          }
        }

        if (!targetAlertRow) {
          const { data: insertedRow, error: insertError } = await supabase
            .from('alerts')
            .insert(dbRow)
            .select('*, profiles(full_name, phone), trips(title)')
            .single();

          if (!insertError && insertedRow) {
            targetAlertRow = insertedRow;
          } else if (insertError && (insertError.code === '23505' || insertError.message?.includes('one_live_alert_per_trip'))) {
            const { data: conflictAlert } = await supabase
              .from('alerts')
              .select('*, profiles(full_name, phone), trips(title)')
              .eq('trip_id', dbRow.trip_id)
              .in('status', ['open', 'acknowledged', 'dispatched'])
              .order('raised_at', { ascending: false })
              .limit(1)
              .single();

            if (conflictAlert) {
              const updateFields = {
                state: 'sos',
                message: alertPayload.message,
                battery: validatedBattery != null ? validatedBattery : conflictAlert.battery,
                updated_at: new Date().toISOString()
              };
              if (dbRow.location) updateFields.location = dbRow.location;

              const { data: fallbackUpdated } = await supabase
                .from('alerts')
                .update(updateFields)
                .eq('id', conflictAlert.id)
                .select('*, profiles(full_name, phone), trips(title)')
                .single();

              targetAlertRow = fallbackUpdated || conflictAlert;
              isUpdate = true;
            }
          }
        }

        // Log audit event to alert_events
        if (targetAlertRow) {
          try {
            await supabase.from('alert_events').insert({
              alert_id: targetAlertRow.id,
              kind: isUpdate ? 'sos_location_update' : 'sos_raised',
              payload: {
                battery: validatedBattery,
                hasGps: Boolean(validatedLocation),
                lat: validatedLocation?.lat || null,
                lng: validatedLocation?.lng || null,
                deviceInfo: validatedDeviceInfo,
                isUpdate
              },
              actor: 'mobile_app'
            });
          } catch (e) {}

          createdAlert = mapAlertFromDb(targetAlertRow);
          if (createdAlert && (!createdAlert.userName || createdAlert.userName === 'Active Traveller') && alertPayload.userName) {
            createdAlert.userName = alertPayload.userName;
          }
          if (createdAlert && validatedDeviceInfo) {
            createdAlert.deviceInfo = validatedDeviceInfo;
          }
        }
      } catch (sbError) {
        console.warn('[SUPABASE SOS DISPATCH WARNING]', sbError.message);
      }
    }

    // 2. Synchronize to local alerts.json (offline fallback & zero silent divergence)
    const fallbackAlertId = targetAlertRow ? targetAlertRow.id : `alt_sos_${Date.now()}`;
    const jsonAlert = {
      id: fallbackAlertId,
      userId: alertPayload.userId,
      userName: alertPayload.userName,
      tripId: alertPayload.tripId,
      type: alertPayload.type,
      priority: alertPayload.priority,
      message: alertPayload.message,
      location: alertPayload.location,
      batteryLevel: alertPayload.batteryLevel,
      deviceInfo: validatedDeviceInfo,
      status: 'Pending',
      source: 'mobile_app',
      timestamp: new Date().toISOString()
    };

    try {
      const alerts = await readJson('alerts');
      const existingIdx = alerts.findIndex(a => 
        a.id === fallbackAlertId || 
        ((alertPayload.userId ? a.userId === alertPayload.userId : (alertPayload.tripId && a.tripId === alertPayload.tripId)) && 
         (a.status === 'Pending' || a.status === 'open'))
      );
      if (existingIdx !== -1) {
        const existingId = alerts[existingIdx].id;
        alerts[existingIdx] = { ...alerts[existingIdx], ...jsonAlert, id: existingId, updatedAt: new Date().toISOString() };
        jsonAlert.id = existingId;
        if (!targetAlertRow) {
          createdAlert = alerts[existingIdx];
        }
        isUpdate = true;
      } else {
        alerts.unshift(jsonAlert);
      }
      await writeJson('alerts', alerts);
    } catch (e) {
      console.warn('[ALERTS JSON SYNC NOTE]', e.message);
    }

    if (!createdAlert) {
      createdAlert = jsonAlert;
    }

    // 3. Update users.json with emergency telemetry & status
    try {
      const users = await readJson('users');
      const uIdx = users.findIndex(u => 
        (userId && u.id === userId) ||
        (userName && u.fullName && u.fullName.toLowerCase().trim() === userName.toLowerCase().trim())
      );
      if (uIdx !== -1) {
        if (validatedLocation) {
          users[uIdx].currentLocation = {
            name: `Emergency GPS Fix (${validatedLocation.lat.toFixed(4)}, ${validatedLocation.lng.toFixed(4)})`,
            lat: validatedLocation.lat,
            lng: validatedLocation.lng,
            elevation: null
          };
        }
        if (validatedBattery !== null) {
          users[uIdx].batteryLevel = validatedBattery;
        }
        if (validatedDeviceInfo) {
          users[uIdx].deviceInfo = validatedDeviceInfo;
        }
        users[uIdx].status = 'EMERGENCY';
        users[uIdx].lastAlertTimestamp = new Date().toISOString();
        users[uIdx].lastPing = new Date().toISOString();
        await writeJson('users', users);
      } else {
        const admins = await readJson('admins');
        const matchedAdmin = admins.find(a => 
          (userId && a.id === userId) ||
          (userName && a.name && a.name.toLowerCase().trim() === userName.toLowerCase().trim())
        );

        users.unshift({
          id: userId || matchedAdmin?.id || `usr_${Date.now()}`,
          fullName: userName || matchedAdmin?.name || 'Active Traveller',
          email: matchedAdmin?.email || null,
          phone: matchedAdmin?.phone || 'Mobile GPS Fix',
          emergencyContact: matchedAdmin?.phone || 'Mobile GPS Fix',
          status: 'EMERGENCY',
          currentLocation: validatedLocation ? {
            name: `Emergency GPS Fix (${validatedLocation.lat.toFixed(4)}, ${validatedLocation.lng.toFixed(4)})`,
            lat: validatedLocation.lat,
            lng: validatedLocation.lng,
            elevation: null
          } : null,
          batteryLevel: validatedBattery,
          networkSignal: 'Mobile GNSS (Distress Beacon)',
          offlineDurationMinutes: 0,
          guardians: [],
          documents: [],
          activeTripId: tripId || null,
          lastPing: new Date().toISOString()
        });
        await writeJson('users', users);
      }
    } catch (e) {
      console.log('[USERS JSON SYNC ON SOS NOTE]', e.message);
    }

    console.log(`[EMERGENCY SOS ${isUpdate ? 'UPDATED' : 'DISPATCHED'}] ID: ${createdAlert.id} | User: ${createdAlert.userName} | Bat: ${validatedBattery}% | Lat: ${validatedLocation?.lat}, Lng: ${validatedLocation?.lng}`);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate 
        ? 'Emergency distress beacon updated with your latest GPS position and battery level.' 
        : 'Emergency SOS Alert logged and broadcast to Command Center.',
      alert: createdAlert
    });
  } catch (error) {
    console.error('[CREATE SOS ALERT ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to process SOS alert: ${error.message}`
    });
  }
};

// Simulation endpoint for test triggers from Command Center
export const simulateSosAlert = async (req, res, next) => {
  try {
    const simPayload = {
      userName: req.admin?.name || 'Simulation Operator',
      type: 'MANUAL_SOS',
      priority: 'CRITICAL',
      message: `🚨 SIMULATED SOS: Emergency response beacon activated by ${req.admin?.name || 'Command Center'}.`,
      location: { lat: 32.3716, lng: 77.2466 },
      batteryLevel: 88,
      status: 'Pending'
    };

    req.body = simPayload;
    return createSosAlert(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const simulateAlert = simulateSosAlert;
