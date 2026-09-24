import React from 'react';
import { Filter, Radio, RefreshCw, Compass } from 'lucide-react';

export const MonitoringFilterBar = ({
  locations,
  selectedTouristId,
  onSelectTourist,
  statusFilter,
  setStatusFilter,
  autoRefresh,
  setAutoRefresh,
  onRefresh
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
      {/* Tourist Camera Focus Dropdown */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <Compass className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <div className="w-full lg:w-80">
          <select
            value={selectedTouristId || ''}
            onChange={(e) => onSelectTourist(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">🎯 Center All Active Satellite Markers</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.fullName} ({loc.status}) — {loc.location?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter & Auto-Refresh Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Filter Pins:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Live Markers</option>
            <option value="Online" className="bg-slate-900">🟢 Online Only</option>
            <option value="Offline" className="bg-slate-900">🟡 Offline Only</option>
            <option value="EMERGENCY" className="bg-slate-900">🔴 SOS Emergency Only</option>
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            autoRefresh
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-glow-emerald'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
          <span>{autoRefresh ? 'Auto 5s Ping ON' : 'Auto Ping OFF'}</span>
        </button>

        {/* Manual Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Manual Telemetry Sync"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
