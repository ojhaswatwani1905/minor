import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient, mapAlertFromDb } from '../database/supabase.js';

// Haversine formula to compute geodesic distance in meters
export const calculateHaversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Compass heading bearing calculation
export const calculateBearingCompass = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return directions[Math.round(brng / 45)];
};

export const getLiveLocations = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const trips = await readJson('trips');
    const localAlerts = await readJson('alerts');
    const admins = await readJson('admins');

    let combinedUsers = [...users];

    // Fetch live alerts & registered profiles from Supabase if configured
    let supabaseAlerts = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        
        // 1. Fetch all alerts from Supabase
        const { data: dbAlerts, error: alertError } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone), trips(title)')
          .order('raised_at', { ascending: false });

        if (!alertError && dbAlerts) {
          supabaseAlerts = dbAlerts;
        }

        // 2. Fetch profiles & auth users from Supabase
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        const supabaseAuthEmailMap = {};
        try {
          if (supabase.auth?.admin?.listUsers) {
            const { data: authData } = await supabase.auth.admin.listUsers();
            if (authData?.users) {
              authData.users.forEach(u => {
                if (u.id && u.email) {
                  supabaseAuthEmailMap[u.id] = u.email;
                }
              });
            }
          }
        } catch (e) {}

        if (!profileError && profiles) {
          profiles.forEach((p) => {
            const exists = combinedUsers.some((u) => u.id === p.id);
            const authoritativeEmail = supabaseAuthEmailMap[p.id] || null;
            if (!exists) {
              combinedUsers.push({
                id: p.id,
                fullName: p.full_name || 'Active Traveller',
                email: authoritativeEmail,
                phone: p.phone || '',
                status: 'Offline',
                currentLocation: null,
                batteryLevel: null,
                networkSignal: 'No GPS Fix (Offline)',
                offlineDurationMinutes: 10,
                guardians: [],
                documents: [],
                activeTripId: null
              });
            } else {
              const idx = combinedUsers.findIndex(u => u.id === p.id);
              if (idx !== -1 && authoritativeEmail) {
                combinedUsers[idx].email = authoritativeEmail;
              }
            }
          });
        }
      } catch (err) {
        console.error('[SUPABASE MONITORING SYNC ERROR]', err.message);
      }
    }

    // Process all live Supabase alerts and merge into live tourist telemetry
    supabaseAlerts.forEach((a) => {
      // Parse coordinates (supports PostGIS Point or direct lat/lon columns)
      let lat = a.lat != null ? parseFloat(a.lat) : null;
      let lng = a.lon != null ? parseFloat(a.lon) : null;
      if ((lat == null || lng == null) && a.location?.coordinates) {
        lng = parseFloat(a.location.coordinates[0]);
        lat = parseFloat(a.location.coordinates[1]);
      }

      const isOpen = a.status === 'open' || a.status === 'acknowledged' || a.status === 'dispatched';
      
      // Determine tourist name from profile, alert message or matching admin
      let extractedName = (a.profiles?.full_name && a.profiles.full_name !== 'Active Traveller') ? a.profiles.full_name : null;
      if (!extractedName && a.message) {
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
      if (!extractedName) {
        extractedName = 'Active Traveller';
      }

      // Find matching user record by exact name first to prevent multi-user collision
      let matchedIdx = -1;
      if (extractedName && extractedName !== 'Active Traveller') {
        matchedIdx = combinedUsers.findIndex((u) => u.fullName && u.fullName.toLowerCase().trim() === extractedName.toLowerCase().trim());
      }
      if (matchedIdx === -1 && a.user_id) {
        matchedIdx = combinedUsers.findIndex((u) => u.id === a.user_id && (!u.fullName || u.fullName === 'Active Traveller'));
      }

      if (matchedIdx !== -1) {
        // Update existing record
        if (extractedName && combinedUsers[matchedIdx].fullName === 'Active Traveller') {
          combinedUsers[matchedIdx].fullName = extractedName;
        }

        if (isOpen) {
          combinedUsers[matchedIdx].status = 'EMERGENCY';
          combinedUsers[matchedIdx].activeAlertsCount = (combinedUsers[matchedIdx].activeAlertsCount || 0) + 1;
          if (lat != null && lng != null) {
            combinedUsers[matchedIdx].currentLocation = {
              name: `🚨 SOS Distress: ${extractedName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng
            };
          }
          if (a.battery != null) {
            combinedUsers[matchedIdx].batteryLevel = a.battery;
          }
          combinedUsers[matchedIdx].activeAlert = {
            id: a.id,
            status: a.status === 'open' ? 'Pending' : a.status,
            message: a.message,
            priority: 'CRITICAL',
            battery: a.battery,
            lat,
            lng,
            raisedAt: a.raised_at
          };
        } else if (!combinedUsers[matchedIdx].currentLocation && lat != null && lng != null) {
          // If resolved, still provide last known GPS if none set
          combinedUsers[matchedIdx].currentLocation = {
            name: `Last Known Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng
          };
          if (a.battery != null) {
            combinedUsers[matchedIdx].batteryLevel = a.battery;
          }
        }
      } else {
        // Create new tourist entry from live alert
        const uniqueId = `usr_${extractedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const newTourist = {
          id: uniqueId,
          fullName: extractedName,
          email: null,
          phone: a.profiles?.phone || '',
          status: isOpen ? 'EMERGENCY' : 'Online',
          batteryLevel: a.battery ?? null,
          networkSignal: 'Mobile GNSS (Distress Beacon)',
          offlineDurationMinutes: 0,
          currentLocation: (lat != null && lng != null) ? {
            name: isOpen ? `🚨 SOS Distress: ${extractedName} (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng
          } : null,
          speedKmH: 0,
          headingDirection: 'Distress Beacon',
          guardians: [],
          activeTrip: { title: a.trips?.title || 'Emergency SAR Operation' },
          activeAlertsCount: isOpen ? 1 : 0,
          activeAlert: isOpen ? {
            id: a.id,
            status: a.status === 'open' ? 'Pending' : a.status,
            message: a.message,
            priority: 'CRITICAL',
            battery: a.battery,
            lat,
            lng,
            raisedAt: a.raised_at
          } : null,
          lastPing: a.updated_at || a.raised_at
        };

        if (isOpen) {
          combinedUsers.unshift(newTourist);
        } else {
          combinedUsers.push(newTourist);
        }
      }
    });

    const now = Date.now();
    const GPS_TIMEOUT_MS = 5 * 60 * 1000;

    const liveData = combinedUsers.map((user) => {
      const activeTrip = trips.find(t => t.userId === user.id) || user.activeTrip;
      const userAlerts = localAlerts.filter(a => a.userId === user.id && (a.status === 'Active Rescue' || a.status === 'Under Monitoring' || a.status === 'Pending'));

      const hasGps = Boolean(
        user.currentLocation &&
        user.currentLocation.lat != null &&
        user.currentLocation.lng != null &&
        !isNaN(user.currentLocation.lat) &&
        !isNaN(user.currentLocation.lng)
      );

      const lastPingTime = user.lastPing ? new Date(user.lastPing).getTime() : 0;
      const isFresh = lastPingTime > 0 && (now - lastPingTime) <= GPS_TIMEOUT_MS;

      let effectiveStatus = user.status;
      let offlineMins = user.offlineDurationMinutes || 0;

      if (user.status === 'EMERGENCY' || user.activeAlertsCount > 0) {
        effectiveStatus = 'EMERGENCY';
        offlineMins = 0;
      } else if (!hasGps || !isFresh) {
        // Not active / not getting GPS location -> marked as Offline
        effectiveStatus = 'Offline';
        offlineMins = lastPingTime > 0 
          ? Math.max(1, Math.floor((now - lastPingTime) / 60000))
          : (user.offlineDurationMinutes || 15);
      } else {
        effectiveStatus = 'Online';
        offlineMins = 0;
      }

      let finalSpeed = (user.speedKmH !== null && user.speedKmH !== undefined && !isNaN(parseFloat(user.speedKmH))) 
        ? parseFloat(user.speedKmH) 
        : null;
      let speedStatus = 'Calculating...';

      if (!hasGps) {
        finalSpeed = null;
        speedStatus = 'GPS unavailable';
      } else if (!isFresh) {
        finalSpeed = null;
        speedStatus = 'Stale location';
      } else if (finalSpeed !== null) {
        speedStatus = finalSpeed <= 0.2 ? '0 km/h' : `${finalSpeed} km/h`;
      } else if (user.movementHistory && user.movementHistory.length >= 2) {
        finalSpeed = 0.0;
        speedStatus = '0 km/h';
      } else {
        finalSpeed = null;
        speedStatus = 'Calculating...';
      }

      return {
        id: user.id,
        fullName: user.fullName || user.name || 'Registered Traveller',
        email: user.email,
        phone: user.phone || '',
        status: effectiveStatus,
        batteryLevel: user.batteryLevel ?? null,
        networkSignal: effectiveStatus === 'Offline' 
          ? (hasGps ? 'GPS Signal Stale' : 'No GPS Fix (Offline)') 
          : (user.networkSignal || 'Good (GNSS Active)'),
        offlineDurationMinutes: offlineMins,
        location: user.currentLocation || null,
        speedKmH: finalSpeed,
        speedStatus,
        headingDirection: (finalSpeed && finalSpeed > 1.0) ? (user.headingDirection || 'Moving') : 'Stationary',
        guardians: user.guardians || [],
        activeTrip: activeTrip || null,
        activeAlertsCount: (user.activeAlertsCount || 0) + userAlerts.length,
        activeAlert: user.activeAlert || null,
        lastPing: user.lastPing || null
      };
    });

    // Sort live tourists: Emergency and active alerts first, then active GPS
    liveData.sort((a, b) => {
      const aIsEm = a.status === 'EMERGENCY' || a.activeAlertsCount > 0;
      const bIsEm = b.status === 'EMERGENCY' || b.activeAlertsCount > 0;
      if (aIsEm && !bIsEm) return -1;
      if (!aIsEm && bIsEm) return 1;
      return 0;
    });

    res.json({
      success: true,
      count: liveData.length,
      locations: liveData
    });
  } catch (error) {
    next(error);
  }
};

export const getMovementHistory = async (req, res, next) => {
  try {
    const users = await readJson('users');
    let user = users.find(u => u.id === req.params.id);

    // If not in local json, check Supabase
    if (!user && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: dbAlerts } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone)')
          .or(`user_id.eq.${req.params.id},id.eq.${req.params.id}`)
          .order('raised_at', { ascending: false });

        if (dbAlerts && dbAlerts.length > 0) {
          const a = dbAlerts[0];
          let lat = a.lat != null ? parseFloat(a.lat) : (a.location?.coordinates ? parseFloat(a.location.coordinates[1]) : null);
          let lng = a.lon != null ? parseFloat(a.lon) : (a.location?.coordinates ? parseFloat(a.location.coordinates[0]) : null);
          let extractedName = a.profiles?.full_name;
          if (!extractedName && a.message) {
            const m = a.message.match(/by\s+([^!]+)/i);
            if (m) extractedName = m[1].trim();
          }

          user = {
            id: req.params.id,
            fullName: extractedName || 'Active Traveller',
            status: a.status === 'open' ? 'EMERGENCY' : 'Online',
            currentLocation: (lat != null && lng != null) ? { name: 'Emergency Distress Site', lat, lng } : null,
            batteryLevel: a.battery ?? null,
            lastPing: a.updated_at || a.raised_at
          };
        }
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist not found' });
    }

    const history = user.movementHistory || (user.currentLocation ? [
      {
        timestamp: user.lastPing || new Date().toISOString(),
        locationName: user.currentLocation?.name || 'Latest GPS Fix',
        lat: user.currentLocation.lat,
        lng: user.currentLocation.lng,
        elevation: user.currentLocation?.elevation || null,
        speedKmH: user.speedKmH ?? null,
        battery: user.batteryLevel ?? null
      }
    ] : []);

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        status: user.status
      },
      movementHistory: history
    });
  } catch (error) {
    next(error);
  }
};

// Update Tourist GPS Location & Telemetry from Mobile App
export const updateLocation = async (req, res, next) => {
  try {
    const { userId, email, name, fullName, phone, lat, lng, locationName, speedKmH, batteryLevel, networkSignal, accuracy, timestamp } = req.body;
    const users = await readJson('users');

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const emailPrefix = cleanEmail ? cleanEmail.split('@')[0] : '';
    const searchName = (name || fullName || '').toLowerCase().trim();

    let userIndex = users.findIndex(u => {
      if (userId && u.id === userId) return true;
      if (req.user?.id && u.id === req.user.id) return true;
      if (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail) return true;
      if (req.user?.email && u.email && u.email.toLowerCase().trim() === req.user.email.toLowerCase().trim()) return true;
      if (phone && u.phone && u.phone.replace(/\D/g, '') === String(phone).replace(/\D/g, '')) return true;
      if (emailPrefix && u.email && u.email.toLowerCase().startsWith(emailPrefix + '@')) return true;
      if (searchName && u.fullName && u.fullName.toLowerCase().trim() === searchName) return true;
      return false;
    });

    const parsedLat = lat != null ? parseFloat(lat) : null;
    const parsedLng = lng != null ? parseFloat(lng) : null;
    const hasValidCoords = parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng);
    const parsedBattery = batteryLevel != null && !isNaN(parseInt(batteryLevel)) 
      ? Math.max(0, Math.min(100, parseInt(batteryLevel))) 
      : null;

    const currentTimeMs = timestamp ? new Date(timestamp).getTime() : Date.now();
    const currentIso = new Date(currentTimeMs).toISOString();

    let computedSpeed = null;
    let heading = 'Stationary';

    if (userIndex !== -1) {
      if (hasValidCoords) {
        const prevLoc = users[userIndex].currentLocation;
        const prevPing = users[userIndex].lastPing ? new Date(users[userIndex].lastPing).getTime() : 0;
        const elapsedSeconds = prevPing > 0 ? (currentTimeMs - prevPing) / 1000 : 0;

        // Filter inaccurate GPS readings (accuracy > 50m)
        const isAccurate = accuracy == null || parseFloat(accuracy) <= 50;

        if (isAccurate && prevLoc && prevLoc.lat != null && prevLoc.lng != null && elapsedSeconds > 0 && elapsedSeconds <= 3600) {
          const distMeters = calculateHaversineMeters(prevLoc.lat, prevLoc.lng, parsedLat, parsedLng);

          if (distMeters < 2.0) {
            // Stationary established (GPS jitter while standing still)
            computedSpeed = 0.0;
            heading = 'Stationary';
          } else {
            // Derived Speed (km/h) = (Distance (meters) / Elapsed time (seconds)) * 3.6
            const rawSpeed = (distMeters / elapsedSeconds) * 3.6;

            // Reject impossible jumps & noisy speed spikes (> 250 km/h)
            if (rawSpeed > 250) {
              console.warn(`[TELEMETRY] Rejected impossible GPS jump: ${rawSpeed.toFixed(1)} km/h over ${distMeters.toFixed(1)}m`);
              computedSpeed = users[userIndex].speedKmH ?? null;
            } else {
              computedSpeed = parseFloat(rawSpeed.toFixed(1));
              heading = calculateBearingCompass(prevLoc.lat, prevLoc.lng, parsedLat, parsedLng);
            }
          }
        }

        // Check if device supplied a reliable positive hardware speed reading
        const deviceSpeedNum = speedKmH !== undefined && speedKmH !== null && !isNaN(parseFloat(speedKmH)) ? parseFloat(speedKmH) : null;
        if (deviceSpeedNum !== null && deviceSpeedNum >= 0) {
          if (computedSpeed === null || deviceSpeedNum > 0) {
            computedSpeed = parseFloat(deviceSpeedNum.toFixed(1));
          }
        }

        if (computedSpeed !== null && computedSpeed <= 0.2) {
          computedSpeed = 0.0;
          heading = 'Stationary';
        }

        users[userIndex].currentLocation = {
          name: locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
          lat: parsedLat,
          lng: parsedLng,
          elevation: req.body.elevation || users[userIndex].currentLocation?.elevation || null
        };
        if (users[userIndex].status !== 'EMERGENCY') {
          users[userIndex].status = 'Online';
        }
        users[userIndex].networkSignal = networkSignal || 'Mobile GNSS (Online)';
        users[userIndex].offlineDurationMinutes = 0;
        users[userIndex].speedKmH = computedSpeed;
        users[userIndex].headingDirection = heading;
        users[userIndex].lastPing = currentIso;

        if (!users[userIndex].movementHistory) {
          users[userIndex].movementHistory = [];
        }
        users[userIndex].movementHistory.push({
          timestamp: currentIso,
          locationName: locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
          lat: parsedLat,
          lng: parsedLng,
          elevation: req.body.elevation || null,
          speedKmH: computedSpeed,
          headingDirection: heading,
          battery: parsedBattery
        });
        if (users[userIndex].movementHistory.length > 50) {
          users[userIndex].movementHistory.shift();
        }
      } else {
        // Not active / not getting GPS location -> marked as Offline
        if (users[userIndex].status !== 'EMERGENCY') {
          users[userIndex].status = 'Offline';
        }
        users[userIndex].networkSignal = 'No GPS Fix (Offline)';
        users[userIndex].offlineDurationMinutes = Math.max(1, users[userIndex].offlineDurationMinutes || 1);
        users[userIndex].speedKmH = null;
        users[userIndex].headingDirection = 'Stationary';
      }

      if (parsedBattery !== null) {
        users[userIndex].batteryLevel = parsedBattery;
      }

      await writeJson('users', users);
    } else {
      // If user not in users.json yet, check admins.json or create new entry
      const admins = await readJson('admins');
      const matchedAdmin = admins.find(a => 
        (userId && a.id === userId) ||
        (cleanEmail && a.email && a.email.toLowerCase().trim() === cleanEmail) ||
        (emailPrefix && a.email && a.email.toLowerCase().startsWith(emailPrefix + '@')) ||
        (searchName && a.name && a.name.toLowerCase().trim() === searchName)
      );

      const targetId = userId || matchedAdmin?.id || `usr_${Date.now()}`;
      const targetName = name || fullName || matchedAdmin?.name || 'Mobile Explorer';
      const targetEmail = cleanEmail || matchedAdmin?.email || null;

      const deviceSpeedNum = speedKmH !== undefined && speedKmH !== null && !isNaN(parseFloat(speedKmH)) ? parseFloat(speedKmH) : null;

      const newRecord = {
        id: targetId,
        fullName: targetName,
        email: targetEmail,
        phone: phone || matchedAdmin?.phone || null,
        emergencyContact: phone || null,
        status: hasValidCoords ? 'Online' : 'Offline',
        currentLocation: hasValidCoords ? {
          name: locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
          lat: parsedLat,
          lng: parsedLng,
          elevation: req.body.elevation || null
        } : null,
        batteryLevel: parsedBattery,
        speedKmH: deviceSpeedNum,
        headingDirection: 'Stationary',
        networkSignal: hasValidCoords ? (networkSignal || 'Good (5G)') : 'No GPS Fix (Offline)',
        offlineDurationMinutes: hasValidCoords ? 0 : 5,
        guardians: [],
        documents: [],
        activeTripId: null,
        lastPing: hasValidCoords ? currentIso : null,
        movementHistory: hasValidCoords ? [{
          timestamp: currentIso,
          locationName: locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
          lat: parsedLat,
          lng: parsedLng,
          elevation: req.body.elevation || null,
          speedKmH: deviceSpeedNum,
          headingDirection: 'Stationary',
          battery: parsedBattery
        }] : []
      };

      users.unshift(newRecord);
      await writeJson('users', users);
      userIndex = 0;
    }

    res.json({
      success: true,
      message: 'Real mobile GPS & battery telemetry synced successfully!',
      lastPing: currentIso,
      updatedUserId: users[userIndex]?.id,
      currentLocation: users[userIndex]?.currentLocation,
      speedKmH: users[userIndex]?.speedKmH,
      speedStatus: users[userIndex]?.speedKmH !== null 
        ? (users[userIndex].speedKmH <= 0.2 ? '0 km/h' : `${users[userIndex].speedKmH} km/h`) 
        : 'Calculating...',
      headingDirection: users[userIndex]?.headingDirection,
      batteryLevel: users[userIndex]?.batteryLevel
    });
  } catch (error) {
    next(error);
  }
};
