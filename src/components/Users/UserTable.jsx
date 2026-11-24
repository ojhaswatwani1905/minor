import React from 'react';
import { Eye, Edit3, Trash2, Battery, BatteryCharging, Wifi, ShieldAlert, Phone, MapPin } from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';

export const UserTable = ({ users, onView, onEdit, onDelete }) => {
  if (!users || users.length === 0) {
    return (
      <div className="p-12 text-center glass-card text-slate-400 space-y-3">
        <ShieldAlert className="w-10 h-10 text-honey mx-auto opacity-70" />
        <h4 className="text-base font-extrabold text-[#192E2A]">No Tourists Found</h4>
        <p className="text-xs">No registered tourist profiles match your current search or status filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/90 bg-white/80 backdrop-blur-xl shadow-lg select-none">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-extrabold uppercase tracking-wider">
            <th className="p-4">Tourist Info</th>
            <th className="p-4">Current Status</th>
            <th className="p-4">Telemetry (Battery / Signal)</th>
            <th className="p-4">Emergency Contact</th>
            <th className="p-4">Last Location</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {users.map((u) => {
            const hasCoords = u.currentLocation?.lat != null && u.currentLocation?.lng != null;
            const hasBattery = u.batteryLevel != null && !isNaN(u.batteryLevel);

            return (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                {/* Tourist info */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-2xl object-cover border border-pine/20 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: u.avatar ? 'none' : 'flex' }}
                      className="w-10 h-10 rounded-2xl bg-pine/10 text-pine border border-pine/20 font-black items-center justify-center text-sm shadow-sm"
                    >
                      {(u.fullName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-[#192E2A] group-hover:text-pine transition-colors">{u.fullName}</p>
                      <p className="text-[11px] text-slate-400">{u.email || 'Email unavailable'}</p>
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
                      <Battery className={`w-4 h-4 ${u.batteryLevel < 20 ? 'text-red-500 animate-pulse' : u.batteryLevel < 50 ? 'text-honey' : 'text-emerald-600'}`} />
                      <span className="font-mono font-bold text-[#192E2A]">{u.batteryLevel}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.batteryLevel < 20 ? 'bg-red-500' : u.batteryLevel < 50 ? 'bg-honey' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, Math.max(0, u.batteryLevel))}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Battery className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] italic">Awaiting telemetry</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Wifi className="w-3 h-3 text-pine" />
                    <span>{u.networkSignal || 'Pending Sync'}</span>
                  </div>
                </td>

                {/* Emergency Contact */}
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-[#192E2A] font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.phone}</span>
                  </div>
                  {u.guardians?.[0] && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Guardian: {u.guardians[0].name} ({u.guardians[0].relation})
                    </p>
                  )}
                </td>

                {/* Last Location */}
                <td className="p-4">
                  {hasCoords ? (
                    <div>
                      <p className="font-semibold text-[#192E2A] truncate max-w-[180px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-pine shrink-0" />
                        <span>{u.currentLocation?.name || 'Mobile GPS Fix'}</span>
                      </p>
                      <p className="text-[10px] text-pine font-mono mt-0.5">
                        {Number(u.currentLocation.lat).toFixed(4)}, {Number(u.currentLocation.lng).toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-honey flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-honey shrink-0" />
                        <span>No GPS Fix (Offline)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 italic">Device inactive / no coordinates</p>
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(u.id)}
                      className="p-2 rounded-xl bg-pine/10 text-pine hover:bg-pine/20 border border-pine/25 transition-colors"
                      title="View Full Details & Telemetry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(u)}
                      className="p-2 rounded-xl bg-honey/15 text-[#C48419] hover:bg-honey/25 border border-honey/30 transition-colors"
                      title="Edit Tourist Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(u.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-colors"
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
