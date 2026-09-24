import { readJson } from '../utils/jsonDb.js';

export const getReports = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const users = await readJson('users');
    const trips = await readJson('trips');
    const alerts = await readJson('alerts');

    let reportData = [];
    let summary = {};

    if (type === 'Emergency' || type === 'Monthly Emergency Incident Report') {
      reportData = alerts.map(a => ({
        id: a.id,
        category: a.type,
        touristName: a.userName,
        priority: a.priority,
        location: a.location?.name || 'N/A',
        status: a.status,
        timestamp: new Date(a.timestamp).toLocaleString(),
        guardianNotified: a.guardianNotified ? 'Yes' : 'No'
      }));
      summary = {
        totalIncidents: alerts.length,
        activeRescues: alerts.filter(a => a.status === 'Active Rescue').length,
        resolvedIncidents: alerts.filter(a => a.status === 'Resolved').length
      };
    } else if (type === 'Trips' || type === 'Expedition Route Safety Report') {
      reportData = trips.map(t => ({
        id: t.id,
        destination: t.destination,
        route: t.route,
        touristName: t.userName,
        boundaryRadius: `${t.boundaryRadiusKm} km`,
        status: t.status,
        geofenceViolated: t.geofenceViolated ? 'Violated' : 'Safe',
        expectedArrival: new Date(t.expectedArrival).toLocaleDateString()
      }));
      summary = {
        totalTrips: trips.length,
        activeTrips: trips.filter(t => t.status === 'Active').length,
        completedTrips: trips.filter(t => t.status === 'Completed').length
      };
    } else {
      // Default: Daily Safety Summary Report
      reportData = users.map(u => ({
        id: u.id,
        touristName: u.fullName,
        phone: u.phone,
        status: u.status,
        battery: `${u.batteryLevel}%`,
        network: u.networkSignal,
        location: u.currentLocation?.name || 'N/A',
        lastPing: new Date(u.lastPing).toLocaleString()
      }));
      summary = {
        totalTourists: users.length,
        onlineTourists: users.filter(u => u.status === 'Online').length,
        offlineTourists: users.filter(u => u.status === 'Offline' || u.status === 'EMERGENCY').length
      };
    }

    res.json({
      success: true,
      reportType: type || 'Daily Safety Summary',
      generatedAt: new Date().toISOString(),
      summary,
      reportData
    });
  } catch (error) {
    next(error);
  }
};
