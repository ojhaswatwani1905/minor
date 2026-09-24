import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { TripStatsChart } from '../components/Charts/TripStatsChart';
import { EmergencyStatsChart } from '../components/Charts/EmergencyStatsChart';
import { MonthlyUsersChart } from '../components/Charts/MonthlyUsersChart';
import { PredictiveRiskWidget } from '../components/Analytics/PredictiveRiskWidget';
import { StatCard } from '../components/Cards/StatCard';
import { Loader } from '../components/Common/Loader';
import { BarChart3, TrendingUp, ShieldCheck, Zap, Clock, Radio } from 'lucide-react';
import { toast } from 'react-toastify';

export const AnalyticsPage = () => {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/dashboard/charts');
        if (res.success) {
          setCharts(res.charts);
        }
      } catch (err) {
        toast.error('Failed to load analytics telemetry');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Loader message="Compiling System Analytics & Telemetry Models..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Safety Analytics & Predictive AI Risk Intelligence
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep data visualizations on tourist velocity, AI predictive route scoring, response rates, & geofence compliance
        </p>
      </div>

      {/* Predictive Risk Calculator AI Widget */}
      <PredictiveRiskWidget />

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg SOS Response Time"
          value="4.2 mins"
          trend="-1.5m faster"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Incident Resolution Rate"
          value="96.8%"
          trend="+2.4% target"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Guardian SMS Dispatch"
          value="100%"
          trend="0 Failures"
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Satellite Mesh Uptime"
          value="99.98%"
          trend="Constellation Active"
          icon={Radio}
          color="purple"
        />
      </div>

      {/* Chart Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Expeditions Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Expedition Velocity Trends
          </h3>
          <p className="text-xs text-slate-400">Monthly breakdown of active vs completed expeditions</p>
          <TripStatsChart data={charts?.tripStats} />
        </div>

        {/* Emergency Incident Doughnut Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-400" />
            Emergency Incident Categories
          </h3>
          <p className="text-xs text-slate-400">Distribution by trigger mechanism</p>
          <EmergencyStatsChart data={charts?.emergencyStats} />
        </div>
      </div>

      {/* Monthly Tourist Registration Growth Area Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Cumulative Tourist Onboarding Velocity
        </h3>
        <p className="text-xs text-slate-400">Growth trajectory of tourists protected by the monitoring system</p>
        <MonthlyUsersChart data={charts?.monthlyUsers} />
      </div>
    </div>
  );
};
