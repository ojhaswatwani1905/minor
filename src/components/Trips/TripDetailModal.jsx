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
      <div className="space-y-6 text-xs select-none">
        {/* Header Trip Card */}
        <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-sans">{tripDetail.destination}</h3>
                <StatusBadge status={tripDetail.status} />
              </div>
              <p className="text-white/70 font-sans mt-0.5">{tripDetail.route}</p>
            </div>

            <div className="flex items-center gap-2 bg-honey/20 border border-honey/40 px-3 py-1.5 rounded-xl font-mono text-honey font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-honey" />
              <span>{tripDetail.boundaryRadiusKm} km Safety Radius</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-white/70 font-sans">
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
              <p className={`font-extrabold mt-0.5 ${tripDetail.geofenceViolated ? 'text-red-400' : 'text-emerald-300'}`}>
                {tripDetail.geofenceViolated ? 'Boundary Violated' : 'Safe Perimeter'}
              </p>
            </div>
          </div>
        </div>

        {/* Tourist & Guardian Details */}
        {tripDetail.user && (
          <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-honey/20 text-honey font-bold flex items-center justify-center">
                {tripDetail.user.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white font-sans">{tripDetail.user.fullName}</p>
                <p className="text-white/70 font-sans">{tripDetail.user.phone} • {tripDetail.user.email}</p>
              </div>
            </div>

            {tripDetail.user.guardians?.[0] && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
                <p className="font-bold text-honey font-sans">Primary Guardian:</p>
                <p className="text-white font-sans">{tripDetail.user.guardians[0].name} ({tripDetail.user.guardians[0].relation})</p>
                <p className="text-white/70 font-mono">{tripDetail.user.guardians[0].phone}</p>
              </div>
            )}
          </div>
        )}

        {/* Checkpoint Progression Timeline */}
        <div className="p-5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-white flex items-center gap-2 font-sans">
              <Clock className="w-4 h-4 text-honey" />
              Checkpost Timeline Progression
            </h4>
            <span className="text-[10px] text-white/60 font-mono">
              {tripDetail.checkpoints?.length || 0} Checkpoints Logged
            </span>
          </div>

          <div className="space-y-4 relative pl-4 border-l-2 border-white/15 ml-2">
            {tripDetail.checkpoints?.map((cp, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline node icon */}
                <div className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 bg-[#1E3732] flex items-center justify-center ${
                  cp.status === 'Passed' ? 'border-emerald-400 text-emerald-400' : cp.status === 'In Progress' ? 'border-honey text-honey animate-ping' : 'border-white/40 text-white/40'
                }`} />

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="font-bold text-white font-sans">{cp.name}</p>
                    <p className="text-[10px] text-white/60">
                      {cp.time ? `Checkpost Ping: ${new Date(cp.time).toLocaleString()}` : 'Scheduled Checkpoint'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    cp.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : cp.status === 'In Progress' ? 'bg-honey/20 text-honey border border-honey/40' : 'bg-white/10 text-white/60'
                  }`}>
                    {cp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Checkpoint Ping Form */}
        <form onSubmit={handleCheckpointSubmit} className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-3 shadow-sm">
          <p className="font-extrabold text-honey flex items-center gap-1.5 font-sans">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-honey/50 font-sans"
                required
              />
            </div>
            <div>
              <select
                value={newCheckpointStatus}
                onChange={(e) => setNewCheckpointStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-honey/50 font-sans font-bold cursor-pointer"
              >
                <option value="Passed" className="bg-[#1E3732] text-white">🟢 Passed</option>
                <option value="In Progress" className="bg-[#1E3732] text-white">🟡 In Progress</option>
                <option value="Pending" className="bg-[#1E3732] text-white">⚪ Pending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 rounded-xl bg-honey hover:brightness-105 text-[#25433E] font-black text-xs shadow-md transition-all active:scale-95"
            >
              {adding ? 'Saving...' : 'Add Checkpoint'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
