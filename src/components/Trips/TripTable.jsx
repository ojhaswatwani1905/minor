import React from 'react';
import { Eye, Edit3, Trash2, MapPin, Compass, ShieldAlert, Clock } from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const TripTable = ({ trips, onView, onEdit, onDelete }) => {
  if (!trips || trips.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
        <MapPin className="w-10 h-10 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-white">No Expedition Trips Found</h4>
        <p className="text-xs">No active or scheduled tourist expeditions match your search parameters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider">
            <th className="p-4">Destination & Route</th>
            <th className="p-4">Assigned Tourist</th>
            <th className="p-4">Status & Geofence</th>
            <th className="p-4">Safety Radius</th>
            <th className="p-4">Expected Arrival</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {trips.map((t) => (
            <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
              {/* Destination & Route */}
              <td className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-white flex items-center justify-center shadow-md flex-shrink-0 mt-0.5">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{t.destination}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{t.route}</p>
                  </div>
                </div>
              </td>

              {/* Tourist */}
              <td className="p-4">
                <p className="font-bold text-slate-200">{t.userName}</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: {t.userId}</p>
              </td>

              {/* Status & Geofence alert */}
              <td className="p-4 space-y-1">
                <StatusBadge status={t.status} />
                {t.geofenceViolated && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                    <ShieldAlert className="w-3 h-3 animate-pulse" />
                    Boundary Crossed
                  </div>
                )}
              </td>

              {/* Safety Radius */}
              <td className="p-4">
                <span className="font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                  {t.boundaryRadiusKm} km radius
                </span>
              </td>

              {/* Expected Arrival */}
              <td className="p-4">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(t.expectedArrival).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {new Date(t.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </td>

              {/* Actions */}
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(t.id)}
                    className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                    title="View Timeline & Checkpoints"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                    title="Edit Trip Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                    title="Delete Trip Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
