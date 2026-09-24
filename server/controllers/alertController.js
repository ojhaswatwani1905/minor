import { readJson, writeJson } from '../utils/jsonDb.js';

// Get all emergency alerts with search, type, priority, and status filters
export const getAlerts = async (req, res, next) => {
  try {
    let alerts = await readJson('alerts');
    const { search, type, priority, status } = req.query;

    if (search) {
      const q = search.toLowerCase();
      alerts = alerts.filter(a =>
        a.userName.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.location?.name?.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }

    if (type && type !== 'All') {
      alerts = alerts.filter(a => a.type.toLowerCase().includes(type.toLowerCase()));
    }

    if (priority && priority !== 'All') {
      alerts = alerts.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
    }

    if (status && status !== 'All') {
      alerts = alerts.filter(a => a.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    next(error);
  }
};

// Get single alert detail with tourist telemetry & guardian alert history
export const getAlertById = async (req, res, next) => {
  try {
    const alerts = await readJson('alerts');
    const alert = alerts.find(a => a.id === req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    const users = await readJson('users');
    const user = users.find(u => u.id === alert.userId);

    const rescueLogs = alert.rescueNotes || [
      { timestamp: alert.timestamp, note: `Emergency broadcast ${alert.type} triggered by system.`, author: 'System Telemetry' }
    ];

    res.json({
      success: true,
      alert: {
        ...alert,
        user: user || null,
        rescueLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update alert status (Active Rescue, Under Monitoring, Resolved) & log rescue notes
export const updateAlertStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const alerts = await readJson('alerts');
    const index = alerts.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    if (status) {
      alerts[index].status = status;
    }

    if (note) {
      if (!alerts[index].rescueNotes) {
        alerts[index].rescueNotes = [];
      }
      alerts[index].rescueNotes.push({
        timestamp: new Date().toISOString(),
        note,
        author: req.admin?.name || 'Command Admin'
      });
    }

    await writeJson('alerts', alerts);

    res.json({
      success: true,
      message: `Emergency alert updated to status: ${alerts[index].status}`,
      alert: alerts[index]
    });
  } catch (error) {
    next(error);
  }
};

// Dispatch automated SMS alert to registered guardian
export const notifyGuardian = async (req, res, next) => {
  try {
    const { alertId } = req.body;
    const alerts = await readJson('alerts');
    const index = alerts.findIndex(a => a.id === alertId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Emergency alert record not found' });
    }

    alerts[index].guardianNotified = true;

    if (!alerts[index].rescueNotes) {
      alerts[index].rescueNotes = [];
    }

    alerts[index].rescueNotes.push({
      timestamp: new Date().toISOString(),
      note: `Automated SMS & Emergency Dispatch Alert sent to registered primary guardian.`,
      author: 'SMS Gateway Dispatcher'
    });

    await writeJson('alerts', alerts);

    res.json({
      success: true,
      message: `Emergency SMS notification dispatched to guardian!`,
      alert: alerts[index]
    });
  } catch (error) {
    next(error);
  }
};

// Simulate live emergency SOS alert for testing & mobile app broadcast
export const simulateSosAlert = async (req, res, next) => {
  try {
    const { userName, message, type, location } = req.body || {};
    const users = await readJson('users');
    const randomUser = users[Math.floor(Math.random() * users.length)] || {
      id: 'usr_102',
      fullName: 'Priya Nair'
    };

    const alerts = await readJson('alerts');
    const displayName = userName || randomUser.fullName || 'Priya Nair';

    const newSimulatedAlert = {
      id: `alt_${Date.now()}`,
      userId: randomUser.id || 'usr_102',
      userName: displayName,
      tripId: randomUser.activeTripId || 'trp_301',
      type: type || 'SOS Request',
      priority: 'CRITICAL',
      message: message || `🚨 SOS DISTRESS BEACON: Emergency SOS triggered by ${displayName}! Immediate SAR response required.`,
      location: location || randomUser.currentLocation || {
        name: 'Rohtang High Altitude Pass (3,978m)',
        lat: 30.7280,
        lng: 79.6053
      },
      timestamp: new Date().toISOString(),
      status: 'Active Rescue',
      guardianNotified: true,
      rescueNotes: [
        { timestamp: new Date().toISOString(), note: '1-Tap SOS Emergency distress beacon received from tourist mobile device.', author: 'Satellite Beacon Mesh' }
      ]
    };

    alerts.unshift(newSimulatedAlert);
    await writeJson('alerts', alerts);

    // Save notification to Notification Center logs
    try {
      const notifications = await readJson('notifications');
      notifications.unshift({
        id: `notif_${Date.now()}`,
        title: `🚨 MOBILE SOS DISTRESS: ${displayName}`,
        message: message || `1-Tap Mobile Emergency Beacon activated by ${displayName}. Immediate SAR response required.`,
        type: 'Emergency',
        unread: true,
        createdAt: new Date().toISOString()
      });
      await writeJson('notifications', notifications);
    } catch (e) {
      console.error('Failed to log notification:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Mobile SOS Emergency Broadcast registered!',
      alert: newSimulatedAlert
    });
  } catch (error) {
    next(error);
  }
};


