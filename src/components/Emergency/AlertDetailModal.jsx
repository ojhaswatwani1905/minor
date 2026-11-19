import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  AlertTriangle, 
  MapPin, 
  MapPinOff,
  Phone, 
  Mail,
  Clock, 
  ShieldAlert, 
  Plus, 
  Send, 
  CheckCircle2,
  Battery,
  Wifi,
  Smartphone,
  Compass,
  ExternalLink,
  UserCheck
} from 'lucide-react';

export const AlertDetailModal = ({ isOpen, onClose, alertDetail, onUpdateStatus, onNotifyGuardian }) => {
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!alertDetail) return null;

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus && !newNote) return;

    try {
      setSubmitting(true);
      await onUpdateStatus(alertDetail.id, newStatus || alertDetail.status, newNote);
      setNewNote('');
    } finally {
      setSubmitting(false);
    }
  };

  const hasCoords = alertDetail.location?.lat != null && alertDetail.location?.lng != null;
  const lat = hasCoords ? Number(alertDetail.location.lat).toFixed(5) : null;
  const lng = hasCoords ? Number(alertDetail.location.lng).toFixed(5) : null;

  const batteryLevel = alertDetail.batteryLevel != null ? Number(alertDetail.batteryLevel) : (alertDetail.user?.batteryLevel || null);
  const batteryColor = 
    batteryLevel == null ? 'text-slate-500' :
    batteryLevel < 20 ? 'text-red-400' :
    batteryLevel < 50 ? 'text-amber-400' : 'text-emerald-400';

  const networkStatus = alertDetail.networkStatus || alertDetail.user?.networkSignal || null;

  const deviceInfo = alertDetail.deviceInfo || null;

  const touristName = alertDetail.user?.fullName || alertDetail.userName || 'Active Traveller';
  const touristId = alertDetail.user?.id || alertDetail.userId || 'Guest/Unassigned';
  const touristEmail = alertDetail.user?.email || null;
  const touristPhone = alertDetail.user?.phone || null;
  const touristAvatar = alertDetail.user?.avatar || null;
  const touristInitials = touristName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'T';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Emergency Incident Inspection: ${alertDetail.type || 'MANUAL_SOS'}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Top Incident Summary */}
        <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-wide">
                  {alertDetail.type || 'MANUAL_SOS'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase text-[10px] animate-pulse">
                  {alertDetail.priority || 'CRITICAL'} PRIORITY
                </span>
              </div>
              <p className="text-slate-200 mt-1.5 font-medium leading-relaxed">{alertDetail.message}</p>
            </div>

            <StatusBadge status={alertDetail.status || 'Pending'} />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-red-500/20 gap-2">
            <span className="flex items-center gap-1 font-mono text-cyan-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Timestamp: {new Date(alertDetail.timestamp).toLocaleString()}</span>
            </span>
            <span className="font-mono text-slate-400">Incident ID: {alertDetail.id}</span>
          </div>
        </div>

        {/* Telemetry Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Traveller & Contact Info */}
          <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3">
            <p className="font-bold text-white/70 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-honey" />
              Traveller Identity
            </p>
            <div className="flex items-center gap-3">
              {touristAvatar ? (
                <img
                  src={touristAvatar}
                  alt={touristName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-honey/40 flex-shrink-0 bg-black/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{ display: touristAvatar ? 'none' : 'flex' }}
                className="w-12 h-12 rounded-full bg-honey/20 border-2 border-honey/40 flex items-center justify-center font-black text-honey text-sm flex-shrink-0"
              >
                {touristInitials}
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-extrabold text-white truncate">{touristName}</p>
                {touristEmail && (
                  <p className="text-white/80 flex items-center gap-1 text-[11px] truncate">
                    <Mail className="w-3 h-3 text-honey flex-shrink-0" />
                    <span>{touristEmail}</span>
                  </p>
                )}
                {touristPhone && (
                  <p className="text-white/80 flex items-center gap-1 text-[11px]">
                    <Phone className="w-3 h-3 text-honey flex-shrink-0" />
                    <span>{touristPhone}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-white/60 text-[11px]">
                User ID: <span className="font-mono text-white/90">{touristId}</span>
              </p>
            </div>
          </div>

          {/* GPS Coordinates & Map Link */}
          <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white/70 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                {hasCoords ? <MapPin className="w-3.5 h-3.5 text-honey" /> : <MapPinOff className="w-3.5 h-3.5 text-amber-400" />}
                GPS Location
              </p>
              {hasCoords && (
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-honey hover:underline flex items-center gap-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {hasCoords ? (
              <div className="space-y-1">
                <p className="font-mono text-honey font-bold text-xs">
                  Latitude: {lat}
                </p>
                <p className="font-mono text-honey font-bold text-xs">
                  Longitude: {lng}
                </p>
                {alertDetail.location?.name && (
                  <p className="text-white/80 text-[11px] mt-1">{alertDetail.location.name}</p>
                )}
              </div>
            ) : (
              <div className="py-2">
                <p className="text-amber-400 font-semibold text-xs">
                  Coordinates Unavailable
                </p>
                <p className="text-white/50 text-[10px] mt-0.5">
                  GPS was turned off or permission was denied on the traveller device.
                </p>
              </div>
            )}
          </div>

          {/* Battery & Network Telemetry */}
          <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3">
            <p className="font-bold text-white/70 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              Power & Connectivity
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Battery Level:</span>
                <span className={`font-mono font-bold ${batteryColor}`}>
                  {batteryLevel != null ? `${batteryLevel}%` : 'Unavailable / Unknown'}
                </span>
              </div>
              {batteryLevel != null && (
                <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      batteryLevel < 20 ? 'bg-red-500' : batteryLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${batteryLevel}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-white/70">Network Status:</span>
                <span className="font-medium text-white/90">
                  {networkStatus || 'Unknown / Not Reported'}
                </span>
              </div>
            </div>
          </div>

          {/* Device & Trip Telemetry */}
          <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2.5">
            <p className="font-bold text-white/70 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-honey" />
              Device Intelligence & Telemetry
            </p>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Device Platform:</span>
                <span className="font-medium text-white/90">
                  {deviceInfo?.platform ? deviceInfo.platform.toUpperCase() : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Device Manufacturer:</span>
                <span className="font-medium text-white/90">{deviceInfo?.manufacturer || 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Device Model:</span>
                <span className="font-medium text-white/90">{deviceInfo?.model || 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Android Version:</span>
                <span className="font-mono text-white/90">{deviceInfo?.androidVersion || 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Device OS Version:</span>
                <span className="font-mono text-white/90">{deviceInfo?.osVersion || 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">App Version / Build:</span>
                <span className="font-mono text-white/90">
                  {deviceInfo?.appVersion ? `v${deviceInfo.appVersion} (${deviceInfo.appBuildNumber || '1'})` : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Charging Status:</span>
                <span className="font-medium text-emerald-400">{deviceInfo?.batteryChargingStatus || 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Network Type:</span>
                <span className="font-medium text-white/90">
                  {deviceInfo?.networkConnectionType || networkStatus || 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Last Telemetry Ping:</span>
                <span className="font-mono text-honey text-[10px]">
                  {deviceInfo?.lastTelemetryUpdate ? new Date(deviceInfo.lastTelemetryUpdate).toLocaleTimeString() : (alertDetail.timestamp ? new Date(alertDetail.timestamp).toLocaleTimeString() : 'Unavailable')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-white/70">Associated Trip:</span>
                <span className="font-medium text-honey">
                  {alertDetail.tripId ? `ID: ${alertDetail.tripId}` : (alertDetail.tripInfo || 'None')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rescue Notes & Chronological Incident Log */}
        <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-honey" />
            Incident Action & Telemetry Log
          </h4>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {alertDetail.rescueNotes && alertDetail.rescueNotes.length > 0 ? (
              alertDetail.rescueNotes.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#25433E] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span className="font-bold text-honey">{log.author || 'System'}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-white/90">{log.note}</p>
                </div>
              ))
            ) : (
              <p className="text-white/50 italic">No notes logged yet.</p>
            )}
          </div>
        </div>

        {/* Incident Command: Status Update & Action Note */}
        <form onSubmit={handleStatusSubmit} className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3">
          <p className="font-bold text-honey flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Update Alert Status & Log Command Note
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-white/70 mb-1 text-[11px] font-semibold">Incident Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#25433E] border border-white/15 text-white font-bold"
              >
                <option value="">Keep ({alertDetail.status})</option>
                <option value="Pending">Pending</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-white/70 mb-1 text-[11px] font-semibold">Command Action Note</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. SOS acknowledged by operator. Emergency services contacted."
                  className="w-full px-3 py-2 rounded-xl bg-[#25433E] border border-white/15 text-white placeholder-white/40"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-honey hover:brightness-105 text-[#25433E] font-black whitespace-nowrap shadow-md transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
