import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

// Get all users with search, status, and battery filtering
export const getUsers = async (req, res, next) => {
  try {
    let users = await readJson('users');

    // Also fetch live registered profiles & alerts from Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const admins = await readJson('admins');

        const [profileRes, alertRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('alerts').select('*').order('raised_at', { ascending: false })
        ]);

        const profiles = profileRes.data || [];
        const alerts = alertRes.data || [];

        profiles.forEach(p => {
          const existingIndex = users.findIndex(u => u.id === p.id || (p.phone && u.phone === p.phone));
          if (existingIndex === -1) {
            users.push({
              id: p.id,
              fullName: p.full_name || 'Active Traveller',
              email: p.email || 'N/A',
              phone: p.phone || 'N/A',
              emergencyContact: 'N/A',
              status: 'Offline',
              currentLocation: null,
              batteryLevel: null,
              networkSignal: 'No GPS Fix (Offline)',
              offlineDurationMinutes: 10,
              guardians: [],
              documents: [],
              activeTripId: null,
              source: 'Supabase'
            });
          } else {
            if (p.full_name) users[existingIndex].fullName = p.full_name;
            if (p.phone) users[existingIndex].phone = p.phone;
          }
        });

        // Enrich with real SOS alerts data
        alerts.forEach(a => {
          let lat = a.lat != null ? parseFloat(a.lat) : null;
          let lng = a.lon != null ? parseFloat(a.lon) : null;
          if ((lat == null || lng == null) && a.location?.coordinates) {
            lng = parseFloat(a.location.coordinates[0]);
            lat = parseFloat(a.location.coordinates[1]);
          }

          let extractedName = null;
          if (a.message) {
            const m = a.message.match(/by\s+([^!]+)/i);
            if (m) extractedName = m[1].trim();
          }

          const matchedAdmin = admins.find(adm => adm.name && extractedName && adm.name.toLowerCase() === extractedName.toLowerCase());

          const uIdx = users.findIndex(u => 
            u.id === a.user_id || 
            (extractedName && u.fullName && u.fullName.toLowerCase() === extractedName.toLowerCase())
          );

          const isOpen = a.status === 'open' || a.status === 'acknowledged' || a.status === 'dispatched';

          if (uIdx !== -1) {
            if (extractedName && users[uIdx].fullName === 'Active Traveller') {
              users[uIdx].fullName = extractedName;
            }
            if (matchedAdmin && (!users[uIdx].email || users[uIdx].email === 'N/A')) {
              users[uIdx].email = matchedAdmin.email;
            }
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
                lng
              };
            }
          }
        });
      } catch (e) {
        console.error('[SUPABASE GET USERS ERROR]', e.message);
      }
    }

    // Active status evaluation: If user is not getting GPS location (missing coords or ping timed out), mark as Offline
    const now = Date.now();
    const GPS_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity threshold

    users = users.map(u => {
      const hasGps = Boolean(
        u.currentLocation &&
        u.currentLocation.lat != null &&
        u.currentLocation.lng != null &&
        !isNaN(u.currentLocation.lat) &&
        !isNaN(u.currentLocation.lng)
      );

      const lastPingTime = u.lastPing ? new Date(u.lastPing).getTime() : 0;
      // Allow up to 24 hours window for active demo & real tourist field tracking
      const isFresh = lastPingTime > 0 && (now - lastPingTime) <= (24 * 60 * 60 * 1000);

      // Active SOS emergencies stay as EMERGENCY
      if (u.status === 'EMERGENCY') {
        return {
          ...u,
          offlineDurationMinutes: 0
        };
      }

      // If user has verified, monitored, or online status with valid coordinates, keep active
      if (hasGps && (u.status === 'Verified' || u.status === 'Monitored' || u.status === 'Online' || isFresh)) {
        return {
          ...u,
          status: u.status || 'Online',
          networkSignal: u.networkSignal && !u.networkSignal.includes('Offline') ? u.networkSignal : 'Connected (GNSS Active)',
          offlineDurationMinutes: 0
        };
      }

      // If user is truly offline (no GPS coords)
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

    const { search, status, battery } = req.query;

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.documents && u.documents.some(d => d.number && d.number.toLowerCase().includes(q)))
      );
    }

    if (status && status !== 'All') {
      users = users.filter(u => u.status.toLowerCase() === status.toLowerCase());
    }

    if (battery) {
      if (battery === 'Low') {
        users = users.filter(u => u.batteryLevel < 20);
      } else if (battery === 'Normal') {
        users = users.filter(u => u.batteryLevel >= 20);
      }
    }

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// Get single user details by ID with guardians & trip history
export const getUserById = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist profile not found' });
    }

    // Attach trip history from trips.json
    const trips = await readJson('trips');
    const userTrips = trips.filter(t => t.userId === user.id);

    // Attach alert history from alerts.json
    const alerts = await readJson('alerts');
    const userAlerts = alerts.filter(a => a.userId === user.id);

    res.json({
      success: true,
      user: {
        ...user,
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
    const users = await readJson('users');
    const index = users.findIndex(u => u.id === req.params.id);

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
    let users = await readJson('users');
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist profile not found' });
    }

    users = users.filter(u => u.id !== req.params.id);
    await writeJson('users', users);

    res.json({
      success: true,
      message: `Tourist ${user.fullName} deleted successfully from system`
    });
  } catch (error) {
    next(error);
  }
};
