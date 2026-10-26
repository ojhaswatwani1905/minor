import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Radio,
  BellRing,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Smartphone
} from 'lucide-react';
import { StatCard } from '../components/Cards/StatCard';
import { QuickMapPreview } from '../components/Map/QuickMapPreview';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Loader } from '../components/Common/Loader';
import { apiFetch } from '../utils/api';
import { toast } from 'react-toastify';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      const [statsRes, activityRes] = await Promise.all([
        apiFetch('/dashboard/stats'),
        apiFetch('/dashboard/recent-activity')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (activityRes.success) setActivities(activityRes);
    } catch (err) {
      if (!isBackground) {
        console.error('Failed to load dashboard data:', err);
        toast.error('Error connecting to telemetry server');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
    const interval = setInterval(() => fetchDashboardData(true), 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <Loader message="Fetching Real-Time Safety Telemetry..." />;
  }

  const pendingAlertCount = stats?.pendingAlerts?.value || 0;
  const activeAlertCount = stats?.emergencyAlerts?.value || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Safety Command Center
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeAlertCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                activeAlertCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring of high-risk mountain, wildlife, & disaster zone tourist safety
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app-qr')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile App QR</span>
          </button>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-500 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Feed</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Active Mesh Feed
          </span>
        </div>
      </div>

      {/* Emergency Status Banner */}
      {activeAlertCount > 0 ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-red-500/10 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                CRITICAL SOS DISTRESS ACTIVITY DETECTED
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {pendingAlertCount > 0 ? `${pendingAlertCount} incident(s) currently Pending triage.` : `${activeAlertCount} active rescue incident(s) monitored.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/emergency')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-md transition-all whitespace-nowrap"
          >
            <span>Open Emergency Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">System Status All Clear: No active SOS emergency distress beacons.</span>
          </div>
          <button
            onClick={() => navigate('/emergency')}
            className="text-[11px] font-bold text-cyan-400 hover:underline"
          >
            Inspect Incident History →
          </button>
        </div>
      )}

      {/* 4 Authentic Real Data KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active SOS Alerts"
          value={stats?.emergencyAlerts?.value || 0}
          trend={stats?.emergencyAlerts?.trend || "Live Triage"}
          icon={AlertTriangle}
          color="red"
          highlight={activeAlertCount > 0}
        />
        <StatCard
          title="Pending Response"
          value={stats?.pendingAlerts?.value || 0}
          trend="Awaiting Operator"
          icon={BellRing}
          color="amber"
          highlight={pendingAlertCount > 0}
        />
        <StatCard
          title="Registered Travellers"
          value={stats?.totalUsers?.value || 0}
          trend="Safety Directory"
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Active Expeditions"
          value={stats?.activeTrips?.value || 0}
          trend="Monitored Corridors"
          icon={MapPin}
          color="emerald"
        />
      </div>

      {/* Mobile App QR Quick Pairing Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">
                Tourist Mobile SOS App Connection
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Expo Go Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pair any physical Android or iOS device with Expo Go to test live tourist GPS tracking, battery telemetry, and manual SOS broadcasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => navigate('/app-qr')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open App QR & Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map & Live Alert Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Live Tourist GPS Monitoring Preview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time geographic positions and high-altitude safety zones
                </p>
              </div>
              <button
                onClick={() => navigate('/monitoring')}
                className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Live Monitoring Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <QuickMapPreview />
          </div>
        </div>

        {/* Live Recent Emergency Alerts List (1 Column) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Recent Emergency Broadcasts
              </h3>
              <button
                onClick={() => navigate('/emergency')}
                className="text-[11px] font-bold text-cyan-500 cursor-pointer hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activities?.alerts && activities.alerts.length > 0 ? (
                activities.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/emergency')}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer hover:border-cyan-500/50 ${
                      alert.status === 'Pending' || alert.priority === 'CRITICAL'
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : alert.status === 'Resolved'
                        ? 'bg-slate-800/20 border-slate-800 text-slate-400'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-100 truncate max-w-[140px]">
                        {alert.userName || 'Traveller'}
                      </span>
                      <StatusBadge status={alert.status || alert.priority} />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-cyan-400 font-mono truncate max-w-[120px]">
                        {alert.location?.lat != null ? `${alert.location.lat.toFixed(2)}, ${alert.location.lng.toFixed(2)}` : 'No GPS'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No emergency broadcasts recorded.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/emergency')}
            className="w-full mt-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs text-center border border-slate-700 transition-colors"
          >
            Emergency Command Center →
          </button>
        </div>
      </div>
    </div>
  );
};
