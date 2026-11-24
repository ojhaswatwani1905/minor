import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient, mapAlertFromDb } from '../database/supabase.js';
import { getDestinationImageUrl } from '../utils/destinationImages.js';

/**
 * Helper to fetch, enrich, and sort all tourists from local DB and Supabase.
 * Synchronizes discovered mobile tourists into users.json so every user is persistent
 * and resolvable by ID across all endpoints.
 */
export const fetchEnrichedUsers = async () => {
  let users = await readJson('users');
  let admins = [];
  try {
    admins = await readJson('admins');
  } catch (e) {}

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      // Query profiles, alerts, and authoritative Supabase Auth users
      let authEmailMap = {};
      try {
        if (supabase.auth?.admin?.listUsers) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          if (authData?.users) {
            authData.users.forEach((au) => {
              if (au.id && au.email) {
                authEmailMap[au.id] = au.email.trim();
              }
            });
          }
        }
      } catch (authErr) {
        // Non-fatal if service role auth listing is restricted
      }

      const [profileRes, alertRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').order('raised_at', { ascending: false })
      ]);

      const profiles = profileRes.data || [];
      const alerts = alertRes.data || [];

      // 1. Merge Supabase registered profiles
      profiles.forEach((p) => {
        if (!p.full_name || p.full_name === 'Active Traveller') return;
        const existingIndex = users.findIndex(
          (u) =>
            u.id === p.id ||
            (u.fullName && u.fullName.toLowerCase().trim() === p.full_name.toLowerCase().trim())
        );

        const authoritativeEmail = authEmailMap[p.id] || p.email || null;

        if (existingIndex === -1) {
          const uniqueId = `usr_${p.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          users.push({
            id: p.id && !users.some(u => u.id === p.id) ? p.id : uniqueId,
            fullName: p.full_name,
            email: authoritativeEmail,
            phone: p.phone || null,
            emergencyContact: p.phone || null,
            status: 'Offline',
            currentLocation: null,
            batteryLevel: null,
            networkSignal: 'No GPS Fix (Offline)',
            offlineDurationMinutes: 10,
            guardians: [
              {
                name: `Guardian of ${p.full_name}`,
                relation: 'Family Emergency Contact',
                phone: p.phone || '+91 98765 43210',
                verified: true
              }
            ],
            documents: [
              {
                type: 'Mobile Safety Pass',
                status: 'Verified',
                number: `SP-${p.full_name.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`
              }
            ],
            activeTripId: null,
            avatar: p.medical_info?.avatar_url || null,
            source: 'Supabase'
          });
        } else {
          if (p.id) users[existingIndex].id = p.id;
          if (p.full_name) users[existingIndex].fullName = p.full_name;
          if (authoritativeEmail) users[existingIndex].email = authoritativeEmail;
          if (p.phone) users[existingIndex].phone = p.phone;
          if (p.medical_info?.avatar_url) users[existingIndex].avatar = p.medical_info.avatar_url;
        }
      });

      // 2. Enrich from live emergency & telemetry alerts (newest first)
      alerts.forEach((a) => {
        let lat = a.lat != null ? parseFloat(a.lat) : null;
        let lng = a.lon != null ? parseFloat(a.lon) : null;
        if ((lat == null || lng == null) && a.location?.coordinates) {
          lng = parseFloat(a.location.coordinates[0]);
          lat = parseFloat(a.location.coordinates[1]);
        }

        let extractedName = null;
        if (a.message) {
          const sosMatch = a.message.match(/triggered by\s+([^!]+)/i);
          const breachMatch = a.message.match(/confirmed for\s+([^!]+)/i);
          const byMatch = a.message.match(/by\s+([^!]+)/i);
          const forMatch = a.message.match(/for\s+([^!]+)/i);
          if (sosMatch) extractedName = sosMatch[1].trim();
          else if (breachMatch) extractedName = breachMatch[1].trim();
          else if (byMatch) extractedName = byMatch[1].trim();
          else if (forMatch) extractedName = forMatch[1].trim();
        }

        if (!extractedName && a.trips?.title) {
          const tripMatch = a.trips.title.match(/\(([^)]+)\)/);
          if (tripMatch) extractedName = tripMatch[1].trim();
        }

        if (!extractedName || extractedName === 'Active Traveller' || extractedName === 'Traveller') {
          return;
        }

        const uniqueId = `usr_${extractedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        // Match strictly by exact full name or uniqueId
        let uIdx = users.findIndex(
          (u) =>
            (u.fullName && u.fullName.toLowerCase().trim() === extractedName.toLowerCase().trim()) ||
            u.id === uniqueId
        );

        const isOpen = a.status === 'open' || a.status === 'acknowledged' || a.status === 'dispatched';

        if (uIdx === -1) {
          const newTourist = {
            id: uniqueId,
            fullName: extractedName,
            email: null, // Never invent emails or substitute admin emails for tourists
            phone: null,
            emergencyContact: null,
            status: isOpen ? 'EMERGENCY' : 'Online',
            currentLocation: (lat != null && lng != null) ? {
              name: isOpen ? `🚨 SOS Distress (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng,
              elevation: null
            } : null,
            batteryLevel: a.battery != null ? a.battery : null,
            networkSignal: 'Mobile GNSS (Distress Beacon)',
            offlineDurationMinutes: 0,
            guardians: [
              {
                name: `Guardian of ${extractedName}`,
                relation: 'Family Emergency Contact',
                phone: '+91 98765 43210',
                verified: true
              }
            ],
            documents: [
              {
                type: 'Mobile Safety Pass',
                status: 'Verified',
                number: `SP-${extractedName.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`
              }
            ],
            activeTripId: a.trip_id || null,
            lastAlertTimestamp: a.raised_at,
            lastPing: a.raised_at,
            source: 'Supabase'
          };
          users.unshift(newTourist);
          uIdx = 0;
        } else {
          const alertTime = new Date(a.raised_at || 0).getTime();
          const userAlertTime = new Date(users[uIdx].lastAlertTimestamp || 0).getTime();
          if (alertTime >= userAlertTime) {
            users[uIdx].lastAlertTimestamp = a.raised_at;
            if (isOpen) {
              users[uIdx].status = 'EMERGENCY';
            }
            if (a.battery != null) {
              users[uIdx].batteryLevel = a.battery;
            }
            if (lat != null && lng != null) {
              users[uIdx].currentLocation = {
                name: isOpen ? `🚨 SOS Distress (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat,
                lng,
                elevation: null
              };
            }
            if (a.trip_id) {
              users[uIdx].activeTripId = a.trip_id;
            }
            if (!users[uIdx].guardians || users[uIdx].guardians.length === 0) {
              users[uIdx].guardians = [
                {
                  name: `Guardian of ${users[uIdx].fullName}`,
                  relation: 'Family Emergency Contact',
                  phone: users[uIdx].phone || '+91 98765 43210',
                  verified: true
                }
              ];
            }
            if (!users[uIdx].documents || users[uIdx].documents.length === 0) {
              users[uIdx].documents = [
                {
                  type: 'Mobile Safety Pass',
                  status: 'Verified',
                  number: `SP-${users[uIdx].fullName.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`
                }
              ];
            }
          }
        }
      });
    } catch (e) {
      console.error('[SUPABASE ENRICH USERS ERROR]', e.message);
    }
  }

  // Active status evaluation
  const now = Date.now();
  const GPS_TIMEOUT_MS = 5 * 60 * 1000;

  users = users.map((u) => {
    const hasGps = Boolean(
      u.currentLocation &&
      u.currentLocation.lat != null &&
      u.currentLocation.lng != null &&
      !isNaN(u.currentLocation.lat) &&
      !isNaN(u.currentLocation.lng)
    );

    const lastPingTime = u.lastPing ? new Date(u.lastPing).getTime() : 0;
    const isFresh = lastPingTime > 0 && (now - lastPingTime) <= (24 * 60 * 60 * 1000);

    // Active SOS emergencies stay as EMERGENCY only if fresh (within 24 hours)
    if (u.status === 'EMERGENCY') {
      const alertTime = u.lastAlertTimestamp ? new Date(u.lastAlertTimestamp).getTime() : 0;
      const isAlertFresh = alertTime > 0 && (now - alertTime) <= (24 * 60 * 60 * 1000);
      if (isAlertFresh || isFresh) {
        return {
          ...u,
          offlineDurationMinutes: 0
        };
      }
      return {
        ...u,
        status: hasGps ? 'Monitored' : 'Offline',
        offlineDurationMinutes: hasGps ? 0 : (u.offlineDurationMinutes || 15)
      };
    }

    if (hasGps && (u.status === 'Verified' || u.status === 'Monitored' || u.status === 'Online' || isFresh)) {
      return {
        ...u,
        status: u.status || 'Online',
        networkSignal: u.networkSignal && !u.networkSignal.includes('Offline') ? u.networkSignal : 'Connected (GNSS Active)',
        offlineDurationMinutes: 0
      };
    }

    const offlineMins = lastPingTime > 0
      ? Math.max(1, Math.floor((now - lastPingTime) / 60000))
      : (u.offlineDurationMinutes || 15);

    return {
      ...u,
      status: 'Offline',
      networkSignal: hasGps ? 'GPS Signal Stale' : 'No GPS Fix (Offline)',
      offlineDurationMinutes: offlineMins
    };
  });

  // Sort users: Critical emergency SOS distress beacons FIRST, sorted by latest alert time descending
  users.sort((a, b) => {
    const aIsEm = a.status === 'EMERGENCY' || a.status === 'SOS DISTRESS' || a.status === 'Critical';
    const bIsEm = b.status === 'EMERGENCY' || b.status === 'SOS DISTRESS' || b.status === 'Critical';
    if (aIsEm && !bIsEm) return -1;
    if (!aIsEm && bIsEm) return 1;

    const aTime = new Date(a.lastAlertTimestamp || a.lastPing || a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastAlertTimestamp || b.lastPing || b.updatedAt || b.createdAt || 0).getTime();
    if (aTime !== bTime) return bTime - aTime;

    return 0;
  });

  // Automatically synchronize enriched users into users.json so IDs are 100% persistent
  try {
    await writeJson('users', users);
  } catch (wErr) {}

  return users;
};

// Get all users with search, status, and battery filtering
export const getUsers = async (req, res, next) => {
  try {
    let users = await fetchEnrichedUsers();

    const { search, status, battery } = req.query;

    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.documents && u.documents.some((d) => d.number && d.number.toLowerCase().includes(q)))
      );
    }

    if (status && status !== 'All') {
      users = users.filter((u) => u.status.toLowerCase() === status.toLowerCase());
    }

    if (battery) {
      if (battery === 'Low') {
        users = users.filter((u) => u.batteryLevel != null && u.batteryLevel < 20);
      } else if (battery === 'Normal') {
        users = users.filter((u) => u.batteryLevel == null || u.batteryLevel >= 20);
      }
    }

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// Get single user details by ID with guardians, documents, alerts & trip history
export const getUserById = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const users = await fetchEnrichedUsers();
    const user = users.find(
      (u) =>
        u.id === targetId ||
        (u.fullName && u.fullName.toLowerCase().trim() === targetId.toLowerCase().trim())
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist profile not found' });
    }

    // Attach trip history from trips.json and Supabase trips
    let trips = await readJson('trips');
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: dbTrips } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
        if (dbTrips) {
          dbTrips.forEach((dt) => {
            if (!trips.some((t) => t.id === dt.id)) {
              let extractedName = 'Active Traveller';
              if (dt.title) {
                const match = dt.title.match(/\(([^)]+)\)/);
                if (match) extractedName = match[1].trim();
              }
              trips.push({
                id: dt.id,
                userId: dt.user_id,
                userName: extractedName,
                destination: dt.title || 'Emergency Safe Corridor',
                imageUrl: getDestinationImageUrl(dt.title || 'Emergency Safe Corridor'),
                status: dt.current_state === 'sos' ? 'Emergency' : (dt.status || 'Active'),
                boundaryRadiusKm: (dt.buffer_m || 500) / 1000,
                createdAt: dt.start_at || new Date().toISOString()
              });
            }
          });
        }
      } catch (e) {}
    }

    const userTrips = trips.filter(
      (t) =>
        t.userId === user.id ||
        (t.userName && user.fullName && t.userName.toLowerCase().trim() === user.fullName.toLowerCase().trim()) ||
        (t.destination && user.fullName && t.destination.toLowerCase().includes(user.fullName.toLowerCase().trim())) ||
        (t.title && user.fullName && t.title.toLowerCase().includes(user.fullName.toLowerCase().trim())) ||
        t.id === user.activeTripId
    );

    // Attach alert history from alerts.json and Supabase alerts
    let alerts = await readJson('alerts');
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: dbAlerts } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone), trips(title)')
          .order('raised_at', { ascending: false });
        if (dbAlerts) {
          const mapped = dbAlerts.map(mapAlertFromDb);
          mapped.forEach((ma) => {
            if (!alerts.some((a) => a.id === ma.id)) {
              alerts.push(ma);
            }
          });
        }
      } catch (e) {}
    }

    const userAlerts = alerts.filter(
      (a) =>
        (a.userName && user.fullName && a.userName.toLowerCase().trim() === user.fullName.toLowerCase().trim()) ||
        (a.message && user.fullName && a.message.toLowerCase().includes(user.fullName.toLowerCase().trim())) ||
        (a.userId === user.id && a.userName === user.fullName)
    );

    // Ensure guardians and documents arrays exist for Dossier modal
    const guardians = (user.guardians && user.guardians.length > 0) ? user.guardians : [
      {
        name: `Primary Guardian of ${user.fullName}`,
        relation: 'Family Emergency Contact',
        phone: user.emergencyContact && user.emergencyContact !== 'N/A' ? user.emergencyContact : (user.phone && user.phone !== 'N/A' ? user.phone : '+91 98765 43210'),
        verified: true
      }
    ];

    const documents = (user.documents && user.documents.length > 0) ? user.documents : [
      {
        type: 'Mobile Safety Pass',
        status: 'Verified',
        number: `SP-${user.fullName.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`
      }
    ];

    res.json({
      success: true,
      user: {
        ...user,
        guardians,
        documents,
        trips: userTrips,
        alerts: userAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new tourist user
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, emergencyContact, guardianName, guardianPhone, guardianRelation, documentType, documentNumber, locationName } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Tourist full name and phone number are required' });
    }

    const users = await readJson('users');

    const parsedLat = req.body.lat != null ? parseFloat(req.body.lat) : null;
    const parsedLng = req.body.lng != null ? parseFloat(req.body.lng) : null;
    const hasValidCoords = parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng);

    const newUser = {
      id: `usr_${Date.now()}`,
      fullName,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone,
      emergencyContact: emergencyContact || phone,
      status: hasValidCoords ? 'Online' : 'Offline',
      currentLocation: hasValidCoords ? {
        name: locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
        lat: parsedLat,
        lng: parsedLng,
        elevation: req.body.elevation || null
      } : null,
      batteryLevel: req.body.batteryLevel != null && !isNaN(parseInt(req.body.batteryLevel)) ? parseInt(req.body.batteryLevel) : null,
      networkSignal: hasValidCoords ? (req.body.networkSignal || 'Good (4G)') : 'No GPS Fix (Offline)',
      offlineDurationMinutes: hasValidCoords ? 0 : 5,
      guardians: [
        {
          name: guardianName || 'Primary Guardian',
          relation: guardianRelation || 'Family',
          phone: guardianPhone || emergencyContact || phone,
          verified: true
        }
      ],
      documents: [
        {
          type: documentType || 'Aadhaar Card',
          status: 'Verified',
          number: documentNumber || `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`
        }
      ],
      activeTripId: null,
      lastPing: hasValidCoords ? new Date().toISOString() : null
    };

    users.unshift(newUser);
    await writeJson('users', users);

    res.status(201).json({
      success: true,
      message: 'Tourist registered successfully into safety monitoring system',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

// Update tourist user details
export const updateUser = async (req, res, next) => {
  try {
    const users = await fetchEnrichedUsers();
    const index = users.findIndex((u) => u.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Tourist profile not found' });
    }

    const parsedLat = req.body.lat != null && req.body.lat !== '' ? parseFloat(req.body.lat) : null;
    const parsedLng = req.body.lng != null && req.body.lng !== '' ? parseFloat(req.body.lng) : null;
    const hasValidCoords = parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng);

    let newLocation = users[index].currentLocation;
    if (hasValidCoords) {
      newLocation = {
        name: req.body.locationName || users[index].currentLocation?.name || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
        lat: parsedLat,
        lng: parsedLng,
        elevation: req.body.elevation || users[index].currentLocation?.elevation || null
      };
    } else if (req.body.locationName && users[index].currentLocation) {
      newLocation = {
        ...users[index].currentLocation,
        name: req.body.locationName
      };
    }

    let newBattery = users[index].batteryLevel;
    if (req.body.batteryLevel !== undefined && req.body.batteryLevel !== '') {
      const parsedBat = parseInt(req.body.batteryLevel);
      if (!isNaN(parsedBat)) {
        newBattery = Math.max(0, Math.min(100, parsedBat));
      }
    }

    const hasCoordsNow = Boolean(newLocation && newLocation.lat != null && newLocation.lng != null);

    const updatedUser = {
      ...users[index],
      ...req.body,
      status: users[index].status === 'EMERGENCY' 
        ? 'EMERGENCY' 
        : (req.body.status ? req.body.status : (hasCoordsNow ? 'Online' : 'Offline')),
      networkSignal: hasCoordsNow ? (req.body.networkSignal || users[index].networkSignal || 'Good (4G)') : 'No GPS Fix (Offline)',
      currentLocation: newLocation,
      batteryLevel: newBattery,
      lastPing: hasValidCoords ? new Date().toISOString() : users[index].lastPing
    };

    users[index] = updatedUser;
    await writeJson('users', users);

    res.json({
      success: true,
      message: 'Tourist profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete tourist user
export const deleteUser = async (req, res, next) => {
  try {
    let users = await fetchEnrichedUsers();
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist profile not found' });
    }

    users = users.filter((u) => u.id !== req.params.id);
    await writeJson('users', users);

    res.json({
      success: true,
      message: `Tourist ${user.fullName} deleted successfully from system`
    });
  } catch (error) {
    next(error);
  }
};
