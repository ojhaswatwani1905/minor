import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

// Get all trips with search and status/geofence filtering
export const getTrips = async (req, res, next) => {
  try {
    let trips = await readJson('trips');

    // Enrich with live trips from Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: dbTrips } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
        if (dbTrips) {
          dbTrips.forEach(dt => {
            const exists = trips.some(t => t.id === dt.id || t.supabaseTripId === dt.id);
            if (!exists) {
              let extractedUserName = 'Active Traveller';
              if (dt.title) {
                const match = dt.title.match(/\(([^)]+)\)/);
                if (match) extractedUserName = match[1].trim();
              }
              trips.unshift({
                id: dt.id,
                supabaseTripId: dt.id,
                userId: dt.user_id,
                userName: extractedUserName,
                destination: dt.title || 'Emergency Safe Corridor',
                route: dt.title || 'Designated Corridors',
                startDate: dt.start_at || new Date().toISOString(),
                expectedArrival: 'Active Corridor',
                expectedArrivalDeadline: dt.end_at || new Date().toISOString(),
                boundaryRadiusKm: (dt.buffer_m || 500) / 1000,
                status: dt.current_state === 'sos' ? 'Emergency' : (dt.status || 'Active'),
                deadManSwitchTriggered: false,
                geofenceViolated: dt.current_state === 'sos',
                guardianPhone: '+91 98765 43210',
                groupSize: 1
              });
            }
          });
        }
      } catch (e) {
        console.warn('[SUPABASE GET TRIPS NOTE]', e.message);
      }
    }
    const { search, status, geofence } = req.query;

    if (search) {
      const q = search.toLowerCase();
      trips = trips.filter(t =>
        t.destination.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      trips = trips.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    if (geofence && geofence !== 'All') {
      if (geofence === 'Violated') {
        trips = trips.filter(t => t.geofenceViolated === true);
      } else if (geofence === 'Safe') {
        trips = trips.filter(t => !t.geofenceViolated);
      }
    }

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

// Get single trip by ID with attached tourist & guardian info
export const getTripById = async (req, res, next) => {
  try {
    const trips = await readJson('trips');
    const trip = trips.find(t => t.id === req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    // Attach tourist & guardian info with strict identity resolution
    const users = await readJson('users');
    let user = users.find(u => u.id === trip.userId);

    if (trip.userName && trip.userName !== 'Active Traveller') {
      const nameMatch = users.find(u => u.fullName && u.fullName.toLowerCase().trim() === trip.userName.toLowerCase().trim());
      if (nameMatch) {
        user = nameMatch;
      } else if (user && user.fullName && user.fullName.toLowerCase().trim() !== trip.userName.toLowerCase().trim()) {
        // User matched by ID belongs to another tourist; do not substitute that user's email
        user = {
          id: trip.userId || 'usr_unassigned',
          fullName: trip.userName,
          email: null,
          phone: trip.guardianPhone || null
        };
      }
    }

    // Attach alerts for this trip
    const alerts = await readJson('alerts');
    const tripAlerts = alerts.filter(a => a.tripId === trip.id);

    res.json({
      success: true,
      trip: {
        ...trip,
        user: user || null,
        alerts: tripAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new trip & sync tourist starting location with Dead Man's Switch timer
export const createTrip = async (req, res, next) => {
  try {
    const { userId, userName, destination, route, startLocation, expectedArrival, expectedArrivalDeadline, boundaryRadiusKm, guardianName, guardianPhone, guardianEmail, notes, checkpoints } = req.body;

    if (!destination || !route) {
      return res.status(400).json({ success: false, message: 'Destination and Route path are required' });
    }

    const trips = await readJson('trips');
    const users = await readJson('users');

    const displayName = userName || 'Priya Nair';
    const targetUserId = userId || 'usr_102';
    const startPoint = startLocation || route.split('->')[0]?.trim() || 'Manali Base Camp';

    // Calculate default ISO deadline (e.g. 4 hours from now) if not provided
    const defaultDeadline = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    const newTrip = {
      id: `trp_${Date.now()}`,
      userId: targetUserId,
      userName: displayName,
      destination,
      route,
      startDate: new Date().toISOString(),
      expectedArrival: expectedArrival || 'Today, 18:00',
      expectedArrivalDeadline: expectedArrivalDeadline || defaultDeadline,
      boundaryRadiusKm: parseFloat(boundaryRadiusKm) || 5.0,
      status: 'Active',
      deadManSwitchTriggered: false,
      geofenceViolated: false,
      guardianPhone: guardianPhone || '+91 98765 43210',
      guardianEmail: guardianEmail || null,
      lastCheckIn: new Date().toISOString(),
      checkpoints: checkpoints || [
        { name: startPoint, status: 'Passed', time: new Date().toISOString() },
        { name: 'Midway Waypoint', status: 'In Progress', time: new Date().toISOString() },
        { name: destination, status: 'Pending', time: null }
      ]
    };

    trips.unshift(newTrip);
    await writeJson('trips', trips);

    // Sync tourist starting location and active trip in users.json
    const userIndex = users.findIndex(u => u.id === targetUserId || u.fullName === displayName);
    if (userIndex !== -1) {
      users[userIndex].activeTripId = newTrip.id;
      users[userIndex].currentLocation = {
        name: startPoint,
        lat: 24.6467,
        lng: 77.3117,
        elevation: '420 m'
      };
      if (guardianPhone) {
        users[userIndex].guardians = [{ name: guardianName || 'Primary Guardian', phone: guardianPhone, relationship: 'Guardian Emergency Contact' }];
      }
      await writeJson('users', users);
    }

    res.status(201).json({
      success: true,
      message: "Expedition trip & Dead Man's Switch deadline registered successfully!",
      trip: newTrip
    });
  } catch (error) {
    next(error);
  }
};

// Safe Check-In endpoint for Dead Man's Switch
export const safeCheckIn = async (req, res, next) => {
  try {
    const trips = await readJson('trips');
    const index = trips.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    const now = new Date().toISOString();
    trips[index].lastCheckIn = now;
    trips[index].status = 'Safe Check-In';
    trips[index].deadManSwitchTriggered = false;

    // Push check-in checkpoint
    if (!trips[index].checkpoints) trips[index].checkpoints = [];
    trips[index].checkpoints.push({
      name: 'User Manual Safe Check-In',
      status: 'Verified',
      time: now
    });

    await writeJson('trips', trips);

    res.json({
      success: true,
      message: "Safe check-in confirmed! Dead Man's Switch timer reset.",
      trip: trips[index]
    });
  } catch (error) {
    next(error);
  }
};

// Extend arrival deadline endpoint for Dead Man's Switch
export const extendDeadline = async (req, res, next) => {
  try {
    const { additionalMinutes, newDeadline } = req.body;
    const trips = await readJson('trips');
    const index = trips.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    let updatedDeadline;
    if (newDeadline) {
      updatedDeadline = new Date(newDeadline).toISOString();
    } else {
      const minutesToAdd = parseInt(additionalMinutes) || 60;
      const currentDeadline = new Date(trips[index].expectedArrivalDeadline || Date.now());
      updatedDeadline = new Date(currentDeadline.getTime() + minutesToAdd * 60000).toISOString();
    }

    trips[index].expectedArrivalDeadline = updatedDeadline;
    trips[index].status = 'Active'; // Resume active status if it was unchecked
    trips[index].deadManSwitchTriggered = false;

    await writeJson('trips', trips);

    res.json({
      success: true,
      message: `Expected arrival deadline extended to ${new Date(updatedDeadline).toLocaleTimeString()}`,
      trip: trips[index]
    });
  } catch (error) {
    next(error);
  }
};


// Update trip
export const updateTrip = async (req, res, next) => {
  try {
    const trips = await readJson('trips');
    const index = trips.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    const updatedTrip = {
      ...trips[index],
      ...req.body
    };

    trips[index] = updatedTrip;
    await writeJson('trips', trips);

    res.json({
      success: true,
      message: 'Trip details updated successfully',
      trip: updatedTrip
    });
  } catch (error) {
    next(error);
  }
};

// Delete trip
export const deleteTrip = async (req, res, next) => {
  try {
    let trips = await readJson('trips');
    const trip = trips.find(t => t.id === req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    trips = trips.filter(t => t.id !== req.params.id);
    await writeJson('trips', trips);

    res.json({
      success: true,
      message: `Trip ${trip.destination} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Add checkpoint to trip timeline
export const addCheckpoint = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const trips = await readJson('trips');
    const index = trips.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expedition trip not found' });
    }

    const newCheckpoint = {
      name: name || 'Intermediate Safety Checkpoint',
      status: status || 'Passed',
      time: new Date().toISOString()
    };

    if (!trips[index].checkpoints) {
      trips[index].checkpoints = [];
    }

    trips[index].checkpoints.push(newCheckpoint);
    await writeJson('trips', trips);

    res.json({
      success: true,
      message: 'Checkpoint added to trip timeline',
      trip: trips[index]
    });
  } catch (error) {
    next(error);
  }
};

