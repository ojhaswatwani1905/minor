import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { Bell, Filter, CheckCircle2, Trash2, Send, ShieldAlert, Clock } from 'lucide-react';
import { Loader } from '../components/Common/Loader';
import { toast } from 'react-toastify';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ category, status });
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [category, status]);


  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAsRead();
      if (res.success) {
        toast.success(res.message);
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await notificationService.clearNotifications();
      if (res.success) {
        toast.success(res.message);
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Notification & Guardian SMS Logs
            {unreadCount > 0 && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of automated SMS dispatches to primary guardians & emergency push notifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#25433E] border border-white/10 shadow-xl text-white">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-honey" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-[#1E3732] border border-white/15 text-xs font-bold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-honey/50"
          >
            <option value="All" className="bg-[#1E3732] text-white">All Categories</option>
            <option value="Emergency" className="bg-[#1E3732] text-white">Emergency SOS</option>
            <option value="Warning" className="bg-[#1E3732] text-white">Warning Alerts</option>
            <option value="Trip" className="bg-[#1E3732] text-white">Trip Notifications</option>
            <option value="System" className="bg-[#1E3732] text-white">System & Guardian SMS</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-[#1E3732] border border-white/15 text-xs font-bold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-honey/50"
          >
            <option value="All" className="bg-[#1E3732] text-white">All Statuses</option>
            <option value="Unread" className="bg-[#1E3732] text-white">Unread Only</option>
            <option value="Read" className="bg-[#1E3732] text-white">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <Loader message="Fetching Notification Audit Logs..." />
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-[#25433E]/40 rounded-3xl border border-white/10 text-white/70 space-y-2">
          <Bell className="w-10 h-10 text-honey mx-auto" />
          <h4 className="text-base font-bold text-white font-sans">No Notification Logs</h4>
          <p className="text-xs">Notification history is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.type === 'Emergency'
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : n.unread
                  ? 'bg-[#25433E] border-honey/40 shadow-md text-white'
                  : 'bg-[#25433E]/70 border-white/10 text-white/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${
                  n.type === 'Emergency' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-honey/15 text-honey border-honey/30'
                }`}>
                  {n.type === 'Emergency' ? <ShieldAlert className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-sans">{n.title}</span>
                    {n.unread && (
                      <span className="w-2 h-2 rounded-full bg-honey animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-white/80 font-sans">{n.message}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
