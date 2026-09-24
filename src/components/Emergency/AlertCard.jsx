import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle, 
  Send,
  Eye
} from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const AlertCard = ({ alert, onViewDetail, onDispatchRescue, onNotifyGuardian, onResolve }) => {
  const isCritical = alert.priority === 'CRITICAL';
  const isResolved = alert.status === 'Resolved';

  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden space-y-4 shadow-lg ${
        isCritical && !isResolved
          ? 'bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 border-red-500/50 shadow-red-500/10'
          : isResolved
          ? 'bg-slate-900/40 border-slate-800 opacity-80'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
            isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">{alert.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {alert.priority}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">ID: {alert.id} • {alert.userName}</p>
          </div>
        </div>

        <StatusBadge status={alert.status} />
      </div>

      {/* Incident Message */}
      <p className="text-xs font-semibold text-slate-200 leading-relaxed">
        {alert.message}
      </p>

      {/* Location & Guardian Status Pill */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="truncate">{alert.location?.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            alert.guardianNotified
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {alert.guardianNotified ? '✓ Guardian SMS Sent' : 'Guardian Pending'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => onViewDetail(alert.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Incident Detail & Telemetry</span>
        </button>

        <div className="flex items-center gap-2">
          {!alert.guardianNotified && (
            <button
              onClick={() => onNotifyGuardian(alert.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SMS Guardian</span>
            </button>
          )}

          {alert.status !== 'Active Rescue' && alert.status !== 'Resolved' && (
            <button
              onClick={() => onDispatchRescue(alert.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Dispatch Rescue</span>
            </button>
          )}

          {!isResolved && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Resolved</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
