import React from 'react';
import { Search, Filter, Battery, UserPlus, RefreshCw } from 'lucide-react';

export const UserSearchFilter = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  batteryFilter,
  setBatteryFilter,
  onAddUser,
  onRefresh
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
      {/* Search Input */}
      <div className="relative w-full lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tourist by name, email, phone, document ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Statuses</option>
            <option value="Online" className="bg-slate-900">Online</option>
            <option value="Offline" className="bg-slate-900">Offline</option>
            <option value="EMERGENCY" className="bg-slate-900">EMERGENCY</option>
          </select>
        </div>

        {/* Battery Filter */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <Battery className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Battery:</span>
          <select
            value={batteryFilter}
            onChange={(e) => setBatteryFilter(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Levels</option>
            <option value="Low" className="bg-slate-900">Low (&lt; 20%)</option>
            <option value="Normal" className="bg-slate-900">Normal (&ge; 20%)</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Register New Tourist Button */}
        <button
          onClick={onAddUser}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Tourist</span>
        </button>
      </div>
    </div>
  );
};
