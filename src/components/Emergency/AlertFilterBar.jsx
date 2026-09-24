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
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
      {/* Search Bar */}
      <div className="relative w-full lg:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search alerts by tourist, message, location..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
      </div>

      {/* Filter Tabs & Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-slate-400">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Categories</option>
            <option value="SOS" className="bg-slate-900">SOS Triggers</option>
            <option value="Fall" className="bg-slate-900">Fall Detection</option>
            <option value="Offline" className="bg-slate-900">Offline Alerts</option>
            <option value="Boundary" className="bg-slate-900">Geofence Breaches</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Priorities</option>
            <option value="CRITICAL" className="bg-slate-900">🔴 CRITICAL Only</option>
            <option value="HIGH" className="bg-slate-900">🟠 HIGH Only</option>
            <option value="MEDIUM" className="bg-slate-900">🟣 MEDIUM Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Statuses</option>
            <option value="Active Rescue" className="bg-slate-900">Active Rescue</option>
            <option value="Under Monitoring" className="bg-slate-900">Under Monitoring</option>
            <option value="Resolved" className="bg-slate-900">Resolved</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Simulate SOS Button */}
        <button
          onClick={onSimulateSos}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-500/25 transition-all transform active:scale-95 animate-pulse-slow"
        >
          <Zap className="w-4 h-4" />
          <span>Test Simulate SOS</span>
        </button>
      </div>
    </div>
  );
};
