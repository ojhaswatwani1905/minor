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
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#25433E] p-4 rounded-3xl border border-white/10 backdrop-blur-md shadow-xl text-white select-none">
      {/* Tourist Camera Focus Dropdown */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <Compass className="w-5 h-5 text-honey flex-shrink-0" />
        <div className="w-full lg:w-80">
          <select
            value={selectedTouristId || ''}
            onChange={(e) => onSelectTourist(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#1E3732] border border-white/15 text-xs text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-honey/50 cursor-pointer shadow-sm"
          >
            <option value="" className="bg-[#1E3732] text-white">🎯 Center All Active Satellite Markers</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-[#1E3732] text-white">
                {loc.fullName} ({loc.status}) — {loc.location?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter & Auto-Refresh Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#1E3732] px-4 py-2.5 rounded-2xl border border-white/15 text-xs shadow-sm">
          <Filter className="w-3.5 h-3.5 text-honey" />
          <span className="text-white/60 font-semibold">Filter Pins:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#1E3732] text-white">All Live Markers</option>
            <option value="Online" className="bg-[#1E3732] text-white">🟢 Online Only</option>
            <option value="Offline" className="bg-[#1E3732] text-white">🟡 Offline Only</option>
            <option value="EMERGENCY" className="bg-[#1E3732] text-white">🔴 SOS Emergency Only</option>
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black border transition-all shadow-sm ${
            autoRefresh
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-[#1E3732] text-white/60 border-white/15 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-300' : 'text-white/40'}`} />
          <span>{autoRefresh ? 'Auto 5s Ping ON' : 'Auto Ping OFF'}</span>
        </button>

        {/* Manual Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-2xl bg-[#1E3732] border border-white/15 text-white/80 hover:text-honey hover:border-honey/40 transition-colors shadow-sm"
          title="Manual Telemetry Sync"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
