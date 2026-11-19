import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient, mapAlertToDb, mapAlertFromDb } from '../database/supabase.js';
import { getDestinationImageUrl } from '../utils/destinationImages.js';

// Haversine formula to compute distance in meters between two lat/lon coordinates
export const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// In-memory geocoding cache to prevent redundant external queries
const geocodeCache = new Map();

// Built-in verified tourist destinations fallback
const POPULAR_DESTINATIONS = [
  { name: 'Agra Airport', displayName: 'Agra Airport (Kheria Airport), Agra, Uttar Pradesh', lat: 27.1558, lng: 77.9654, type: 'airport', imageUrl: getDestinationImageUrl('Agra Airport') },
  { name: 'Sanchi Stupa', displayName: 'Sanchi Buddhist Monument Complex, Raisen, MP', lat: 23.4867, lng: 77.7385, type: 'heritage', imageUrl: getDestinationImageUrl('Sanchi Stupa') },
  { name: 'Rohtang Pass Summit', displayName: 'Rohtang Pass, Himachal Pradesh, India', lat: 32.3716, lng: 77.2466, type: 'mountain_pass', imageUrl: getDestinationImageUrl('Rohtang Pass') },
  { name: 'Solang Valley', displayName: 'Solang Valley, Manali, Himachal Pradesh, India', lat: 32.3166, lng: 77.1575, type: 'valley', imageUrl: getDestinationImageUrl('Solang Valley') },
  { name: 'Manali Mall Road', displayName: 'Mall Road, Manali, Himachal Pradesh, India', lat: 32.2396, lng: 77.1887, type: 'town', imageUrl: getDestinationImageUrl('Manali Mall Road') },
  { name: 'Guna Fort & Forest Reserve', displayName: 'Guna Fort, Guna, Madhya Pradesh, India', lat: 24.6467, lng: 77.3117, type: 'historical', imageUrl: getDestinationImageUrl('Guna Fort') },
  { name: 'Mohanpur Safety Corridor', displayName: 'Mohanpur, Guna, Madhya Pradesh, India', lat: 24.5821, lng: 77.2894, type: 'sanctuary', imageUrl: getDestinationImageUrl('Mohanpur') },
  { name: 'Pangong Tso Lake', displayName: 'Pangong Tso, Ladakh, India', lat: 33.7595, lng: 78.6674, type: 'lake', imageUrl: getDestinationImageUrl('Pangong Tso') },
  { name: 'Rishikesh River Camp', displayName: 'Rishikesh, Uttarakhand, India', lat: 30.0869, lng: 78.2676, type: 'river', imageUrl: getDestinationImageUrl('Rishikesh') },
  { name: 'Valley of Flowers', displayName: 'Valley of Flowers National Park, Uttarakhand, India', lat: 30.7280, lng: 79.6053, type: 'national_park', imageUrl: getDestinationImageUrl('Valley of Flowers') },
  { name: 'Munnar Tea Estate Ridge', displayName: 'Munnar, Idukki, Kerala, India', lat: 10.0889, lng: 77.0595, type: 'hill_station', imageUrl: getDestinationImageUrl('Munnar') },
  { name: 'Anjuna Coastal Trail', displayName: 'Anjuna Beach, Goa, India', lat: 15.5733, lng: 73.7410, type: 'coastal', imageUrl: getDestinationImageUrl('Anjuna Beach') }
];

/**
 * 1. Geocoding API: Converts destination names into coordinates.
 * Queries OpenStreetMap Nominatim with caching, rate-limit safety, and verified Indian fallbacks.
 */
export const geocodeDestination = async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, results: POPULAR_DESTINATIONS.slice(0, 5) });
    }

    const cacheKey = q.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return res.json({ success: true, source: 'cache', results: geocodeCache.get(cacheKey) });
    }

    // Check built-in fallback matches first for instantaneous response
    const localMatches = POPULAR_DESTINATIONS.filter(d => 
      d.name.toLowerCase().includes(cacheKey) || d.displayName.toLowerCase().includes(cacheKey)
    );

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);

      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'STSMS-SafeTravelZone-EmergencyMonitoring/1.0 (admin@stsms.gov)'
        },
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (resp.ok) {
        const rawResults = await resp.json();
        const formatted = rawResults.map(item => ({
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || item.class || 'destination',
          importance: item.importance
        }));

        // Merge with local matches
        const combined = [...localMatches];
        formatted.forEach(f => {
          if (!combined.some(c => Math.abs(c.lat - f.lat) < 0.01 && Math.abs(c.lng - f.lng) < 0.01)) {
            combined.push(f);
          }
        });

        geocodeCache.set(cacheKey, combined);
        return res.json({ success: true, source: 'nominatim', results: combined });
      }
    } catch (netErr) {
      console.warn('[GEOCODE OSM WARNING]', netErr.message);
    }

    // Return local matches if external API failed or timed out
    const results = localMatches.length > 0 ? localMatches : POPULAR_DESTINATIONS.slice(0, 4);
    geocodeCache.set(cacheKey, results);
    res.json({ success: true, source: 'fallback', results });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Create and Activate a Safe Travel Zone Trip
 */
export const createSafeZoneTrip = async (req, res, next) => {
  try {
    const {
      userId,
      userName,
      userPhone,
      destinationName: rawDestName,
      destination: altDestName,
      destinationLat: rawDestLat,
      destinationLng: rawDestLng,
      destinationCoordinates,
      radiusMeters = 5000,
      currentLat: rawCurrLat,
      currentLng: rawCurrLng,
      userLocation,
      batteryLevel,
      guardianName,
      guardianPhone,
      guardianEmail,
      imageUrl,
      notes
    } = req.body;

    const destinationName = rawDestName || altDestName;
    const destinationLat = rawDestLat ?? destinationCoordinates?.lat;
    const destinationLng = rawDestLng ?? destinationCoordinates?.lng;
    const currentLat = rawCurrLat ?? userLocation?.lat;
    const currentLng = rawCurrLng ?? userLocation?.lng;

    if (!destinationName || destinationLat == null || destinationLng == null) {
      return res.status(400).json({
        success: false,
        message: 'Destination name and valid coordinates (lat/lng) are required.'
      });
    }

    const destLat = parseFloat(destinationLat);
    const destLng = parseFloat(destinationLng);
    if (isNaN(destLat) || destLat < -90 || destLat > 90 || isNaN(destLng) || destLng < -180 || destLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.'
      });
    }

    const radius = Math.max(500, Math.min(50000, parseInt(radiusMeters, 10) || 5000));
    const now = new Date().toISOString();
    const tripId = `sz_trp_${Date.now()}`;
    const targetUserId = userId || req.user?.id || 'usr_102';
    const targetUserName = userName || req.user?.name || req.user?.fullName || 'Active Traveller';

    // Calculate initial state if tourist's current location was provided
    let initialStatus = 'APPROACHING';
    let hasEntered = false;
    let initialDist = null;

    if (currentLat != null && currentLng != null && !isNaN(parseFloat(currentLat)) && !isNaN(parseFloat(currentLng))) {
      initialDist = calculateHaversineDistanceMeters(parseFloat(currentLat), parseFloat(currentLng), destLat, destLng);
      if (initialDist <= radius) {
        initialStatus = 'ACTIVE';
        hasEntered = true;
      }
    }

    const safeZoneTrip = {
      id: tripId,
      userId: targetUserId,
      userName: targetUserName,
      userPhone: userPhone || '+91 98765 43210',
      destination: destinationName,
      destinationName,
      destinationCoords: { lat: destLat, lng: destLng },
      imageUrl: req.body.imageUrl || getDestinationImageUrl(destinationName),
      radiusMeters: radius,
      boundaryRadiusKm: +(radius / 1000).toFixed(1),
      status: initialStatus, // 'APPROACHING' | 'ACTIVE' | 'WARNING' | 'BREACHED' | 'PAUSED' | 'COMPLETED'
      hasEnteredZone: hasEntered,
      enteredZoneAt: hasEntered ? now : null,
      currentLocation: (currentLat != null && currentLng != null) ? {
        lat: parseFloat(currentLat),
        lng: parseFloat(currentLng),
        name: `GPS Fix near ${destinationName}`,
        accuracy: req.body.currentAccuracy || 12
      } : null,
      distanceFromDestMeters: initialDist,
      distanceOutsideBoundaryMeters: initialDist != null ? Math.max(0, initialDist - radius) : 0,
      batteryLevel: batteryLevel != null ? parseInt(batteryLevel, 10) : null,
      consecutiveOutsideCount: 0,
      warningStartedAt: null,
      breachConfirmedAt: null,
      activeAlertId: null,
      guardianName: guardianName || 'Primary Guardian',
      guardianPhone: guardianPhone || '+91 98765 43210',
      guardianEmail: guardianEmail || 'guardian@stsms.gov',
      notes: notes || 'Safe Travel Zone auto-geofencing active.',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          timestamp: now,
          event: 'ZONE_CREATED',
          status: initialStatus,
          distanceMeters: initialDist,
          note: `Safe Travel Zone activated around ${destinationName} (${radius}m boundary)`
        }
      ]
    };

    // 1. Save to JSON database
    const trips = await readJson('trips');
    trips.unshift(safeZoneTrip);
    await writeJson('trips', trips);

    // 2. Update user profile active trip in users.json
    try {
      const users = await readJson('users');
      const uIdx = users.findIndex(u => u.id === targetUserId || u.fullName === targetUserName);
      if (uIdx !== -1) {
        users[uIdx].activeTripId = tripId;
        users[uIdx].activeSafeZone = {
          tripId,
          destination: destinationName,
          coords: { lat: destLat, lng: destLng },
          radiusMeters: radius,
          status: initialStatus
        };
        await writeJson('users', users);
      }
    } catch (uErr) {
      console.warn('[USERS SYNC NOTE]', uErr.message);
    }

    // 3. Sync to Supabase trips table with valid columns and enum
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: prof } = await supabase.from('profiles').select('id').limit(1);
        const validUserId = (targetUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId))
          ? targetUserId
          : (prof && prof.length > 0 ? prof[0].id : '3614e1d0-f867-4734-a245-412e8d1f866f');

        const sbTripId = crypto.randomUUID();
        const { data: sbTrip, error: sbErr } = await supabase.from('trips').insert({
          id: sbTripId,
          user_id: validUserId,
          title: `Safe Zone: ${destinationName}`,
          status: 'active',
          start_at: now,
          end_at: new Date(Date.now() + 86400000).toISOString(),
          buffer_m: radius,
          current_state: initialStatus === 'ACTIVE' ? 'normal' : 'normal',
          last_location: `POINT(${destLng} ${destLat})`,
          last_battery: safeZoneTrip.batteryLevel
        }).select('id').single();

        if (!sbErr && sbTrip) {
          safeZoneTrip.supabaseTripId = sbTrip.id;
        } else if (sbErr) {
          console.warn('[SUPABASE SAFE ZONE TRIP SYNC NOTE]', sbErr.message);
        }
      } catch (sbErr) {
        console.warn('[SUPABASE SAFE ZONE TRIP SYNC ERROR]', sbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Safe Travel Zone activated around ${destinationName} (5 km boundary)!`,
      trip: safeZoneTrip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get Active Safe Zone Trip for a Tourist
 */
export const getActiveSafeZoneTrip = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.query.userId || req.user?.id;
    const trips = await readJson('trips');

    const activeTrip = trips.find(t => 
      t.destinationCoords && 
      (!userId || t.userId === userId) && 
      t.status !== 'COMPLETED'
    );

    if (!activeTrip) {
      return res.json({ success: true, active: false, trip: null });
    }

    res.json({
      success: true,
      active: true,
      trip: activeTrip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Update Tourist Location & Evaluate Geofence Boundary Transition (Server-Side State Machine)
 * Includes GPS accuracy checks, consecutive reading confirmation, and idempotent automatic SOS dispatch.
 */
export const updateSafeZoneLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      lat,
      lng,
      accuracy,
      batteryLevel,
      speedKmH,
      timestamp,
      isBackground = false
    } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Valid GPS latitude and longitude are required.' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ success: false, message: 'Coordinates out of bounds.' });
    }

    const trips = await readJson('trips');
    const tripIndex = trips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return res.status(404).json({ success: false, message: 'Safe travel zone trip not found.' });
    }

    const trip = trips[tripIndex];
    if (trip.status === 'COMPLETED' || trip.status === 'PAUSED') {
      return res.json({
        success: true,
        message: `Monitoring is currently ${trip.status}. Location saved without geofence evaluation.`,
        trip
      });
    }

    const now = new Date().toISOString();
    const destLat = trip.destinationCoords.lat;
    const destLng = trip.destinationCoords.lng;
    const radiusMeters = trip.radiusMeters || 5000;
    const parsedAccuracy = accuracy != null ? parseFloat(accuracy) : 10;
    const parsedBattery = batteryLevel != null ? Math.max(0, Math.min(100, parseInt(batteryLevel, 10))) : trip.batteryLevel;

    // Reject stale GPS pings (> 3 minutes old) for state transitions to prevent false positives
    const pingAgeSeconds = timestamp ? (Date.now() - new Date(timestamp).getTime()) / 1000 : 0;
    const isStale = pingAgeSeconds > 180;

    // Calculate real distance to destination center
    const distanceMeters = calculateHaversineDistanceMeters(parsedLat, parsedLng, destLat, destLng);
    const distanceOutside = Math.max(0, distanceMeters - radiusMeters);
    const isInsideRadius = distanceMeters <= radiusMeters;

    let previousStatus = trip.status;
    let nextStatus = trip.status;
    let transitionEvent = null;
    let alertCreated = null;

    // Accuracy threshold check: GPS readings with poor accuracy (>80m) are logged but cannot trigger a boundary breach
    const isReliableFix = !isNaN(parsedAccuracy) && parsedAccuracy <= 80 && !isStale;

    // =========================================================================
    // GEOFENCE FINITE STATE MACHINE (FSM)
    // =========================================================================
    if (trip.status === 'APPROACHING') {
      if (isInsideRadius) {
        // Tourist entered safe zone for the first time
        nextStatus = 'ACTIVE';
        trip.hasEnteredZone = true;
        trip.enteredZoneAt = now;
        trip.consecutiveOutsideCount = 0;
        transitionEvent = {
          timestamp: now,
          event: 'ZONE_ENTERED',
          previousStatus,
          status: nextStatus,
          distanceMeters,
          note: `Tourist entered designated 5km Safe Travel Zone (${distanceMeters}m from ${trip.destination})`
        };
      } else {
        // Still approaching destination outside 5km; do NOT trigger emergency SOS
        nextStatus = 'APPROACHING';
      }
    } else if (trip.status === 'ACTIVE') {
      if (!isInsideRadius) {
        if (isReliableFix) {
          // Tourist moved outside boundary: enter WARNING state & start 10-second response window
          nextStatus = 'WARNING';
          trip.consecutiveOutsideCount = 1;
          trip.warningStartedAt = now;
          trip.warningExpiresAt = new Date(Date.now() + 10000).toISOString();
          trip.warningAcknowledged = false;
          transitionEvent = {
            timestamp: now,
            event: 'BOUNDARY_WARNING',
            previousStatus,
            status: nextStatus,
            distanceMeters,
            distanceOutside,
            note: `Tourist crossed 5km perimeter. Outside by ${distanceOutside}m. 10-second emergency grace countdown initiated.`
          };
        }
      } else {
        trip.consecutiveOutsideCount = 0;
      }
    } else if (trip.status === 'WARNING') {
      if (isInsideRadius) {
        // Tourist stepped back inside the 5km zone
        nextStatus = 'ACTIVE';
        trip.consecutiveOutsideCount = 0;
        trip.warningStartedAt = null;
        trip.warningExpiresAt = null;
        trip.warningAcknowledged = false;
        transitionEvent = {
          timestamp: now,
          event: 'RETURNED_TO_SAFE_ZONE',
          previousStatus,
          status: nextStatus,
          distanceMeters,
          note: `Tourist safely re-entered 5km Safe Travel Zone (${distanceMeters}m from center).`
        };
      } else if (isReliableFix) {
        // Increment consecutive outside reading count
        trip.consecutiveOutsideCount = (trip.consecutiveOutsideCount || 1) + 1;

        // Check if 10-second grace window elapsed without tourist acknowledgement
        const isExpired = trip.warningExpiresAt && (new Date(now).getTime() >= new Date(trip.warningExpiresAt).getTime());

        // Confirmed breach after grace window or consecutive verified pings
        if (isExpired && !trip.warningAcknowledged && trip.consecutiveOutsideCount >= 2) {
          nextStatus = 'BREACHED';
          trip.breachConfirmedAt = now;
          trip.warningStartedAt = null;
          trip.warningExpiresAt = null;
          transitionEvent = {
            timestamp: now,
            event: 'BREACH_CONFIRMED',
            previousStatus,
            status: nextStatus,
            distanceMeters,
            distanceOutside,
            note: `AUTOMATIC SAFE-ZONE BREACH: Tourist exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds. Confirmed after ${trip.consecutiveOutsideCount} consecutive verified readings. Outside by ${distanceOutside}m.`
          };

          // Trigger automatic GEOFENCE_BREACH incident idempotently
          alertCreated = await dispatchAutomaticGeofenceAlert(trip, {
            lat: parsedLat,
            lng: parsedLng,
            accuracy: parsedAccuracy,
            battery: parsedBattery,
            deviceInfo: req.body.deviceInfo || trip.deviceInfo || null,
            distanceMeters,
            distanceOutside,
            timestamp: now
          });

          if (alertCreated?.id) {
            trip.activeAlertId = alertCreated.id;
          }
        }
      }
    } else if (trip.status === 'BREACHED') {
      if (isInsideRadius) {
        // Tourist has returned inside the boundary!
        nextStatus = 'ACTIVE';
        trip.consecutiveOutsideCount = 0;
        trip.warningStartedAt = null;
        transitionEvent = {
          timestamp: now,
          event: 'RETURNED_AFTER_BREACH',
          previousStatus,
          status: nextStatus,
          distanceMeters,
          note: `Tourist re-entered 5km boundary after previous breach incident.`
        };

        // Note in active alert if present
        if (trip.activeAlertId && isSupabaseConfigured()) {
          try {
            const sb = getSupabaseClient();
            await sb.from('alert_events').insert({
              alert_id: trip.activeAlertId,
              kind: 'tourist_reentered_safe_zone',
              payload: { lat: parsedLat, lng: parsedLng, distanceMeters },
              actor: 'Automated Geofence Engine'
            });
          } catch (e) {}
        }
      } else {
        // Still outside: update telemetry on the active incident idempotently (no duplicate alert)
        if (trip.activeAlertId && isSupabaseConfigured()) {
          try {
            const sb = getSupabaseClient();
            await sb.from('alerts').update({
              lat: parsedLat,
              lon: parsedLng,
              battery: parsedBattery,
              updated_at: now
            }).eq('id', trip.activeAlertId);
          } catch (e) {}
        }
      }
    }

    // Update trip telemetry
    trip.status = nextStatus;
    trip.currentLocation = {
      lat: parsedLat,
      lng: parsedLng,
      accuracy: parsedAccuracy,
      name: `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
      elevation: req.body.elevation || null
    };
    trip.distanceFromDestMeters = distanceMeters;
    trip.distanceOutsideBoundaryMeters = distanceOutside;
    trip.batteryLevel = parsedBattery;
    trip.lastAccuracyMeters = parsedAccuracy;
    trip.lastPingAt = now;
    trip.updatedAt = now;

    if (transitionEvent) {
      if (!trip.history) trip.history = [];
      trip.history.unshift(transitionEvent);
    }

    trips[tripIndex] = trip;
    await writeJson('trips', trips);

    // Sync tourist position to users.json
    try {
      const users = await readJson('users');
      const uIdx = users.findIndex(u => u.id === trip.userId || u.fullName === trip.userName);
      if (uIdx !== -1) {
        users[uIdx].currentLocation = trip.currentLocation;
        users[uIdx].batteryLevel = parsedBattery;
        users[uIdx].lastPing = now;
        if (nextStatus === 'BREACHED') {
          users[uIdx].status = 'EMERGENCY';
        } else if (users[uIdx].status !== 'EMERGENCY') {
          users[uIdx].status = 'Online';
        }
        await writeJson('users', users);
      }
    } catch (e) {}

    res.json({
      success: true,
      status: nextStatus,
      previousStatus,
      transitionOccurred: previousStatus !== nextStatus,
      distanceMeters,
      distanceFromDestMeters: distanceMeters,
      distanceOutsideBoundaryMeters: distanceOutside,
      countdownSeconds: nextStatus === 'WARNING' ? 10 : null,
      isInsideRadius,
      consecutiveOutsideCount: trip.consecutiveOutsideCount,
      alertDispatched: Boolean(alertCreated),
      alert: alertCreated,
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to idempotently create and dispatch a GEOFENCE_BREACH incident to Supabase and Admin
 */
const dispatchAutomaticGeofenceAlert = async (trip, telemetry) => {
  const alertId = `alt_geo_${Date.now()}`;
  const now = telemetry.timestamp || new Date().toISOString();

  const alertPayload = {
    id: alertId,
    userId: trip.userId,
    userName: trip.userName,
    tripId: trip.id,
    type: 'GEOFENCE_BREACH',
    subtype: 'AUTOMATIC_SAFEZONE_BREACH',
    priority: 'CRITICAL',
    message: `🚨 AUTOMATIC SAFE-ZONE BREACH: Tourist ${trip.userName} exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds. Boundary: ${trip.destination} (5 km). Outside by: ${telemetry.distanceOutside != null ? telemetry.distanceOutside + 'm' : 'Outside boundary'}. Coordinates: (${telemetry.lat.toFixed(4)}, ${telemetry.lng.toFixed(4)}). Battery: ${telemetry.battery}%.`,
    location: {
      lat: telemetry.lat,
      lng: telemetry.lng,
      name: `Automatic Safe-Zone Breach (${telemetry.lat.toFixed(4)}, ${telemetry.lng.toFixed(4)})`
    },
    batteryLevel: telemetry.battery,
    deviceInfo: telemetry.deviceInfo || trip.deviceInfo || {
      platform: 'Android',
      manufacturer: 'Unavailable',
      model: 'Unavailable',
      osVersion: 'Unavailable'
    },
    status: 'Pending',
    source: 'app',
    timestamp: now
  };

  // 1. If Supabase is configured, check for existing active alert on this trip to maintain idempotency
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const defaultUserId = '3614e1d0-f867-4734-a245-412e8d1f866f';
      let sbTripId = trip.supabaseTripId;

      if (!sbTripId) {
        sbTripId = crypto.randomUUID();
        trip.supabaseTripId = sbTripId;
        try {
          await supabase.from('trips').insert({
            id: sbTripId,
            user_id: defaultUserId,
            title: `Safe Zone: ${trip.destination}`,
            status: 'active',
            start_at: now,
            end_at: new Date(Date.now() + 86400000).toISOString(),
            buffer_m: trip.radiusMeters || 5000,
            current_state: 'sos',
            last_location: `POINT(${telemetry.lng} ${telemetry.lat})`,
            last_battery: telemetry.battery
          });
        } catch (tErr) {
          console.warn('[SUPABASE AUTO-TRIP CREATE NOTE]', tErr.message);
        }
      }

      // Check for active alert strictly for this specific trip
      const { data: existingLiveAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('trip_id', sbTripId)
        .in('status', ['open', 'acknowledged', 'dispatched'])
        .limit(1);

      if (existingLiveAlerts && existingLiveAlerts.length > 0) {
        // Existing breach alert active on this trip; update telemetry instead of duplicating
        const live = existingLiveAlerts[0];
        await supabase
          .from('alerts')
          .update({
            lat: telemetry.lat,
            lon: telemetry.lng,
            battery: telemetry.battery,
            updated_at: now
          })
          .eq('id', live.id);

        const mapped = mapAlertFromDb(live);
        mapped.tripId = trip.id;
        mapped.isExisting = true;
        return mapped;
      }

      // Insert new alert for this trip into Supabase
      const dbRow = mapAlertToDb(alertPayload, defaultUserId, sbTripId);

      const { data: inserted, error: insErr } = await supabase
        .from('alerts')
        .insert(dbRow)
        .select('*')
        .single();

      if (insErr) {
        console.warn('[SUPABASE INSERT ALERT NOTE]', insErr.message);
      }

      if (!insErr && inserted) {
        // Log event in alert_events
        try {
          await supabase.from('alert_events').insert({
            alert_id: inserted.id,
            kind: 'geofence_breach_confirmed',
            payload: {
              destination: trip.destination,
              radiusMeters: trip.radiusMeters,
              distanceOutside: telemetry.distanceOutside,
              lat: telemetry.lat,
              lng: telemetry.lng,
              accuracy: telemetry.accuracy,
              battery: telemetry.battery
            },
            actor: 'Automated Geofence Engine'
          });
        } catch (e) {}

        const mapped = mapAlertFromDb(inserted);
        mapped.tripId = trip.id;
        return mapped;
      }
    } catch (err) {
      console.error('[GEOFENCE ALERT DISPATCH SUPABASE ERROR]', err.message);
    }
  }

  // 2. Mirror into JSON alerts
  try {
    const alerts = await readJson('alerts');
    alerts.unshift(alertPayload);
    await writeJson('alerts', alerts);
  } catch (e) {}

  return alertPayload;
};

/**
 * 5a. Tourist acknowledges boundary warning ("I AM SAFE") within 10 seconds.
 * Cancels countdown, records acknowledgement timestamp and GPS location,
 * does NOT create an emergency SOS alert, and continues safe zone monitoring.
 */
export const acknowledgeBreachWarning = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng, timestamp, note } = req.body;
    const trips = await readJson('trips');
    const tripIndex = trips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return res.status(404).json({ success: false, message: 'Safe travel zone trip not found.' });
    }

    const trip = trips[tripIndex];
    const now = timestamp || new Date().toISOString();
    const prevStatus = trip.status;

    // Reset warning state without terminating trip
    trip.warningStartedAt = null;
    trip.warningExpiresAt = null;
    trip.warningAcknowledged = true;
    trip.warningAcknowledgedAt = now;
    trip.consecutiveOutsideCount = 0;
    trip.status = 'ACTIVE';

    if (lat != null && lng != null) {
      trip.currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        name: `GPS Fix (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
        timestamp: now
      };
    }

    const auditEntry = {
      timestamp: now,
      event: 'WARNING_ACKNOWLEDGED_SAFE',
      previousStatus: prevStatus,
      status: 'ACTIVE',
      coords: (lat != null && lng != null) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      note: note || 'Tourist acknowledged safety warning ("I AM SAFE") within 10-second grace countdown. No emergency alert dispatched.'
    };

    if (!trip.history) trip.history = [];
    trip.history.unshift(auditEntry);

    trip.updatedAt = now;
    trips[tripIndex] = trip;
    await writeJson('trips', trips);

    res.json({
      success: true,
      message: 'Safety warning acknowledged! No SOS alert dispatched. Safe Travel Zone monitoring active.',
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5b. Escalate unacknowledged boundary breach to Admin Command Center.
 * Triggered when 10 seconds elapse with NO response from the tourist.
 * Creates an AUTOMATIC_SAFEZONE_BREACH incident with full device intelligence & telemetry.
 * Idempotent: does not duplicate if an alert is already active on this trip.
 */
export const escalateBreach = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng, accuracy, battery, deviceInfo, distanceMeters, distanceOutside, timestamp } = req.body;
    const trips = await readJson('trips');
    const tripIndex = trips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return res.status(404).json({ success: false, message: 'Safe travel zone trip not found.' });
    }

    const trip = trips[tripIndex];
    const now = timestamp || new Date().toISOString();

    trip.status = 'BREACHED';
    trip.breachConfirmedAt = now;
    trip.warningStartedAt = null;
    trip.warningExpiresAt = null;

    if (deviceInfo) {
      trip.deviceInfo = deviceInfo;
    }

    const alertCreated = await dispatchAutomaticGeofenceAlert(trip, {
      lat: lat != null ? parseFloat(lat) : (trip.currentLocation?.lat || 24.4346),
      lng: lng != null ? parseFloat(lng) : (trip.currentLocation?.lng || 77.1619),
      accuracy: accuracy || 15,
      battery: battery != null ? parseInt(battery, 10) : (trip.batteryLevel || 60),
      deviceInfo: deviceInfo || trip.deviceInfo || null,
      distanceMeters: distanceMeters || trip.distanceFromDestMeters,
      distanceOutside: distanceOutside || trip.distanceOutsideBoundaryMeters,
      timestamp: now
    });

    if (alertCreated?.id) {
      trip.activeAlertId = alertCreated.id;
    }

    const auditEntry = {
      timestamp: now,
      event: 'AUTOMATIC_BREACH_ESCALATED',
      previousStatus: 'WARNING',
      status: 'BREACHED',
      alertId: alertCreated?.id || null,
      note: 'AUTOMATIC SAFE-ZONE BREACH: Tourist exited the 5 km safety boundary and did not acknowledge the emergency warning within 10 seconds.'
    };

    if (!trip.history) trip.history = [];
    trip.history.unshift(auditEntry);

    trip.updatedAt = now;
    trips[tripIndex] = trip;
    await writeJson('trips', trips);

    const isExisting = Boolean(alertCreated?.isExisting);
    res.json({
      success: true,
      isExisting,
      message: isExisting ? 'Safe-Zone breach already active on this trip. Telemetry updated.' : 'Automatic Safe-Zone breach escalated to Admin Command Center.',
      alert: alertCreated,
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Tourist Confirms Safe ("I Am Safe")
 * Records confirmation in history and alert_events without silently erasing the incident record.
 */
export const confirmSafe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, lat, lng } = req.body;
    const trips = await readJson('trips');
    const tripIndex = trips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return res.status(404).json({ success: false, message: 'Safe zone trip not found.' });
    }

    const trip = trips[tripIndex];
    const now = new Date().toISOString();
    const prevStatus = trip.status;

    // Reset status to ACTIVE
    trip.status = 'ACTIVE';
    trip.consecutiveOutsideCount = 0;
    trip.warningStartedAt = null;

    const auditEntry = {
      timestamp: now,
      event: 'SAFE_CONFIRMED',
      previousStatus: prevStatus,
      status: 'ACTIVE',
      note: note || 'Tourist verified they are safe in-app. Boundary alert acknowledged.'
    };

    if (!trip.history) trip.history = [];
    trip.history.unshift(auditEntry);

    // If there was an active alert, update resolution in Supabase without erasing the alert
    if (trip.activeAlertId && isSupabaseConfigured()) {
      try {
        const sb = getSupabaseClient();
        await sb.from('alerts').update({
          status: 'resolved',
          resolved_at: now,
          resolution: `Tourist confirmed safe in-app (${note || 'Verified Safe'}).`
        }).eq('id', trip.activeAlertId);

        await sb.from('alert_events').insert({
          alert_id: trip.activeAlertId,
          kind: 'tourist_safety_confirmed',
          payload: { note: note || 'I am safe confirmation' },
          actor: trip.userName || 'Tourist'
        });
      } catch (sbErr) {
        console.warn('[SAFE CONFIRM SUPABASE SYNC NOTE]', sbErr.message);
      }
    }

    // Mirror resolution in alerts.json
    try {
      const alerts = await readJson('alerts');
      const aIdx = alerts.findIndex(a => a.id === trip.activeAlertId || (a.tripId === trip.id && (a.status === 'Pending' || a.status === 'open')));
      if (aIdx !== -1) {
        alerts[aIdx].status = 'Resolved';
        alerts[aIdx].resolvedAt = now;
        alerts[aIdx].resolution = `Tourist confirmed safe in-app (${note || 'Verified Safe'}).`;
        await writeJson('alerts', alerts);
      }
    } catch (e) {}

    trip.activeAlertId = null;
    trip.updatedAt = now;
    trips[tripIndex] = trip;
    await writeJson('trips', trips);

    // Update user status
    try {
      const users = await readJson('users');
      const uIdx = users.findIndex(u => u.id === trip.userId || u.fullName === trip.userName);
      if (uIdx !== -1) {
        users[uIdx].status = 'Online';
        await writeJson('users', users);
      }
    } catch (e) {}

    res.json({
      success: true,
      message: 'Safety confirmation recorded! Safe zone status reset to ACTIVE.',
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Pause, Resume, or End Safe Zone Trip
 */
export const updateSafeZoneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'PAUSE' | 'RESUME' | 'COMPLETE'
    const trips = await readJson('trips');
    const tripIndex = trips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return res.status(404).json({ success: false, message: 'Safe zone trip not found.' });
    }

    const trip = trips[tripIndex];
    const now = new Date().toISOString();
    let newStatus = trip.status;

    if (action === 'PAUSE') {
      newStatus = 'PAUSED';
    } else if (action === 'RESUME') {
      newStatus = trip.hasEnteredZone ? 'ACTIVE' : 'APPROACHING';
      trip.consecutiveOutsideCount = 0;
    } else if (action === 'COMPLETE') {
      newStatus = 'COMPLETED';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be PAUSE, RESUME, or COMPLETE.' });
    }

    trip.status = newStatus;
    trip.updatedAt = now;

    if (!trip.history) trip.history = [];
    trip.history.unshift({
      timestamp: now,
      event: `STATUS_${action}`,
      status: newStatus,
      note: `Safe Travel Zone monitoring set to ${newStatus} by ${req.user?.name || req.admin?.name || 'User'}`
    });

    trips[tripIndex] = trip;
    await writeJson('trips', trips);

    res.json({
      success: true,
      message: `Safe Travel Zone status changed to ${newStatus}`,
      trip
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Get All Safe Zone Trips for Admin Dashboard
 */
export const getAllSafeZones = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let trips = await readJson('trips');

    // Filter to trips that have safe zone destination coordinates
    let safeZones = trips.filter(t => t.destinationCoords && t.destinationCoords.lat != null);

    if (status && status !== 'All') {
      safeZones = safeZones.filter(t => (t.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      safeZones = safeZones.filter(t =>
        (t.destination || '').toLowerCase().includes(q) ||
        (t.userName || '').toLowerCase().includes(q) ||
        (t.userId || '').toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: safeZones.length,
      safeZones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Get All Active Geofence Breach Incidents
 */
export const getGeofenceIncidents = async (req, res, next) => {
  try {
    let incidents = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone), trips(title)')
          .or('state.eq.geofence_breach,message.ilike.%GEOFENCE_BREACH%')
          .order('raised_at', { ascending: false });

        if (!error && data) {
          incidents = data.map(mapAlertFromDb);
        }
      } catch (err) {
        console.warn('[SUPABASE GEOFENCE INCIDENTS ERROR]', err.message);
      }
    }

    if (incidents.length === 0) {
      const localAlerts = await readJson('alerts');
      incidents = localAlerts.filter(a => a.type === 'GEOFENCE_BREACH' || (a.message && a.message.includes('GEOFENCE_BREACH')));
    }

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    next(error);
  }
};

