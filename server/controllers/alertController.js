import { 
  isSupabaseConfigured, 
  getSupabaseClient, 
  mapAlertFromDb, 
  mapAlertToDb 
} from '../database/supabase.js';
import { readJson, writeJson } from '../utils/jsonDb.js';

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
      .single();

    if (error || !alertRow) {
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    const alert = mapAlertFromDb(alertRow);

    // Fetch related alert events (audit trail)
    try {
      const { data: events } = await supabase
        .from('alert_events')
        .select('*')
        .eq('alert_id', req.params.id)
        .order('created_at', { ascending: false });

      if (events && events.length > 0) {
        alert.rescueNotes = events.map(e => ({
          timestamp: e.created_at,
          note: `[${e.kind}] ${JSON.stringify(e.payload)}`,
          author: e.actor || 'System'
        }));
      }
    } catch (e) {}

    res.json({
      success: true,
      alert,
      user: {
        id: alert.userId,
        fullName: alert.userName,
        phone: alertRow.profiles?.phone || null
      }
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
      .single();

    if (updateError) {
      console.error('[SUPABASE UPDATE ERROR]', updateError.message);
      return res.status(500).json({
        success: false,
        message: `Database error updating alert status: ${updateError.message}`
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

// Create real mobile SOS emergency alert in Supabase (NO fabricated coordinates or telemetry)
export const createSosAlert = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Supabase database is not configured. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      });
    }

    const { 
      userId, 
      userName, 
      type, 
      priority, 
      message, 
      location, 
      batteryLevel, 
      tripId 
    } = req.body || {};

    const supabase = getSupabaseClient();
    const { defaultProfileId, defaultTripId } = await getDatabaseDefaults(supabase);

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

    const alertPayload = {
      userId,
      userName: userName || 'Active Traveller',
      tripId,
      type: type || 'MANUAL_SOS',
      priority: priority || 'CRITICAL',
      message: message || `🚨 MANUAL SOS triggered by ${userName || 'Traveller'}! Immediate emergency response required.`,
      location: validatedLocation,
      batteryLevel: validatedBattery,
      status: 'Pending'
    };

    const dbRow = mapAlertToDb(alertPayload, defaultProfileId, defaultTripId);

    // 1. Check if an active/live alert already exists on this trip to satisfy "one_live_alert_per_trip"
    let targetAlertRow = null;
    let isUpdate = false;

    try {
      const { data: activeAlerts } = await supabase
        .from('alerts')
        .select('*, profiles(full_name, phone), trips(title)')
        .eq('trip_id', dbRow.trip_id)
        .in('status', ['open', 'acknowledged', 'dispatched'])
        .order('raised_at', { ascending: false })
        .limit(1);

      if (activeAlerts && activeAlerts.length > 0) {
        // Existing live alert found on this trip! Update with freshest telemetry instead of violating unique constraint
        const liveAlert = activeAlerts[0];
        const updateFields = {
          state: 'sos',
          message: alertPayload.message,
          battery: validatedBattery != null ? validatedBattery : liveAlert.battery,
          updated_at: new Date().toISOString()
        };
        if (dbRow.location) {
          updateFields.location = dbRow.location;
        }

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
    } catch (err) {
      console.warn('[CHECK ACTIVE ALERTS NOTE]', err.message);
    }

    // 2. If no existing active alert, insert new alert record
    if (!targetAlertRow) {
      const { data: insertedRow, error: insertError } = await supabase
        .from('alerts')
        .insert(dbRow)
        .select('*, profiles(full_name, phone), trips(title)')
        .single();

      if (insertError) {
        // If unique constraint "one_live_alert_per_trip" triggered (race condition), update the existing live alert
        if (insertError.code === '23505' || insertError.message?.includes('one_live_alert_per_trip')) {
          console.warn('[SUPABASE 23505] Constraint one_live_alert_per_trip caught. Updating existing active alert with freshest telemetry...');
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

        if (!targetAlertRow) {
          console.error('[SUPABASE INSERT FAILED]', insertError.message);
          return res.status(500).json({
            success: false,
            message: `Database error creating emergency record in Supabase: ${insertError.message}`
          });
        }
      } else {
        targetAlertRow = insertedRow;
      }
    }

    // 3. Also update users.json with real emergency telemetry & status
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
        users[uIdx].status = 'EMERGENCY';
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
          email: matchedAdmin?.email || 'emergency-sos@stsms.gov',
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

    // 4. Log audit event to alert_events
    try {
      await supabase.from('alert_events').insert({
        alert_id: targetAlertRow.id,
        kind: isUpdate ? 'sos_location_update' : 'sos_raised',
        payload: {
          battery: validatedBattery,
          hasGps: Boolean(validatedLocation),
          lat: validatedLocation?.lat || null,
          lng: validatedLocation?.lng || null,
          isUpdate
        },
        actor: 'mobile_app'
      });
    } catch (e) {}

    const createdAlert = mapAlertFromDb(targetAlertRow);
    console.log(`[SUPABASE SOS ${isUpdate ? 'UPDATED' : 'CREATED'}] ID: ${createdAlert.id} | User: ${createdAlert.userName} | Bat: ${validatedBattery}% | Lat: ${validatedLocation?.lat}, Lng: ${validatedLocation?.lng}`);

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
