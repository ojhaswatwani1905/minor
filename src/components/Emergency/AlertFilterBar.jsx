import React from 'react';
import { Filter, Search, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export const AlertFilterBar = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  onSimulateSos,
  onRefresh
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/80 p-4 rounded-3xl border border-white/90 backdrop-blur-xl shadow-md select-none">
      {/* Search Bar */}
      <div className="relative w-full lg:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search alerts by tourist, location..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200/80 text-xs text-[#192E2A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-honey/50 shadow-sm transition-all"
        />
      </div>

      {/* Filter Tabs & Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-slate-400 font-semibold">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="SOS">SOS Triggers</option>
            <option value="Fall">Fall Detection</option>
            <option value="Offline">Offline Alerts</option>
            <option value="Boundary">Geofence Breaches</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <Filter className="w-3.5 h-3.5 text-honey" />
          <span className="text-slate-400 font-semibold">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="CRITICAL">🔴 CRITICAL Only</option>
            <option value="HIGH">🟠 HIGH Only</option>
            <option value="MEDIUM">🟣 MEDIUM Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">🔴 Pending</option>
            <option value="Acknowledged">🟡 Acknowledged</option>
            <option value="Resolved">🟢 Resolved</option>
            <option value="Active Rescue">Active Rescue</option>
            <option value="Under Monitoring">Under Monitoring</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-pine shadow-sm transition-colors"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Simulate SOS Button */}
        <button
          onClick={onSimulateSos}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md transition-all transform active:scale-95"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate SOS</span>
        </button>
      </div>
    </div>
  );
};
