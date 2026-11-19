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
    batteryLevel == null ? 'text-slate-400' :
    batteryLevel < 20 ? 'text-red-500' :
    batteryLevel < 50 ? 'text-amber-500' : 'text-emerald-600';

  // Device info label
  const deviceLabel = alert.deviceInfo?.model && alert.deviceInfo.model !== 'Unavailable'
    ? `${alert.deviceInfo.model} (${alert.deviceInfo.platform || 'Android'})`
    : (alert.deviceInfo?.platform && alert.deviceInfo.platform !== 'Unavailable'
      ? `${alert.deviceInfo.platform.toUpperCase()} Device`
      : (alert.user?.phone || null));

  return (
    <div
      className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden space-y-4 shadow-md backdrop-blur-xl select-none ${
        isPending
          ? 'bg-red-50/70 border-red-200 shadow-red-100'
          : isAcknowledged
          ? 'bg-amber-50/60 border-amber-200'
          : isResolved
          ? 'bg-white/70 border-white/90 opacity-80'
          : 'bg-white/80 border-white/90'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex-shrink-0 ${
            isPending
              ? 'bg-red-500/15 text-red-600 border-red-300 animate-pulse'
              : isAcknowledged
              ? 'bg-amber-500/15 text-amber-600 border-amber-300'
              : 'bg-emerald-500/15 text-emerald-600 border-emerald-300'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-[#192E2A] tracking-wide font-sans">
                {alert.type || 'MANUAL_SOS'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                isCritical ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
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
        <div className="flex items-center gap-2.5 min-w-0">
          {alert.user?.avatar ? (
            <img
              src={alert.user.avatar}
              alt={alert.userName || 'Traveller'}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const next = e.currentTarget.nextElementSibling;
                if (next) next.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: alert.user?.avatar ? 'none' : 'flex' }}
            className="w-9 h-9 rounded-full bg-honey/20 border border-honey/40 flex items-center justify-center font-bold text-honey text-xs flex-shrink-0"
          >
            {((alert.user?.fullName || alert.userName || 'T').charAt(0)).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#192E2A] tracking-tight font-sans truncate">
              {alert.user?.fullName || alert.userName || 'Anonymous Traveller'}
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{new Date(alert.timestamp).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {alert.guardianNotified && (
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            ✓ Guardian SMS Logged
          </span>
        )}
      </div>

      {/* Incident Message */}
      <p className="text-xs text-[#192E2A] leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        {alert.message}
      </p>

      {/* Comprehensive Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* GPS Location & Coordinates */}
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            {hasCoords ? <MapPin className="w-3.5 h-3.5 text-pine" /> : <MapPinOff className="w-3.5 h-3.5 text-honey" />}
            GPS Coordinates
          </span>
          {hasCoords ? (
            <div>
              <p className="font-mono text-pine font-black text-[11px]">
                {lat}, {lng}
              </p>
              {alert.location?.name && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  {alert.location.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-amber-600 font-medium">
              Coordinates Unavailable (GPS Denied/Off)
            </p>
          )}
        </div>

        {/* Battery & Network Status */}
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Battery className={`w-3.5 h-3.5 ${batteryColor}`} />
              Battery Level
            </span>
            <span className={`font-mono font-bold text-[11px] ${batteryColor}`}>
              {batteryLevel != null ? `${batteryLevel}%` : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-pine" />
              Connectivity
            </span>
            <span className="font-semibold text-[11px] text-[#192E2A] truncate max-w-[120px]">
              {alert.networkStatus || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Device & Phone Info */}
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-honey" />
            Device Information
          </span>
          <p className="font-semibold text-[11px] text-[#192E2A] truncate">
            {deviceLabel || 'Device Info Unknown'}
          </p>
        </div>

        {/* Trip Associated */}
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-pine" />
            Trip Associated
          </span>
          <p className="font-semibold text-[11px] text-[#192E2A] truncate">
            {alert.tripId ? `Trip ID: ${alert.tripId}` : (alert.tripInfo || 'No Associated Trip')}
          </p>
        </div>
      </div>

      {/* Action Command Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onViewDetail(alert.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-pine transition-all shadow-sm"
        >
          <Eye className="w-4 h-4 text-pine" />
          <span>Inspect Details</span>
        </button>

        <div className="flex items-center gap-2">
          {isPending && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-honey hover:bg-[#DF9E2E] text-white text-xs font-black transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge SOS</span>
            </button>
          )}

          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-pine hover:bg-pine-600 text-white text-xs font-black transition-all shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Resolved</span>
            </button>
          )}

          {hasCoords && (
            <a
              href={`https://maps.google.com/?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-pine transition-colors shadow-sm"
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
