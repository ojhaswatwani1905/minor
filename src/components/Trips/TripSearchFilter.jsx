import React from 'react';
import { Search, Filter, ShieldAlert, Plus, RefreshCw } from 'lucide-react';

export const TripSearchFilter = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  geofenceFilter,
  setGeofenceFilter,
  onCreateTrip,
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
          placeholder="Search by destination, route, tourist..."
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
            <option value="All">All Trips</option>
            <option value="Active">Active Expeditions</option>
            <option value="Completed">Completed</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        {/* Geofence Filter */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-slate-200/80 text-xs shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-honey" />
          <span className="text-slate-400 font-semibold">Geofence:</span>
          <select
            value={geofenceFilter}
            onChange={(e) => setGeofenceFilter(e.target.value)}
            className="bg-transparent text-[#192E2A] font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Geofences</option>
            <option value="Violated">Boundary Violated</option>
            <option value="Safe">Safe Perimeter</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-pine shadow-sm transition-colors"
          title="Refresh Trip List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Create Trip Button */}
        <button
          onClick={onCreateTrip}
          style={{ backgroundColor: '#E5A93C' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-black shadow-md transition-all hover:brightness-105 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Expedition</span>
        </button>
      </div>
    </div>
  );
};
