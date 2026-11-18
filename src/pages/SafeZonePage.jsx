import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { alertService } from '../services/alertService';
import { SafeZoneMap } from '../components/SafeZone/SafeZoneMap';
import { Loader } from '../components/Common/Loader';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Battery, 
  Phone, 
  Search, 
  RefreshCw,
  BellRing,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

export const SafeZonePage = () => {
  const [safeZones, setSafeZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSafeZoneData = async (isBackground = false) => {
    try {
      const [szRes, incRes] = await Promise.all([
        tripService.getAllSafeZones(),
        tripService.getSafeZoneIncidents()
      ]);

      if (szRes.success && Array.isArray(szRes.safeZones)) {
        setSafeZones(szRes.safeZones);
        if (!selectedZoneId && szRes.safeZones.length > 0) {
          setSelectedZoneId(szRes.safeZones[0].id);
        }
      }

      if (incRes.success && Array.isArray(incRes.incidents)) {
        setIncidents(incRes.incidents);
      }
    } catch (err) {
      console.error('Error fetching safe zone telemetry:', err);
      if (!isBackground) toast.error('Failed to sync safe travel zone telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafeZoneData();
  }, []);

  // Periodic polling every 5s
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSafeZoneData(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedZoneId]);

  // Selected Safe Zone data
  const selectedZone = safeZones.find(s => s.id === selectedZoneId) || safeZones[0];

  // Filtering
  const filteredSafeZones = safeZones.filter(sz => {
    if (statusFilter !== 'All') {
      if ((sz.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (sz.userName || '').toLowerCase().includes(q);
      const matchDest = (sz.destination || '').toLowerCase().includes(q);
      const matchId = (sz.userId || sz.id || '').toLowerCase().includes(q);
      if (!matchName && !matchDest && !matchId) return false;
    }
    return true;
  });

  // Calculate Metrics
  const activeCount = safeZones.filter(s => s.status === 'ACTIVE').length;
  const approachingCount = safeZones.filter(s => s.status === 'APPROACHING').length;
  const warningCount = safeZones.filter(s => s.status === 'WARNING').length;
  const breachedCount = safeZones.filter(s => s.status === 'BREACHED').length;

  // Actions
  const handleConfirmSafe = async (zoneId) => {
    setActionLoading(true);
    try {
      const res = await tripService.confirmSafe(zoneId, 'Operator verified tourist safety over radio/phone');
      if (res.success) {
        toast.success('Tourist verified safe! Safe zone restored to ACTIVE.');
        fetchSafeZoneData(true);
      } else {
        toast.error(res.message || 'Action failed');
      }
    } catch (e) {
      toast.error(e.message || 'Error confirming safety');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async (zoneId, currentStatus) => {
    setActionLoading(true);
    const action = currentStatus === 'PAUSED' ? 'RESUME' : 'PAUSE';
    try {
      const res = await tripService.updateSafeZoneStatus(zoneId, action);
      if (res.success) {
        toast.info(`Safe zone monitoring ${action === 'PAUSE' ? 'paused' : 'resumed'}.`);
        fetchSafeZoneData(true);
      }
    } catch (e) {
      toast.error(e.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Connecting to Safe Travel Zone Geofence Constellation..." />;
  }

  return (
    <div className="space-y-6 pb-12 min-h-[calc(100vh-100px)] flex flex-col font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#192E2A] flex items-center gap-2.5">
            Safe Travel Zone & Geofence SOS
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-[#192E2A]/70 font-semibold mt-1">
            5.0 km Automated Safe Perimeter • False-Positive Shielded • Real-Time Satellite Tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSafeZoneData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#192E2A] text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
            Refresh Feed
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-[#192E2A] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-Sync 5s
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Safe Zones</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{safeZones.length}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Configured 5km perimeters</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Active Inside Zone</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          <p className="text-[11px] text-emerald-700/80 font-semibold mt-0.5">Safely inside 5km boundary</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Approaching Phase</p>
            <Compass className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-cyan-600 mt-1">{approachingCount}</p>
          <p className="text-[11px] text-cyan-700/80 font-semibold mt-0.5">En route (SOS silenced)</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Boundary Warnings</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{warningCount}</p>
          <p className="text-[11px] text-amber-700/80 font-semibold mt-0.5">Awaiting verification</p>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${breachedCount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">Breach SOS Alarms</p>
            <BellRing className={`w-4 h-4 text-rose-500 ${breachedCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">{breachedCount}</p>
          <p className="text-[11px] text-rose-700/80 font-semibold mt-0.5">Confirmed exit incidents</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['All', 'Active', 'Approaching', 'Warning', 'Breached', 'Paused', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === f
                  ? 'bg-[#25433E] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tourist, destination, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Main Command Workspace: Interactive Map & Telemetry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[580px]">
        {/* Left: 5km Safe Zone Map View */}
        <div className="lg:col-span-8 flex flex-col min-h-[500px]">
          <SafeZoneMap
            safeZones={filteredSafeZones}
            selectedSafeZoneId={selectedZoneId}
            onSelectSafeZone={(id) => setSelectedZoneId(id)}
          />
        </div>

        {/* Right: Selected Tourist & Safe Zone Telemetry Side Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {selectedZone ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl space-y-4 flex-1">
              {/* Header Profile */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedZone.status === 'BREACHED'
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : selectedZone.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : selectedZone.status === 'APPROACHING'
                      ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                      : selectedZone.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {selectedZone.status}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{selectedZone.userName}</h3>
                  <p className="text-xs text-slate-500 font-medium">ID: {selectedZone.userId || selectedZone.id}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Battery</p>
                  <p className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-end">
                    <Battery className="w-3.5 h-3.5" />
                    {selectedZone.batteryLevel ?? 'N/A'}%
                  </p>
                </div>
              </div>

              {/* Destination & Geofence Perimeter Specs */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Target Destination:</span>
                  <span className="font-extrabold text-slate-800">{selectedZone.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Safe Radius:</span>
                  <span className="font-extrabold text-cyan-700">5,000 meters (5 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Destination Center:</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {selectedZone.destinationCoords?.lat?.toFixed(4)}, {selectedZone.destinationCoords?.lng?.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Real-time Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Distance to Center</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {selectedZone.distanceFromDestMeters != null
                      ? `${(selectedZone.distanceFromDestMeters / 1000).toFixed(2)} km`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Boundary Offset</p>
                  <p className={`text-sm font-black mt-0.5 ${
                    selectedZone.distanceOutsideBoundaryMeters > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {selectedZone.distanceOutsideBoundaryMeters > 0
                      ? `+${selectedZone.distanceOutsideBoundaryMeters}m Outside`
                      : 'Inside 5km'}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">GNSS Accuracy</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">
                    {selectedZone.lastAccuracyMeters ? `±${Math.round(selectedZone.lastAccuracyMeters)}m` : 'Valid GNSS'}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Last Position Ping</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                    {selectedZone.lastPingAt ? new Date(selectedZone.lastPingAt).toLocaleTimeString() : 'Recent'}
                  </p>
                </div>
              </div>

              {/* Guardian Emergency Contact */}
              <div className="p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] font-bold text-cyan-800 uppercase">Registered Guardian</p>
                  <p className="font-extrabold text-cyan-950">{selectedZone.guardianPhone || '+91 98765 43210'}</p>
                </div>
                <a
                  href={`tel:${selectedZone.guardianPhone || ''}`}
                  className="p-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-sm"
                  title="Call Guardian"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Transition Audit History Log */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Transition & Audit History
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                  {selectedZone.history && selectedZone.history.length > 0 ? (
                    selectedZone.history.map((h, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{h.event}: <span className="font-medium text-slate-600">{h.note}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">No transitions recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Operator Command Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {(selectedZone.status === 'BREACHED' || selectedZone.status === 'WARNING') && (
                  <button
                    onClick={() => handleConfirmSafe(selectedZone.id)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <UserCheck className="w-4 h-4" />
                    Verify & Confirm Tourist Safe (Reset Alert)
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePause(selectedZone.id, selectedZone.status)}
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                  >
                    {selectedZone.status === 'PAUSED' ? '▶ Resume Monitoring' : '⏸ Pause Monitoring'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex items-center justify-center flex-1 text-center">
              <p className="text-xs text-slate-400 font-medium">No safe zone selected. Click any circle on the map.</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Geofence Breach Incidents Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-black text-slate-900 tracking-wide uppercase">
              Geofence Emergency Incidents ({incidents.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Distinct from Manual SOS Beacons</span>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No Active Boundary Breach Incidents</p>
            <p className="text-[11px] text-slate-500 mt-1">All monitored tourists are safely within their designated 5 km perimeters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Tourist</th>
                  <th className="py-2.5 px-3">Message & Incident Details</th>
                  <th className="py-2.5 px-3">Location Coordinates</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
                        {inc.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {inc.userName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                      {inc.message}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {inc.location?.lat ? `${inc.location.lat.toFixed(4)}, ${inc.location.lng.toFixed(4)}` : 'GNSS Pending'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        inc.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inc.status === 'Acknowledged'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

