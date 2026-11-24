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
  Phone 
} from 'lucide-react';

export const TouristTelemetryPanel = ({ tourist, movementHistory, onClose }) => {
  if (!tourist) return null;

  return (
    <div className="w-full lg:w-96 rounded-3xl bg-[#25433E] border border-white/10 shadow-2xl p-6 flex flex-col justify-between space-y-6 text-xs text-white animate-in slide-in-from-right duration-300 select-none">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-honey via-[#E5A93C] to-[#F3C878] text-[#25433E] font-black text-lg flex items-center justify-center shadow-lg">
              {tourist.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-sans">{tourist.fullName}</h3>
              </div>
              <div className="mt-1">
                <StatusBadge status={tourist.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Gauges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-1 shadow-sm">
            <p className="text-[10px] text-white/60 uppercase font-black flex items-center gap-1 font-sans">
              <Gauge className="w-3.5 h-3.5 text-honey" />
              Movement Speed
            </p>
            <p className="text-lg font-extrabold text-white font-mono flex items-baseline gap-1">
              {(() => {
                const hasGps = tourist?.location && tourist.location.lat != null && tourist.location.lng != null;
                if (!hasGps) {
                  return <span className="text-sm font-extrabold text-white/60">GPS unavailable</span>;
                }
                const lastPingTime = tourist?.lastPing ? new Date(tourist.lastPing).getTime() : 0;
                const isStale = tourist?.status === 'Offline' || 
                  tourist?.speedStatus === 'Stale location' || 
                  (!lastPingTime || (Date.now() - lastPingTime > 5 * 60 * 1000));
                if (isStale) {
                  return <span className="text-sm font-extrabold text-amber-300">Stale location</span>;
                }
                if (tourist?.speedKmH !== null && tourist?.speedKmH !== undefined && !isNaN(tourist.speedKmH)) {
                  const spd = Number(tourist.speedKmH);
                  if (spd <= 0.2) {
                    return <>0 <span className="text-xs text-white/60 font-normal">km/h</span></>;
                  }
                  return <>{spd.toFixed(1)} <span className="text-xs text-white/60 font-normal">km/h</span></>;
                }
                return <span className="text-sm font-extrabold text-honey animate-pulse">Calculating...</span>;
              })()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-1 shadow-sm">
            <p className="text-[10px] text-white/60 uppercase font-black flex items-center gap-1 font-sans">
              <Compass className="w-3.5 h-3.5 text-honey" />
              Heading Compass
            </p>
            <p className="text-sm font-extrabold text-honey font-mono mt-1">{tourist.headingDirection}</p>
          </div>
        </div>

        {/* Biometric IoT Health Sensors */}
        <div className="p-3.5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
          <p className="text-[10px] text-honey uppercase font-extrabold tracking-wider flex items-center gap-1 font-sans">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            Biometric Wearable Telemetry
          </p>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase font-sans">Heart Rate</p>
              <p className="text-sm font-extrabold text-red-300 font-mono mt-0.5">{tourist.biometrics?.heartRateBpm || 88} <span className="text-[9px] font-normal text-white/60">bpm</span></p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase font-sans">SpO2 Oxygen</p>
              <p className="text-sm font-extrabold text-emerald-300 font-mono mt-0.5">{tourist.biometrics?.oxygenSpO2 || 97}%</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase font-sans">Body Temp</p>
              <p className="text-sm font-extrabold text-honey font-mono mt-0.5">{tourist.biometrics?.bodyTempC || 36.6}°C</p>
            </div>
          </div>
        </div>

        {/* Battery & Signal Bar */}
        <div className="p-3.5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-white/80 font-medium">
            <span className="flex items-center gap-1.5 font-bold">
              <Battery className={`w-4 h-4 ${tourist.batteryLevel < 20 ? 'text-red-400 animate-pulse' : 'text-emerald-300'}`} />
              Battery: <strong className="text-white">{tourist.batteryLevel}%</strong>
            </span>
            <span className="flex items-center gap-1.5 text-honey font-bold">
              <Wifi className="w-4 h-4 text-honey" />
              {tourist.networkSignal}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${tourist.batteryLevel < 20 ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${tourist.batteryLevel}%` }}
            />
          </div>
        </div>

        {/* GPS Location & Geofence Details */}
        <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
          <p className="font-extrabold text-white/70 flex items-center gap-1.5 font-sans">
            <MapPin className="w-4 h-4 text-honey" />
            Active Location Fix
          </p>
          <p className="text-xs font-black text-white font-sans">{tourist.location?.name}</p>
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60 pt-1 border-t border-white/10">
            <span>Lat: {tourist.location?.lat}</span>
            <span>Lng: {tourist.location?.lng}</span>
            <span>Elev: {tourist.location?.elevation || 'N/A'}</span>
          </div>
        </div>

        {/* Movement Breadcrumb History Timeline */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-white flex items-center gap-1.5 font-sans">
            <Clock className="w-4 h-4 text-honey" />
            Movement Breadcrumb Timeline
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {movementHistory?.map((bh, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#1E3732] border border-white/10 flex items-center justify-between text-[11px]">
                <div>
                  <p className="font-bold text-white font-sans">{bh.locationName}</p>
                  <span className="text-[10px] text-white/60">{new Date(bh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-right font-mono text-white/70">
                  <p className="text-honey font-bold">{bh.speedKmH != null ? `${Number(bh.speedKmH).toFixed(1)} km/h` : '0 km/h'}</p>
                  <p className="text-[10px]">{bh.elevation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guardian Quick Contact */}
      {tourist.guardians?.[0] && (
        <div className="p-3.5 rounded-2xl bg-honey/15 border border-honey/30 text-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-black text-honey tracking-wider">Guardian Contact</p>
            <p className="font-extrabold text-white font-sans">{tourist.guardians[0].name} ({tourist.guardians[0].relation})</p>
            <p className="text-[11px] font-mono text-white/80">{tourist.guardians[0].phone}</p>
          </div>
          <Phone className="w-5 h-5 text-honey" />
        </div>
      )}
    </div>
  );
};
