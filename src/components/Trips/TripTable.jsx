import React from 'react';
import { Eye, Edit3, Trash2, MapPin, Compass, ShieldAlert, Clock } from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const TripTable = ({ trips, onView, onEdit, onDelete }) => {
  if (!trips || trips.length === 0) {
    return (
      <div className="p-12 text-center glass-card text-slate-400 space-y-3">
        <MapPin className="w-10 h-10 text-honey mx-auto opacity-70" />
        <h4 className="text-base font-extrabold text-[#192E2A]">No Expedition Trips Found</h4>
        <p className="text-xs">No active or scheduled tourist expeditions match your search parameters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/90 bg-white/80 backdrop-blur-xl shadow-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-extrabold uppercase tracking-wider">
            <th className="p-4">Destination & Route</th>
            <th className="p-4">Assigned Tourist</th>
            <th className="p-4">Status & Geofence</th>
            <th className="p-4">Safety Radius</th>
            <th className="p-4">Expected Arrival</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {trips.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
              {/* Destination & Route */}
              <td className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pine/10 text-pine flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 border border-pine/20">
                    <Compass className="w-5 h-5 text-pine" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#192E2A] group-hover:text-pine transition-colors">{t.destination}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{t.route}</p>
                  </div>
                </div>
              </td>

              {/* Tourist */}
              <td className="p-4">
                <p className="font-extrabold text-[#192E2A]">{t.userName}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {t.userId}</p>
              </td>

              {/* Status & Geofence alert */}
              <td className="p-4 space-y-1">
                <StatusBadge status={t.status} />
                {t.geofenceViolated && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    <ShieldAlert className="w-3 h-3 animate-pulse" />
                    Boundary Crossed
                  </div>
                )}
              </td>

              {/* Safety Radius */}
              <td className="p-4">
                <span className="font-extrabold font-mono text-pine bg-pine/10 px-2.5 py-1 rounded-xl border border-pine/20">
                  {t.boundaryRadiusKm} km radius
                </span>
              </td>

              {/* Expected Arrival */}
              <td className="p-4">
                <div className="flex items-center gap-1.5 text-[#192E2A] font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{new Date(t.expectedArrival).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {new Date(t.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </td>

              {/* Actions */}
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(t.id)}
                    className="p-2 rounded-xl bg-pine/10 text-pine hover:bg-pine/20 border border-pine/25 transition-colors"
                    title="View Timeline & Checkpoints"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 rounded-xl bg-honey/15 text-[#C48419] hover:bg-honey/25 border border-honey/30 transition-colors"
                    title="Edit Trip Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors"
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
