import { readJson, writeJson } from '../utils/jsonDb.js';

let systemSettings = {
  emergencySoundAlerts: true,
  smsGatewayEnabled: true,
  emailAlertsEnabled: true,
  satelliteSyncIntervalSeconds: 5,
  sessionTimeoutMinutes: 60,
  twoFactorAuthEnabled: true,
  themePreference: 'dark'
};

export const getSettings = async (req, res, next) => {
  try {
    res.json({
      success: true,
      settings: systemSettings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    systemSettings = {
      ...systemSettings,
      ...req.body
    };

    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: systemSettings
    });
  } catch (error) {
    next(error);
  }
};

export const downloadBackup = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const trips = await readJson('trips');
    const alerts = await readJson('alerts');
    const admins = await readJson('admins');
    const notifications = await readJson('notifications');

    const backupPayload = {
      system: 'Smart Tourist Safety Monitoring System (STSMS)',
      backupTimestamp: new Date().toISOString(),
      database: {
        users,
        trips,
        alerts,
        admins: admins.map(a => ({ id: a.id, email: a.email, name: a.name, role: a.role })),
        notifications
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=stsms-backup-${Date.now()}.json`);
    res.send(JSON.stringify(backupPayload, null, 2));
  } catch (error) {
    next(error);
  }
};
