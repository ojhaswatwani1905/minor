import { 
  isSupabaseConfigured, 
  getSupabaseClient, 
  mapAlertFromDb 
} from '../database/supabase.js';
import { readJson } from '../utils/jsonDb.js';

export const getStats = async (req, res, next) => {
  try {
    const users = await readJson('users');
    const trips = await readJson('trips');

    let totalUsers = users.length;
    
    const activeTrips = trips.filter(t => t.status === 'Active' || t.status === 'Emergency' || (t.status && t.status.includes('Warning'))).length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;

    let pendingAlerts = 0;
    let activeEmergencyAlerts = 0;
    let criticalSosAlerts = 0;
    let resolvedAlerts = 0;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        
        const [pendingRes, activeRes, criticalRes, resolvedRes, profilesRes] = await Promise.all([
          supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('alerts').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
          supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('state', 'sos'),
          supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
          supabase.from('profiles').select('*', { count: 'exact', head: true })
        ]);

        pendingAlerts = pendingRes.count ?? 0;
        activeEmergencyAlerts = activeRes.count ?? 0;
        criticalSosAlerts = criticalRes.count ?? 0;
        resolvedAlerts = resolvedRes.count ?? 0;
        totalUsers = Math.max(totalUsers, profilesRes.count ?? 0);
      } catch (err) {
        console.error('[SUPABASE STATS QUERY FAILED]', err.message);
      }
    } else {
      const alerts = await readJson('alerts');
      pendingAlerts = alerts.filter(a => a.status === 'Pending').length;
      activeEmergencyAlerts = alerts.filter(a => a.status !== 'Resolved').length;
      criticalSosAlerts = alerts.filter(a => a.priority === 'CRITICAL' || a.type === 'MANUAL_SOS').length;
      resolvedAlerts = alerts.filter(a => a.status === 'Resolved').length;
    }

    // Determine online vs offline: Only users actively transmitting GPS location are online
    const now = Date.now();
    const GPS_TIMEOUT_MS = 5 * 60 * 1000;

    const onlineUsers = users.filter(u => {
      if (u.status === 'EMERGENCY') return false;
      const hasGps = u.currentLocation?.lat != null && u.currentLocation?.lng != null;
      const lastPingTime = u.lastPing ? new Date(u.lastPing).getTime() : 0;
      const isFresh = lastPingTime > 0 && (now - lastPingTime) <= GPS_TIMEOUT_MS;
      return hasGps && isFresh && u.status === 'Online';
    }).length;

    const offlineUsers = Math.max(0, totalUsers - onlineUsers);

    res.json({
      success: true,
      data: {
        totalUsers: { value: totalUsers, trend: 'Active Directory', status: 'stable' },
        activeTrips: { value: activeTrips, trend: 'En Route', status: 'up' },
        completedTrips: { value: completedTrips, trend: 'Safe Returns', status: 'up' },
        emergencyAlerts: { value: activeEmergencyAlerts, trend: `${pendingAlerts} Pending Action`, status: activeEmergencyAlerts > 0 ? 'warning' : 'stable', highlight: activeEmergencyAlerts > 0 },
        pendingAlerts: { value: pendingAlerts, trend: 'Needs Triage', status: pendingAlerts > 0 ? 'danger' : 'stable', highlight: pendingAlerts > 0 },
        criticalSosAlerts: { value: criticalSosAlerts, trend: 'Priority Beacons', status: criticalSosAlerts > 0 ? 'danger' : 'stable' },
        resolvedAlerts: { value: resolvedAlerts, trend: 'Successfully Closed', status: 'stable' },
        offlineUsers: { value: offlineUsers, trend: 'Offline Buffer', status: 'warning' },
        onlineUsers: { value: onlineUsers, trend: 'Telemetry Active', status: 'stable' }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCharts = async (req, res, next) => {
  try {
    const trips = await readJson('trips');
    let alerts = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.from('alerts').select('*');
        alerts = (data || []).map(mapAlertFromDb);
      } catch (e) {
        console.error('[SUPABASE GET CHARTS ERROR]', e.message);
      }
    } else {
      alerts = await readJson('alerts');
    }

    const manualSosCount = alerts.filter(a => a.type === 'MANUAL_SOS' || a.priority === 'CRITICAL').length;
    const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;
    const pendingCount = alerts.filter(a => a.status === 'Pending').length;

    const tripStats = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Active Expeditions',
          data: [0, 0, 0, 0, 0, 0, trips.length],
          backgroundColor: 'rgba(2, 132, 199, 0.75)',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };

    const emergencyStats = {
      labels: ['Critical / SOS', 'Pending Triage', 'Resolved'],
      datasets: [
        {
          data: alerts.length > 0 ? [manualSosCount, pendingCount, resolvedCount] : [0, 0, 0],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    };

    res.json({
      success: true,
      charts: {
        tripStats,
        emergencyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    let alerts = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from('alerts')
          .select('*, profiles(full_name, phone), trips(title)')
          .order('raised_at', { ascending: false })
          .limit(5);

        alerts = (data || []).map(mapAlertFromDb);
      } catch (e) {
        console.error('[RECENT ALERTS SUPABASE QUERY ERROR]', e.message);
      }
    } else {
      const jsonAlerts = await readJson('alerts');
      alerts = jsonAlerts.slice(0, 5);
    }

    const notifications = await readJson('notifications');

    res.json({
      success: true,
      alerts,
      notifications: notifications.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};
