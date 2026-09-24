import { readJson, writeJson } from '../utils/jsonDb.js';

export const getLiveLocations = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const trips = await readJson('trips');
    const alerts = await readJson('alerts');

    const liveData = users.map((user, idx) => {
      const activeTrip = trips.find(t => t.userId === user.id);
      const userAlerts = alerts.filter(a => a.userId === user.id && (a.status === 'Active Rescue' || a.status === 'Under Monitoring'));

      const speeds = [0, 4.2, 3.8, 0, 5.1];
      const directions = ['NNE 35°', 'NW 315°', 'ENE 65°', 'Stationary', 'NE 45°'];

      return {
        id: user.id,
        fullName: user.fullName || user.name || 'Tourist Explorer',
        email: user.email,
        phone: user.phone || '+91 98765 43210',
        status: user.status || 'Online',
        batteryLevel: user.batteryLevel ?? 100,
        networkSignal: user.networkSignal || 'Good (5G)',
        offlineDurationMinutes: user.offlineDurationMinutes || 0,
        location: user.currentLocation || { name: 'Manali Base Camp (2,050m)', lat: 32.2432, lng: 77.1892, elevation: '2,050 m' },
        speedKmH: user.speedKmH !== undefined ? user.speedKmH : speeds[idx % speeds.length],
        headingDirection: directions[idx % directions.length],
        guardians: user.guardians || [],
        activeTrip: activeTrip || null,
        activeAlertsCount: userAlerts.length,
        lastPing: user.lastPing || new Date().toISOString()
      };
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
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tourist not found' });
    }

    const baseLat = user.currentLocation?.lat || 32.0;
    const baseLng = user.currentLocation?.lng || 77.0;

    const history = [
      {
        timestamp: '2026-07-23T07:30:00.000Z',
        locationName: 'Expedition Base Camp',
        lat: baseLat - 0.04,
        lng: baseLng - 0.04,
        elevation: '2,100 m',
        speedKmH: 2.5,
        battery: 98
      },
      {
        timestamp: '2026-07-23T10:15:00.000Z',
        locationName: 'Midway Ridge Checkpost',
        lat: baseLat - 0.02,
        lng: baseLng - 0.02,
        elevation: '2,950 m',
        speedKmH: 4.1,
        battery: 82
      },
      {
        timestamp: user.lastPing || new Date().toISOString(),
        locationName: user.currentLocation?.name || 'Current Telemetry Marker',
        lat: baseLat,
        lng: baseLng,
        elevation: user.currentLocation?.elevation || '3,400 m',
        speedKmH: user.speedKmH || 3.8,
        battery: user.batteryLevel
      }
    ];

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
    const { userId, email, lat, lng, locationName, speedKmH, batteryLevel, networkSignal } = req.body;
    const users = await readJson('users');

    let userIndex = users.findIndex(u => 
      (userId && u.id === userId) ||
      (email && u.email.toLowerCase() === email.toLowerCase()) ||
      (req.user?.id && u.id === req.user.id) ||
      (req.user?.email && u.email.toLowerCase() === req.user.email.toLowerCase())
    );

    // If no matching ID, update the most recent registered user
    if (userIndex === -1 && users.length > 0) {
      userIndex = 0;
    }

    if (userIndex !== -1) {
      users[userIndex].currentLocation = {
        name: locationName || users[userIndex].currentLocation?.name || 'Rohtang Mountain Pass',
        lat: parseFloat(lat) || 32.3716,
        lng: parseFloat(lng) || 77.2466,
        elevation: users[userIndex].currentLocation?.elevation || '3,400 m'
      };
      if (batteryLevel) users[userIndex].batteryLevel = parseInt(batteryLevel);
      if (speedKmH !== undefined) users[userIndex].speedKmH = parseFloat(speedKmH);
      if (networkSignal) users[userIndex].networkSignal = networkSignal;
      users[userIndex].lastPing = new Date().toISOString();

      await writeJson('users', users);
    }

    res.json({
      success: true,
      message: 'Mobile GPS Location Telemetry Synced!',
      lastPing: new Date().toISOString(),
      updatedUserId: userIndex !== -1 ? users[userIndex].id : null
    });
  } catch (error) {
    next(error);
  }
};
