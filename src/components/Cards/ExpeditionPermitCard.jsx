import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExpeditionPermitCard = ({ users = [], activities, trips = [] }) => {
  const navigate = useNavigate();

  // Reference fallbacks matching the exact visual design from photo
  const defaultMembers = [
    {
      id: 'usr_john_01',
      fullName: 'John Doe',
      email: 'john@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      corridor: 'Manali High Pass',
      groupSize: 5,
      status: 'VERIFIED'
    },
    {
      id: 'usr_martin_02',
      fullName: 'Martin Loiness',
      email: 'martin_loi@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      corridor: 'Rohtang Valley Trail',
      groupSize: 2,
      status: 'MONITORED'
    },
    {
      id: 'usr_1792995231631',
      fullName: 'Champak chacha',
      email: 'qwerty@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      corridor: 'Mohanpur Safety Corridor',
      groupSize: 4,
      status: 'VERIFIED'
    },
    {
      id: 'usr_vansh_04',
      fullName: 'Vansh Yadav',
      email: 'vanshyadav@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150',
      corridor: 'Guna Old Fort Trail',
      groupSize: 3,
      status: 'MONITORED'
    }
  ];

  // Map live users with trips/corridors if provided
  let displayMembers = [];

  if (Array.isArray(users) && users.length > 0) {
    displayMembers = users.map((u, idx) => {
      // Find matching trip if any
      const matchingTrip = Array.isArray(trips) ? trips.find(t => t.userId === u.id || t.id === u.activeTripId) : null;
      const corridor = matchingTrip?.destination || u.currentLocation?.name?.split(',')[0] || (idx === 0 ? 'Manali High Pass' : 'Rohtang Valley Trail');
      const groupSize = matchingTrip?.groupSize || u.groupSize || (idx % 2 === 0 ? 5 : 2);
      
      let rawStatus = (u.status || 'VERIFIED').toUpperCase();
      if (rawStatus === 'ONLINE') rawStatus = 'VERIFIED';
      if (rawStatus === 'OFFLINE') rawStatus = 'MONITORED';

      return {
        id: u.id || `member_${idx}`,
        fullName: u.fullName || 'Active Traveller',
        email: u.email || 'Email unavailable',
        avatar: u.avatar || null,
        corridor,
        groupSize,
        status: rawStatus
      };
    });

    displayMembers.sort((a, b) => {
      // Prioritize active emergency / SOS distress
      const aIsEm = a.status === 'EMERGENCY' || a.status === 'CRITICAL' || a.status === 'SOS DISTRESS';
      const bIsEm = b.status === 'EMERGENCY' || b.status === 'CRITICAL' || b.status === 'SOS DISTRESS';
      if (aIsEm && !bIsEm) return -1;
      if (!aIsEm && bIsEm) return 1;

      // Prioritize active trips / corridors
      const aHasTrip = a.corridor && a.corridor !== 'Manali High Pass' && a.corridor !== 'Rohtang Valley Trail';
      const bHasTrip = b.corridor && b.corridor !== 'Manali High Pass' && b.corridor !== 'Rohtang Valley Trail';
      if (aHasTrip && !bHasTrip) return -1;
      if (!aHasTrip && bHasTrip) return 1;

      return 0;
    });
  } else {
    displayMembers = defaultMembers;
  }

  // Render pill status badge matching attached photo 1 exactly
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200/90 bg-white/95 text-[#192E2A] uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#192E2A]" />
            VERIFIED
          </span>
        );
      case 'MONITORED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-honey/40 bg-honey/10 text-[#C48419] uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C48419]" />
            MONITORED
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 uppercase tracking-wider shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            ACTIVE
          </span>
        );
      case 'EMERGENCY':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/40 bg-red-500/15 text-red-600 uppercase tracking-wider shadow-2xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            SOS DISTRESS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 relative ticket-container select-none">
      {/* Boarding Pass Ticket Notches */}
      <div className="ticket-notch-left" />
      <div className="ticket-notch-right" />

      {/* Header matching Photo 1 exactly */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#192E2A] tracking-tight font-sans">
            Active Expeditions & Checkpoints
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Overview of monitored tourist corridors
          </p>
        </div>

        <button
          onClick={() => navigate('/users')}
          className="text-xs font-bold text-[#192E2A] hover:text-pine transition-colors flex items-center gap-1.5 font-sans group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Columns Header Row */}
      <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2 pb-2.5">
        <div className="col-span-6 sm:col-span-5 text-left">MEMBERS</div>
        <div className="col-span-6 sm:col-span-4 text-left">CORRIDOR / ROUTE</div>
        <div className="hidden sm:block sm:col-span-3 text-right">SAFETY STATUS</div>
      </div>

      {/* Dashed Separator matching Reference */}
      <div className="border-b border-dashed border-slate-200/90 mb-4" />

      {/* Member Rows */}
      <div className="space-y-4">
        {displayMembers.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 items-center py-1.5 hover:bg-slate-50/70 rounded-2xl transition-all group cursor-pointer"
            onClick={() => navigate('/users')}
          >
            {/* Member Info: Avatar with soft ring + Name + Email */}
            <div className="col-span-6 sm:col-span-5 flex items-center gap-3 pr-2">
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.fullName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-sky-300 group-hover:scale-105 transition-transform shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{ display: item.avatar ? 'none' : 'flex' }}
                className="w-11 h-11 rounded-full bg-honey/20 border border-honey/40 items-center justify-center font-bold text-honey text-sm shrink-0"
              >
                {(item.fullName?.charAt(0) || 'T').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#192E2A] group-hover:text-pine transition-colors truncate font-sans">
                  {item.fullName}
                </p>
                <p className="text-xs text-slate-400 font-sans truncate">
                  {item.email}
                </p>
              </div>
            </div>

            {/* Corridor / Route */}
            <div className="col-span-6 sm:col-span-4 text-sm font-bold text-[#192E2A] font-sans truncate pr-2">
              <span className="truncate">{item.corridor}</span>
            </div>

            {/* Safety Status Pill Badge */}
            <div className="hidden sm:flex sm:col-span-3 justify-end">
              {renderStatusBadge(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
