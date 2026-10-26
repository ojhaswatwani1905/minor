import React, { useState } from 'react';
import { Search, Sun, Moon, Bell, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ collapsed }) => {
  const { darkMode, toggleTheme } = useTheme();
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
      className={`fixed top-0 right-0 z-20 h-16 transition-all duration-300 border-b border-slate-200/80 dark:border-[#38383A]/80 apple-glass flex items-center justify-between px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Search Input */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tourists, trips, SOS alerts..."
          className="w-full pl-10 pr-12 py-2 rounded-full text-xs bg-slate-200/60 dark:bg-[#242426] border border-slate-300/60 dark:border-[#38383A] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-300/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-2xl border border-slate-300/60 dark:border-[#38383A] bg-slate-200/60 dark:bg-[#242426] text-slate-600 dark:text-slate-300 hover:text-[#007AFF] transition-all shadow-sm"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-2xl border border-slate-300/60 dark:border-[#38383A] bg-slate-200/60 dark:bg-[#242426] text-slate-600 dark:text-slate-300 hover:text-[#007AFF] transition-all relative shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#242426] animate-pulse" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-white dark:bg-[#242426] border border-slate-200 dark:border-[#38383A] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Live System Alerts</span>
                <span className="text-[11px] text-[#007AFF] font-bold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                <div className="py-8 text-center text-xs text-slate-400">
                  No active distress notifications.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full border border-slate-300/60 dark:border-[#38383A] bg-slate-200/60 dark:bg-[#242426] hover:bg-slate-300/60 dark:hover:bg-slate-800 transition-all"
          >
            <img
              src={admin?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#007AFF]/40"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {admin?.name || "Command Admin"}
              </span>
              <span className="text-[10px] text-[#007AFF] font-bold">
                {admin?.role || "Super Admin"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-3xl bg-white dark:bg-[#242426] border border-slate-200 dark:border-[#38383A] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{admin?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{admin?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <User className="w-4 h-4 text-[#007AFF]" />
                View Profile
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Shield className="w-4 h-4 text-[#007AFF]" />
                Security & Settings
              </button>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-2xl text-red-500 hover:bg-red-500/10"
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
