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
  ArrowRight,
  ShieldCheck,
  QrCode,
  Smartphone
} from 'lucide-react';
import { ExpeditionPermitCard } from '../components/Cards/ExpeditionPermitCard';
import { SafetyBarChart } from '../components/Charts/SafetyBarChart';
import { TelemetrySplineChart } from '../components/Charts/TelemetrySplineChart';
import { QuickMapPreview } from '../components/Map/QuickMapPreview';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Loader } from '../components/Common/Loader';
import { apiFetch } from '../utils/api';
import { toast } from 'react-toastify';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      const [statsRes, activityRes, usersRes, tripsRes] = await Promise.all([
        apiFetch('/dashboard/stats'),
        apiFetch('/dashboard/recent-activity'),
        apiFetch('/users').catch(() => ({ success: false })),
        apiFetch('/trips').catch(() => ({ success: false }))
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (activityRes.success) setActivities(activityRes);
      if (usersRes.success && Array.isArray(usersRes.users)) setUsers(usersRes.users);
      if (tripsRes.success && Array.isArray(tripsRes.trips)) setTrips(tripsRes.trips);
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
    <div className="space-y-7 pb-12 select-none">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2.5 font-sans">
            Safety Command Center
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeAlertCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                activeAlertCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Real-time monitoring of high-risk mountain, wildlife, & disaster zone tourist safety
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app-qr')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-xs font-bold text-[#192E2A] hover:text-pine hover:bg-white transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-honey" />
            <span>Pair Mobile App</span>
          </button>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-xs font-bold text-[#192E2A] hover:text-pine transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-honey' : 'text-slate-400'}`} />
            <span>Refresh Feed</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-extrabold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            Active 3s
          </span>
        </div>
      </div>

      {/* Emergency Status Banner */}
      {activeAlertCount > 0 ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-white/20 border border-white/30 text-white animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                CRITICAL SOS DISTRESS ACTIVITY DETECTED
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                {pendingAlertCount > 0 ? `${pendingAlertCount} incident(s) currently Pending triage.` : `${activeAlertCount} active rescue incident(s) monitored.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/emergency')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-red-600 text-xs font-black shadow-lg hover:bg-slate-100 transition-all whitespace-nowrap"
          >
            <span>Open Emergency Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">System Status All Clear: No active SOS emergency distress beacons.</span>
          </div>
          <button
            onClick={() => navigate('/emergency')}
            className="text-[11px] font-extrabold text-pine hover:underline"
          >
            Inspect Incident History →
          </button>
        </div>
      )}


      {/* Middle Row: Active Expeditions / Users Card (2 Cols) + Safety Bar Chart (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpeditionPermitCard users={users} trips={trips} activities={activities} />
        </div>
        <div className="lg:col-span-1">
          <SafetyBarChart users={users} stats={stats} />
        </div>
      </div>

      {/* Tourist Inflow & Safety Telemetry Spline Chart (Full Width) */}
      <div className="w-full">
        <TelemetrySplineChart />
      </div>

      {/* Tactical Operations Grid: Live Radar Map + Live Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 md:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#192E2A] tracking-tight flex items-center gap-2 font-sans">
                  Live Himalayan Geographic Radar
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Real-time tourist positioning, elevation zones & PostGIS 4326 spatial engine
                </p>
              </div>
              <button
                onClick={() => navigate('/monitoring')}
                className="text-xs text-pine font-bold hover:text-honey flex items-center gap-1 transition-colors"
              >
                <span>Full Radar Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <QuickMapPreview />
          </div>
        </div>

        {/* Live Emergency Broadcasts (1 Column) */}
        <div className="glass-card p-6 md:p-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#192E2A] flex items-center gap-2 font-sans">
                Live Incident Telemetry
              </h3>
              <button
                onClick={() => navigate('/emergency')}
                className="text-[11px] font-bold text-pine hover:text-honey cursor-pointer"
              >
                View Console →
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {activities?.alerts && activities.alerts.length > 0 ? (
                activities.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/emergency')}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer hover:shadow-md ${
                      alert.status === 'Pending' || alert.priority === 'CRITICAL'
                        ? 'bg-red-50/80 border-red-200 text-red-900'
                        : 'bg-white/80 border-slate-200/80 text-[#192E2A]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#192E2A] truncate max-w-[140px]">
                        {alert.userName || 'Active Traveller'}
                      </span>
                      <StatusBadge status={alert.status || alert.priority} />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-pine font-mono truncate max-w-[120px]">
                        {alert.location?.lat != null ? `[${alert.location.lat.toFixed(2)}°, ${alert.location.lng.toFixed(2)}°]` : 'No GPS'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No active emergency broadcasts recorded.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/emergency')}
            className="w-full mt-3 py-2.5 rounded-2xl bg-pine hover:bg-pine-600 text-white font-extrabold text-xs text-center transition-colors shadow-md"
          >
            Emergency Command Console →
          </button>
        </div>
      </div>
    </div>
  );
};
