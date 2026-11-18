import React from 'react';
import { Compass, ShieldCheck, Radio, MapPin, Activity, Users } from 'lucide-react';

export const SafetyHeroCards = ({ stats }) => {
  const activeExpeditions = stats?.activeTrips?.value ?? 4;
  const registeredTourists = stats?.totalUsers?.value ?? 850;
  const deadManTick = stats?.networkStatus?.value || "15s Heartbeat";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Warm Mustard Honey Card (Reference Signature Style) */}
      <div 
        style={{ backgroundColor: '#E5A93C' }}
        className="p-6 rounded-3xl bg-gradient-to-br from-[#E5A93C] via-[#DF9E2E] to-[#CD8D20] text-white shadow-xl relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1 select-none"
      >
        {/* Subtle Organic Contour Lines SVG */}
        <svg viewBox="0 0 200 120" className="absolute -top-4 -left-4 w-60 h-40 opacity-30 pointer-events-none" fill="none" stroke="white" strokeWidth="1.2">
          <path d="M-10,30 Q60,10 110,60 T220,50" />
          <path d="M-10,60 Q70,40 120,90 T220,80" />
          <path d="M-10,90 Q80,70 130,120 T220,110" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-white/95 tracking-wide font-sans">
                Active Expeditions & Corridors
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tight font-sans">
                {activeExpeditions} Corridors
              </h3>
            </div>
            
            {/* Safety Compass Icon */}
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-md">
              <Compass className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/25 flex items-center justify-between text-xs text-white/95 font-medium">
            <span>Live Himalayan Patrol</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/30 text-[10px] font-black uppercase tracking-wider">
              READY
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Deep Pine Green Card (Reference Signature Style) */}
      <div 
        style={{ backgroundColor: '#24403B' }}
        className="p-6 rounded-3xl bg-gradient-to-br from-[#24403B] via-[#1E3732] to-[#172B27] text-white shadow-xl relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1 select-none"
      >
        {/* Subtle Organic Contour Lines SVG */}
        <svg viewBox="0 0 200 120" className="absolute -top-4 -left-4 w-60 h-40 opacity-25 pointer-events-none" fill="none" stroke="white" strokeWidth="1.2">
          <path d="M-10,20 Q50,45 100,25 T220,35" />
          <path d="M-10,50 Q60,75 110,55 T220,65" />
          <path d="M-10,80 Q70,105 120,85 T220,95" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-white/90 tracking-wide font-sans">
                Dead Man's Safety Switch
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tight font-sans">
                100% Active
              </h3>
            </div>

            {/* Mesh Daemon Radio Icon */}
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-md">
              <Radio className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90 font-medium">
            <span>Safety Daemon Interval</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/25 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              15s TICK
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Deep Forest Teal with Dotted Route Network & Golden Arcs (Reference Signature Style) */}
      <div 
        style={{ backgroundColor: '#284B46' }}
        className="p-6 rounded-3xl bg-gradient-to-br from-[#284B46] via-[#213F3A] to-[#1A332F] text-white shadow-xl relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1 select-none"
      >
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-xs font-semibold text-white/80 tracking-wide font-sans">
              Monitored Travellers
            </p>
            <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tight font-sans">
              {registeredTourists}
            </h3>
          </div>

          {/* Dotted Route Arcs Visual */}
          <div className="w-28 h-14 relative flex items-center justify-center">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              <g fill="#FFFFFF" opacity="0.25">
                <circle cx="10" cy="15" r="1.2" />
                <circle cx="25" cy="18" r="1.2" />
                <circle cx="40" cy="12" r="1.2" />
                <circle cx="55" cy="22" r="1.2" />
                <circle cx="70" cy="16" r="1.2" />
                <circle cx="85" cy="28" r="1.2" />
                <circle cx="100" cy="18" r="1.2" />
                <circle cx="115" cy="24" r="1.2" />
                <circle cx="20" cy="35" r="1.2" />
                <circle cx="35" cy="42" r="1.2" />
                <circle cx="65" cy="38" r="1.2" />
                <circle cx="80" cy="45" r="1.2" />
                <circle cx="95" cy="40" r="1.2" />
                <circle cx="110" cy="44" r="1.2" />
              </g>
              <path d="M 20 30 Q 55 5, 95 25" fill="none" stroke="#E5A93C" strokeWidth="1.8" />
              <path d="M 40 40 Q 75 18, 110 32" fill="none" stroke="#E5A93C" strokeWidth="1.2" strokeDasharray="3, 3" />
              <circle cx="20" cy="30" r="2.5" fill="#E5A93C" />
              <circle cx="95" cy="25" r="3" fill="#E5A93C" />
              <circle cx="110" cy="32" r="2.5" fill="#E5A93C" />
            </svg>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80 font-medium relative z-10">
          <span>Active Himalayan Grid</span>
          <span className="px-2.5 py-0.5 rounded-full bg-honey text-[#25433E] text-[10px] font-black uppercase tracking-wider">
            STABLE
          </span>
        </div>
      </div>
    </div>
  );
};
