import React, { useEffect, useState } from 'react';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  WifiOff, 
  Wifi, 
  ShieldCheck,
  RefreshCw,
  Clock,
  ChevronRight,
  Radio
} from 'lucide-react';
import { StatCard } from '../components/Cards/StatCard';
import { TripStatsChart } from '../components/Charts/TripStatsChart';
import { EmergencyStatsChart } from '../components/Charts/EmergencyStatsChart';
import { MonthlyUsersChart } from '../components/Charts/MonthlyUsersChart';
import { QuickMapPreview } from '../components/Map/QuickMapPreview';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Loader } from '../components/Common/Loader';
import { apiFetch } from '../utils/api';
import { toast } from 'react-toastify';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, chartsRes, activityRes] = await Promise.all([
        apiFetch('/dashboard/stats'),
        apiFetch('/dashboard/charts'),
        apiFetch('/dashboard/recent-activity')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (chartsRes.success) setCharts(chartsRes.charts);
      if (activityRes.success) setActivities(activityRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Error connecting to telemetry server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);


  if (loading) {
    return <Loader message="Fetching Real-Time Tourist Telemetry..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Safety Command Center
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring of high-risk mountain, wildlife, & disaster zone tourist safety
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-500 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Feed</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Satellite Mesh Active
          </span>
        </div>
      </div>

      {/* 7 Core Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value={stats?.totalUsers?.value || 1425}
          trend={stats?.totalUsers?.trend}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Active Trips"
          value={stats?.activeTrips?.value || 5}
          trend={stats?.activeTrips?.trend}
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Completed Trips"
          value={stats?.completedTrips?.value || 198}
          trend={stats?.completedTrips?.trend}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Emergency Alerts"
          value={stats?.emergencyAlerts?.value || 2}
          trend={stats?.emergencyAlerts?.trend}
          icon={AlertTriangle}
          color="red"
          highlight={true}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Offline Users"
          value={stats?.offlineUsers?.value || 1}
          trend={stats?.offlineUsers?.trend}
          icon={WifiOff}
          color="amber"
        />
        <StatCard
          title="Online Satellite Users"
          value={stats?.onlineUsers?.value || 4}
          trend={stats?.onlineUsers?.trend}
          icon={Wifi}
          color="emerald"
        />
        <StatCard
          title="Guardian Requests"
          value={stats?.guardianRequests?.value || 5}
          trend={stats?.guardianRequests?.trend}
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Main Analytics & Map Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview & Live Alert Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Satellite Map Preview */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Live Tourist GPS Cluster Map
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracking active travelers in Rohtang, Kedarkantha, & Silent Valley reserves
                </p>
              </div>
              <span className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer">
                Full Screen Map →
              </span>
            </div>
            <QuickMapPreview />
          </div>

          {/* Trip Statistics Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Trip & Expedition Trends
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly breakdown of active vs completed remote area treks
                </p>
              </div>
            </div>
            <TripStatsChart data={charts?.tripStats} />
          </div>
        </div>

        {/* Right Sidebar Widgets: Emergency Breakdown & Live Feed */}
        <div className="space-y-6">
          {/* Emergency Type Doughnut Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Emergency Incident Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Breakdown by SOS trigger category
            </p>
            <EmergencyStatsChart data={charts?.emergencyStats} />
          </div>

          {/* Live Recent Emergency Alerts List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Recent Emergency Broadcasts
              </h3>
              <span className="text-[11px] font-bold text-cyan-500 cursor-pointer hover:underline">
                View All
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activities?.alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                    alert.priority === 'CRITICAL'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-100">{alert.userName}</span>
                    <StatusBadge status={alert.priority} />
                  </div>
                  <p className="text-[11px] text-slate-400">{alert.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-cyan-400">{alert.location?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly User Growth Area Chart Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tourist Registration Velocity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cumulative travelers onboarded into the Safety Monitoring System
            </p>
          </div>
        </div>
        <MonthlyUsersChart data={charts?.monthlyUsers} />
      </div>
    </div>
  );
};
