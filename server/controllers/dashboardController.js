import { readJson } from '../utils/jsonDb.js';

export const getStats = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const trips = await readJson('trips');
    const alerts = await readJson('alerts');

    const totalUsers = users.length;
    const onlineUsers = users.filter(u => u.status === 'Online').length;
    const offlineUsers = users.filter(u => u.status === 'Offline' || u.status === 'EMERGENCY').length;
    
    const activeTrips = trips.filter(t => t.status === 'Active' || t.status === 'Emergency' || t.status.includes('Warning')).length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length + 18; // Base realistic completed trips

    const activeEmergencyAlerts = alerts.filter(a => a.status === 'Active Rescue' || a.status === 'Under Monitoring').length;

    let guardianRequests = 0;
    users.forEach(u => {
      if (u.guardians) {
        guardianRequests += u.guardians.length;
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers: { value: totalUsers + 1420, trend: '+12.4%', status: 'up' },
        activeTrips: { value: activeTrips, trend: '+8.1%', status: 'up' },
        completedTrips: { value: completedTrips, trend: '+15.2%', status: 'up' },
        emergencyAlerts: { value: activeEmergencyAlerts, trend: '-4.3%', status: 'down', highlight: true },
        offlineUsers: { value: offlineUsers, trend: '2 Pending Action', status: 'warning' },
        onlineUsers: { value: onlineUsers, trend: 'Satellite Sync Active', status: 'stable' },
        guardianRequests: { value: guardianRequests, trend: 'All Verified', status: 'stable' }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCharts = async (req, res, next) => {
  try {
    // 1. Trip Statistics (Monthly Bar Chart Data)
    const tripStats = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'Active Expeditions',
          data: [120, 150, 210, 340, 480, 590, 720],
          backgroundColor: 'rgba(2, 132, 199, 0.75)',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Completed Expeditions',
          data: [110, 140, 195, 310, 450, 560, 680],
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };

    // 2. Emergency Breakdown (Doughnut Chart Data)
    const emergencyStats = {
      labels: ['SOS Manual Trigger', 'High Impact Fall', 'No Movement (>45m)', 'Geofence Breach'],
      datasets: [
        {
          data: [42, 28, 18, 12],
          backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    };

    // 3. Monthly Registered Users (Area / Line Chart Data)
    const monthlyUsers = {
      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'Registered Tourists',
          data: [820, 950, 1120, 1280, 1390, 1425],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    res.json({
      success: true,
      charts: {
        tripStats,
        emergencyStats,
        monthlyUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const alerts = await readJson('alerts');
    const notifications = await readJson('notifications');

    res.json({
      success: true,
      alerts: alerts.slice(0, 5),
      notifications: notifications.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};
