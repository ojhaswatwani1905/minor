import React, { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import { StatCard } from '../components/Cards/StatCard';
import { AlertFilterBar } from '../components/Emergency/AlertFilterBar';
import { AlertCard } from '../components/Emergency/AlertCard';
import { AlertDetailModal } from '../components/Emergency/AlertDetailModal';
import { RescuePlaybookModal } from '../components/Emergency/RescuePlaybookModal';
import { Loader } from '../components/Common/Loader';
import { AlertTriangle, ShieldAlert, Zap, Radio, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const EmergencyPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [playbookAlert, setPlaybookAlert] = useState(null);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertService.getAlerts({
        search,
        type: typeFilter,
        priority: priorityFilter,
        status: statusFilter
      });
      if (res.success) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch emergency alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [search, typeFilter, priorityFilter, statusFilter]);


  const handleOpenDetail = async (id) => {
    try {
      const res = await alertService.getAlertById(id);
      if (res.success) {
        setSelectedAlertDetail(res.alert);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load incident telemetry');
    }
  };

  const handleDispatchRescue = async (id) => {
    try {
      const targetAlert = alerts.find(a => a.id === id);
      setPlaybookAlert(targetAlert);
      setIsPlaybookOpen(true);
      const res = await alertService.updateAlertStatus(id, 'Active Rescue', 'Rescue team dispatched from command center.');
      if (res.success) {
        toast.success('🚨 RESCUE PLAYBOOK LAUNCHED!');
        fetchAlerts();
      }
    } catch (err) {
      toast.error('Failed to dispatch rescue team');
    }
  };

  const handleNotifyGuardian = async (id) => {
    try {
      const res = await alertService.notifyGuardian(id);
      if (res.success) {
        toast.success(res.message);
        fetchAlerts();
      }
    } catch (err) {
      toast.error('SMS dispatch error');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      const res = await alertService.updateAlertStatus(id, 'Resolved', 'Incident marked resolved by Command Director.');
      if (res.success) {
        toast.success('Incident marked resolved');
        fetchAlerts();
        if (selectedAlertDetail?.id === id) {
          setIsDetailOpen(false);
        }
      }
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleSimulateSos = async () => {
    try {
      const res = await alertService.simulateSosAlert();
      if (res.success) {
        toast.error('🚨 SIMULATED SOS BROADCAST RECEIVED!');
        fetchAlerts();
      }
    } catch (err) {
      toast.error('SOS simulation error');
    }
  };

  // Metrics
  const activeRescues = Array.isArray(alerts) ? alerts.filter(a => a?.status === 'Active Rescue').length : 0;
  const criticalSos = Array.isArray(alerts) ? alerts.filter(a => a?.priority === 'CRITICAL').length : 0;
  const highPriority = Array.isArray(alerts) ? alerts.filter(a => a?.priority === 'HIGH').length : 0;
  const resolvedToday = Array.isArray(alerts) ? alerts.filter(a => a?.status === 'Resolved').length : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Emergency SOS Response Center
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            2-Way Satellite Emergency SOS Beacon Dispatch, Autonomous Thermal Drones, & Guardian SMS Blast
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateSos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Zap className="w-4 h-4 animate-bounce" />
            <span>Simulate Incoming SOS</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Rescues En Route"
          value={activeRescues}
          trend="+Live Active"
          icon={Radio}
          color="red"
          highlight={activeRescues > 0}
        />
        <StatCard
          title="Critical SOS Incidents"
          value={criticalSos}
          trend="+High Priority"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="High Priority Alerts"
          value={highPriority}
          trend="Monitored"
          icon={ShieldAlert}
          color="purple"
        />
        <StatCard
          title="Incidents Resolved Today"
          value={resolvedToday}
          trend="+100% Success"
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Filter Bar */}
      <AlertFilterBar
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onSimulateSos={handleSimulateSos}
        onRefresh={fetchAlerts}
      />

      {/* Alerts Feed Cards Grid */}
      {loading ? (
        <Loader message="Scanning Emergency Broadcast Frequency..." />
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-white">All Clear — No Active Emergency Incidents</h4>
          <p className="text-xs">No emergency SOS or telemetry breach alerts match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onViewDetail={handleOpenDetail}
              onDispatchRescue={handleDispatchRescue}
              onNotifyGuardian={handleNotifyGuardian}
              onResolve={handleResolveAlert}
            />
          ))}
        </div>
      )}

      {/* Alert Detail & Rescue Action Modal */}
      <AlertDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        alertDetail={selectedAlertDetail}
        onUpdateStatus={async (id, status, note) => {
          await alertService.updateAlertStatus(id, status, note);
          toast.success('Incident status updated');
          handleOpenDetail(id);
          fetchAlerts();
        }}
        onNotifyGuardian={handleNotifyGuardian}
      />

      {/* Interactive Emergency Rescue Playbook & Thermal Drone Control Modal */}
      <RescuePlaybookModal
        isOpen={isPlaybookOpen}
        onClose={() => setIsPlaybookOpen(false)}
        alertItem={playbookAlert}
        onStatusUpdated={fetchAlerts}
      />
    </div>
  );
};
