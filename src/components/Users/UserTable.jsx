import React from 'react';
import { Eye, Edit3, Trash2, Battery, BatteryCharging, Wifi, ShieldAlert, Phone, MapPin } from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const UserTable = ({ users, onView, onEdit, onDelete }) => {
  if (!users || users.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
        <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-white">No Tourists Found</h4>
        <p className="text-xs">No registered tourist profiles match your current search or status filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider">
            <th className="p-4">Tourist Info</th>
            <th className="p-4">Current Status</th>
            <th className="p-4">Telemetry (Battery / Signal)</th>
            <th className="p-4">Emergency Contact</th>
            <th className="p-4">Last Location</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {users.map((u) => {
            const hasCoords = u.currentLocation?.lat != null && u.currentLocation?.lng != null;
            const hasBattery = u.batteryLevel != null && !isNaN(u.batteryLevel);

            return (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                {/* Tourist info */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {(u.fullName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{u.fullName}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="p-4">
                  <StatusBadge status={u.status} />
                </td>

                {/* Telemetry */}
                <td className="p-4 space-y-1">
                  {hasBattery ? (
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${u.batteryLevel < 20 ? 'text-red-500 animate-pulse' : u.batteryLevel < 50 ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span className="font-mono font-bold text-slate-200">{u.batteryLevel}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.batteryLevel < 20 ? 'bg-red-500' : u.batteryLevel < 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, Math.max(0, u.batteryLevel))}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Battery className="w-4 h-4 text-slate-600" />
                      <span className="text-[11px] italic">Awaiting telemetry</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span>{u.networkSignal || 'Pending Sync'}</span>
                  </div>
                </td>

                {/* Emergency Contact */}
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.phone}</span>
                  </div>
                  {u.guardians?.[0] && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Guardian: {u.guardians[0].name} ({u.guardians[0].relation})
                    </p>
                  )}
                </td>

                {/* Last Location */}
                <td className="p-4">
                  {hasCoords ? (
                    <div>
                      <p className="font-semibold text-slate-200 truncate max-w-[180px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{u.currentLocation?.name || 'Mobile GPS Fix'}</span>
                      </p>
                      <p className="text-[10px] text-cyan-400 font-mono mt-0.5">
                        {Number(u.currentLocation.lat).toFixed(4)}, {Number(u.currentLocation.lng).toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-amber-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>No GPS Fix (Offline)</span>
                      </p>
                      <p className="text-[10px] text-slate-500 italic">Device inactive / no coordinates</p>
                    </div>
                  )}
                </td>

              {/* Actions */}
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(u.id)}
                    className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                    title="View Full Details & Telemetry"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(u)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                    title="Edit Tourist Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(u.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                    title="Delete Tourist Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
};
