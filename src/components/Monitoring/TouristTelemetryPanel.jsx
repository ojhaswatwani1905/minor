import React from 'react';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  X, 
  Radio, 
  Battery, 
  Wifi, 
  Gauge, 
  Compass, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Phone,
  UserCheck
} from 'lucide-react';

export const TouristTelemetryPanel = ({ tourist, movementHistory, onClose }) => {
  if (!tourist) return null;

  return (
    <div className="w-full lg:w-96 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 flex flex-col justify-between space-y-6 text-xs animate-in slide-in-from-right duration-300">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
              {tourist.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{tourist.fullName}</h3>
              </div>
              <StatusBadge status={tourist.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Gauges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Movement Speed
            </p>
            <p className="text-lg font-extrabold text-white font-mono">{tourist.speedKmH} <span className="text-xs text-slate-400 font-normal">km/h</span></p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Heading Compass
            </p>
            <p className="text-sm font-extrabold text-cyan-400 font-mono mt-1">{tourist.headingDirection}</p>
          </div>
        </div>

        {/* Biometric IoT Health Sensors */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
          <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            Biometric IoT Wearable Vitals
          </p>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Heart Rate</p>
              <p className="text-sm font-extrabold text-red-400 font-mono mt-0.5">{tourist.biometrics?.heartRateBpm || 88} <span className="text-[9px] font-normal text-slate-400">bpm</span></p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[9px] text-slate-400 font-bold uppercase">SpO2 Oxygen</p>
              <p className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">{tourist.biometrics?.oxygenSpO2 || 97}%</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Body Temp</p>
              <p className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">{tourist.biometrics?.bodyTempC || 36.6}°C</p>
            </div>
          </div>
        </div>

        {/* Battery & Signal Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Battery className={`w-4 h-4 ${tourist.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
              Battery: <strong className="text-white">{tourist.batteryLevel}%</strong>
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Wifi className="w-4 h-4" />
              {tourist.networkSignal}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${tourist.batteryLevel < 20 ? 'bg-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${tourist.batteryLevel}%` }}
            />
          </div>
        </div>

        {/* GPS Location & Geofence Details */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
          <p className="font-bold text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Active Location Marker
          </p>
          <p className="text-xs font-bold text-white">{tourist.location?.name}</p>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>Lat: {tourist.location?.lat}</span>
            <span>Lng: {tourist.location?.lng}</span>
            <span>Elev: {tourist.location?.elevation || 'N/A'}</span>
          </div>
        </div>

        {/* Movement Breadcrumb History Timeline */}
        <div className="space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            Movement Breadcrumb Timeline
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {movementHistory?.map((bh, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-[11px]">
                <div>
                  <p className="font-bold text-slate-200">{bh.locationName}</p>
                  <span className="text-[10px] text-slate-500">{new Date(bh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-right font-mono text-slate-400">
                  <p className="text-cyan-400 font-bold">{bh.speedKmH} km/h</p>
                  <p className="text-[10px]">{bh.elevation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guardian Quick Contact */}
      {tourist.guardians?.[0] && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-slate-300 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-cyan-400">Guardian Contact</p>
            <p className="font-bold text-white">{tourist.guardians[0].name} ({tourist.guardians[0].relation})</p>
            <p className="text-[11px] font-mono text-slate-400">{tourist.guardians[0].phone}</p>
          </div>
          <Phone className="w-5 h-5 text-cyan-400" />
        </div>
      )}
    </div>
  );
};
