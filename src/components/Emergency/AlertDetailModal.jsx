import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldAlert, 
  Plus, 
  Send, 
  CheckCircle2,
  Battery,
  Wifi
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Emergency Incident Command: ${alertDetail.type}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Top Incident Summary */}
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">{alertDetail.type}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase text-[10px] animate-pulse">
                  {alertDetail.priority} PRIORITY
                </span>
              </div>
              <p className="text-slate-300 mt-1 font-medium">{alertDetail.message}</p>
            </div>

            <StatusBadge status={alertDetail.status} />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-red-500/20">
            <span className="flex items-center gap-1 font-mono text-cyan-400">
              <MapPin className="w-3.5 h-3.5" />
              {alertDetail.location?.name} ({alertDetail.location?.lat}, {alertDetail.location?.lng})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(alertDetail.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tourist & Guardian Telemetry Card */}
        {alertDetail.user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Tourist Telemetry</p>
              <p className="text-sm font-bold text-white">{alertDetail.user.fullName}</p>
              <p className="text-slate-400">{alertDetail.user.phone}</p>
              <div className="flex items-center gap-4 text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  Battery: <strong>{alertDetail.user.batteryLevel}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  {alertDetail.user.networkSignal}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Registered Primary Guardian</p>
              {alertDetail.user.guardians?.[0] ? (
                <div>
                  <p className="text-sm font-bold text-cyan-400">{alertDetail.user.guardians[0].name}</p>
                  <p className="text-slate-300">{alertDetail.user.guardians[0].relation} • {alertDetail.user.guardians[0].phone}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => onNotifyGuardian(alertDetail.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 text-[11px]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{alertDetail.guardianNotified ? 'Resend Guardian SMS' : 'Dispatch Guardian SMS'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No primary guardian registered.</p>
              )}
            </div>
          </div>
        )}

        {/* Rescue Notes & Incident Log */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Rescue Action & Incident Log
          </h4>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {alertDetail.rescueLogs?.map((log, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-cyan-400">{log.author}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-200">{log.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Form: Update Status & Log Rescue Note */}
        <form onSubmit={handleStatusSubmit} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <p className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Log Rescue Action & Update Incident Status
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              >
                <option value="">Keep Status ({alertDetail.status})</option>
                <option value="Active Rescue">Active Rescue</option>
                <option value="Under Monitoring">Under Monitoring</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Rescue Command Note</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. SDRF Team 4 dispatched from checkpost base."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold whitespace-nowrap shadow"
                >
                  {submitting ? 'Saving...' : 'Update Incident'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
