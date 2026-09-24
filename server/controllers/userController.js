import { readJson, writeJson } from '../utils/jsonDb.js';

// Get all users with search, status, and battery filtering
export const getUsers = async (req, res, next) => {
  try {
    let users = await readJson('users');
    const { search, status, battery } = req.query;

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
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

    const newUser = {
      id: `usr_${Date.now()}`,
      fullName,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone,
      emergencyContact: emergencyContact || phone,
      status: 'Online',
      currentLocation: {
        name: locationName || 'Manali Expedition Base Camp',
        lat: 32.2432,
        lng: 77.1892,
        elevation: '2,050 m'
      },
      batteryLevel: 100,
      networkSignal: 'Good (4G)',
      offlineDurationMinutes: 0,
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
      lastPing: new Date().toISOString()
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

    const updatedUser = {
      ...users[index],
      ...req.body,
      lastPing: new Date().toISOString()
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
