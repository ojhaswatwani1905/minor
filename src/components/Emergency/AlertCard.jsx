import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  MapPinOff,
  Battery, 
  Wifi, 
  Smartphone, 
  Compass, 
  CheckCircle, 
  CheckCircle2,
  ShieldCheck, 
  Send,
  Eye,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const AlertCard = ({ 
  alert, 
  onViewDetail, 
  onAcknowledge, 
  onResolve, 
  onNotifyGuardian 
}) => {
  const isCritical = alert.priority === 'CRITICAL' || alert.type === 'MANUAL_SOS';
  const isPending = alert.status?.toLowerCase() === 'pending';
  const isAcknowledged = alert.status?.toLowerCase() === 'acknowledged';
  const isResolved = alert.status?.toLowerCase() === 'resolved';

  const hasCoords = alert.location?.lat != null && alert.location?.lng != null;
  const lat = hasCoords ? Number(alert.location.lat).toFixed(4) : null;
  const lng = hasCoords ? Number(alert.location.lng).toFixed(4) : null;

  // Battery color indicator
  const batteryLevel = alert.batteryLevel != null ? Number(alert.batteryLevel) : null;
  const batteryColor = 
    batteryLevel == null ? 'text-slate-500' :
    batteryLevel < 20 ? 'text-red-400' :
    batteryLevel < 50 ? 'text-amber-400' : 'text-emerald-400';

  // Device info label
  const deviceLabel = alert.deviceInfo?.platform
    ? `${alert.deviceInfo.platform.toUpperCase()} ${alert.deviceInfo.model || ''}`.trim()
    : alert.user?.phone || null;

  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden space-y-4 shadow-xl ${
        isPending
          ? 'bg-gradient-to-br from-red-950/70 via-slate-900 to-slate-900 border-red-500/60 shadow-red-500/10'
          : isAcknowledged
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40'
          : isResolved
          ? 'bg-slate-900/50 border-slate-800/80 opacity-75'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
            isPending
              ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
              : isAcknowledged
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-white tracking-wide">
                {alert.type || 'MANUAL_SOS'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {alert.priority || 'CRITICAL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Alert ID: {alert.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <StatusBadge status={alert.status || 'Pending'} />
        </div>
      </div>

      {/* Traveller Name & Timestamp */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            {alert.userName || 'Anonymous Traveller'}
          </h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(alert.timestamp).toLocaleString()}</span>
          </p>
        </div>

        {alert.guardianNotified && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            ✓ Guardian SMS Logged
          </span>
        )}
      </div>

      {/* Incident Message */}
      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
        {alert.message}
      </p>

      {/* Comprehensive Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* GPS Location & Coordinates */}
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            {hasCoords ? <MapPin className="w-3.5 h-3.5 text-cyan-400" /> : <MapPinOff className="w-3.5 h-3.5 text-amber-400" />}
            GPS Coordinates
          </span>
          {hasCoords ? (
            <div>
              <p className="font-mono text-cyan-300 font-bold text-[11px]">
                {lat}, {lng}
              </p>
              {alert.location?.name && (
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {alert.location.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-amber-400/90 font-medium">
              Coordinates Unavailable (GPS Denied/Off)
            </p>
          )}
        </div>

        {/* Battery & Network Status */}
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Battery className={`w-3.5 h-3.5 ${batteryColor}`} />
              Battery Level
            </span>
            <span className={`font-mono font-bold text-[11px] ${batteryColor}`}>
              {batteryLevel != null ? `${batteryLevel}%` : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              Connectivity
            </span>
            <span className="font-medium text-[11px] text-slate-200 truncate max-w-[120px]">
              {alert.networkStatus || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Device & Phone Info */}
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            Device Information
          </span>
          <p className="font-medium text-[11px] text-slate-200 truncate">
            {deviceLabel || 'Device Info Unknown'}
          </p>
        </div>

        {/* Trip Associated */}
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Trip Associated
          </span>
          <p className="font-medium text-[11px] text-slate-200 truncate">
            {alert.tripId ? `Trip ID: ${alert.tripId}` : (alert.tripInfo || 'No Associated Trip')}
          </p>
        </div>
      </div>

      {/* Action Command Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={() => onViewDetail(alert.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Inspect Details</span>
        </button>

        <div className="flex items-center gap-2">
          {isPending && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Acknowledge SOS</span>
            </button>
          )}

          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Mark Resolved</span>
            </button>
          )}

          {hasCoords && (
            <a
              href={`https://maps.google.com/?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 transition-colors"
              title="Open Coordinates in Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
