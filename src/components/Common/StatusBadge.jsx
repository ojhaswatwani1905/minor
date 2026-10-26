import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'online':
      case 'active':
      case 'passed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      case 'pending':
      case 'manual_sos':
      case 'manual sos':
      case 'critical':
      case 'emergency':
      case 'sos request':
      case 'active rescue':
        return 'bg-red-500/25 text-red-400 border-red-500/50 animate-pulse';
      case 'acknowledged':
      case 'under monitoring':
      case 'warning':
      case 'offline':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};
