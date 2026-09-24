import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  User, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Plus,
  Radio
} from 'lucide-react';

export const TripDetailModal = ({ isOpen, onClose, tripDetail, onAddCheckpoint }) => {
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [newCheckpointStatus, setNewCheckpointStatus] = useState('Passed');
  const [adding, setAdding] = useState(false);

  if (!tripDetail) return null;

  const handleCheckpointSubmit = async (e) => {
    e.preventDefault();
    if (!newCheckpointName) return;
    try {
      setAdding(true);
      await onAddCheckpoint(tripDetail.id, {
        name: newCheckpointName,
        status: newCheckpointStatus
      });
      setNewCheckpointName('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Expedition Timeline: ${tripDetail.destination}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Header Trip Card */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{tripDetail.destination}</h3>
                <StatusBadge status={tripDetail.status} />
              </div>
              <p className="text-slate-400 mt-0.5">{tripDetail.route}</p>
            </div>

            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-mono text-cyan-400 font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>{tripDetail.boundaryRadiusKm} km Safety Radius</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/60 text-slate-400">
            <div>
              <span>Start Date:</span>
              <p className="font-bold text-white mt-0.5">{new Date(tripDetail.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span>Expected Arrival:</span>
              <p className="font-bold text-white mt-0.5">{new Date(tripDetail.expectedArrival).toLocaleDateString()}</p>
            </div>
            <div>
              <span>Geofence Status:</span>
              <p className={`font-bold mt-0.5 ${tripDetail.geofenceViolated ? 'text-red-400' : 'text-emerald-400'}`}>
                {tripDetail.geofenceViolated ? 'Boundary Violated' : 'Safe Perimeter'}
              </p>
            </div>
          </div>
        </div>

        {/* Tourist & Guardian Details */}
        {tripDetail.user && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-bold flex items-center justify-center">
                {tripDetail.user.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{tripDetail.user.fullName}</p>
                <p className="text-slate-400">{tripDetail.user.phone} • {tripDetail.user.email}</p>
              </div>
            </div>

            {tripDetail.user.guardians?.[0] && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px]">
                <p className="font-bold text-cyan-400">Primary Guardian:</p>
                <p className="text-slate-200">{tripDetail.user.guardians[0].name} ({tripDetail.user.guardians[0].relation})</p>
                <p className="text-slate-400 font-mono">{tripDetail.user.guardians[0].phone}</p>
              </div>
            )}
          </div>
        )}

        {/* Checkpoint Progression Timeline */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Checkpost Timeline Progression
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              {tripDetail.checkpoints?.length || 0} Checkpoints Logged
            </span>
          </div>

          <div className="space-y-4 relative pl-4 border-l-2 border-slate-800 ml-2">
            {tripDetail.checkpoints?.map((cp, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline node icon */}
                <div className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 bg-slate-900 flex items-center justify-center ${
                  cp.status === 'Passed' ? 'border-emerald-500 text-emerald-400' : cp.status === 'In Progress' ? 'border-cyan-400 text-cyan-400 animate-ping' : 'border-slate-600 text-slate-600'
                }`} />

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{cp.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {cp.time ? `Checkpost Ping: ${new Date(cp.time).toLocaleString()}` : 'Scheduled Checkpoint'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cp.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : cp.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Checkpoint Ping Form */}
        <form onSubmit={handleCheckpointSubmit} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <p className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Add Checkpost Ping to Timeline
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newCheckpointName}
                onChange={(e) => setNewCheckpointName(e.target.value)}
                placeholder="e.g. Rohtang North Viewpoint Ridge"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={newCheckpointStatus}
                onChange={(e) => setNewCheckpointStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="Passed">Passed</option>
                <option value="In Progress">In Progress</option>
                <option value="Alert Triggered">Alert Triggered</option>
              </select>

              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold whitespace-nowrap shadow"
              >
                {adding ? 'Logging...' : 'Add Ping'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
