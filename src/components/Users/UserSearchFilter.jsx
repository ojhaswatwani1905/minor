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
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/80 p-4 rounded-3xl border border-white/90 backdrop-blur-xl shadow-md select-none">
      {/* Search Input */}
      <div className="relative w-full lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tourist by name, email, phone, document ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200/80 text-xs text-[#192E2A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-honey/50 shadow-sm transition-all"
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <Filter className="w-3.5 h-3.5 text-pine" />
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="EMERGENCY">EMERGENCY</option>
          </select>
        </div>

        {/* Battery Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <Battery className="w-3.5 h-3.5 text-honey" />
          <span className="text-slate-400 font-semibold">Battery:</span>
          <select
            value={batteryFilter}
            onChange={(e) => setBatteryFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Levels</option>
            <option value="Low">Low (&lt; 20%)</option>
            <option value="Normal">Normal (&ge; 20%)</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-pine shadow-sm transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Register New Tourist Button */}
        <button
          onClick={onAddUser}
          style={{ backgroundColor: '#E5A93C' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-black shadow-md transition-all hover:brightness-105 transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Tourist</span>
        </button>
      </div>
    </div>
  );
};
