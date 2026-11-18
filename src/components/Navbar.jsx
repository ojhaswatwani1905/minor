import React, { useState } from 'react';
import { Search, Bell, User, LogOut, Shield, ChevronDown, Radio, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ collapsed }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-20 transition-all duration-300 bg-white/75 backdrop-blur-xl border-b border-white/80 flex items-center justify-between px-6 md:px-8 select-none shadow-[0_4px_24px_rgba(26,49,45,0.03)] ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Pill Search Input */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tourists, trips, SOS distress..."
          className="w-full pl-11 pr-12 py-2.5 rounded-full text-xs bg-white/90 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-honey/50 text-[#192E2A] placeholder-slate-400 transition-all shadow-sm"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-bold border border-slate-200">
          ⌘K
        </span>
      </div>

      {/* Center / Status Telemetry Pill */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/70 text-xs shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-extrabold text-[#192E2A] text-[11px] tracking-wide">COMMAND NODE :5001</span>
        <span className="text-slate-300 font-mono">|</span>
        <span className="text-slate-500 text-[11px] font-semibold">15s DEAD MAN</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Quick Emergency SOS button */}
        <button
          onClick={() => navigate('/emergency')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-honey text-white text-xs font-extrabold shadow-sm hover:bg-[#DF9E2E] transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>INCIDENTS</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2.5 rounded-full border border-slate-200/80 bg-white/90 text-slate-600 hover:text-pine transition-all relative shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="font-bold text-xs text-[#192E2A]">Live System Alerts</span>
                <span className="text-[11px] text-honey font-bold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                <div className="py-8 text-center text-xs text-slate-400">
                  No active unread distress notifications.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-slate-200/80 bg-white/90 hover:bg-slate-50 transition-all shadow-sm"
          >
            <img
              src={admin?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-honey"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#192E2A] leading-tight font-sans">
                {admin?.name || "Alex Johnson"}
              </span>
              <span className="text-[10px] text-honey font-bold">
                {admin?.role || "Command Director"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-[#192E2A]">{admin?.name || "Alex Johnson"}</p>
                <p className="text-[11px] text-slate-400 truncate">{admin?.email || "alex.johnson@gmail.com"}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-honey" />
                View Profile
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-slate-700 hover:bg-slate-50"
              >
                <Shield className="w-4 h-4 text-honey" />
                Security & Settings
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
