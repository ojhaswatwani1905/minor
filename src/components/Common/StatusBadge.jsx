import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'active':
      case 'resolved':
      case 'passed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'emergency':
      case 'critical':
      case 'sos request':
      case 'fall detection':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'offline':
      case 'warning':
      case 'under monitoring':
      case 'no movement':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
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
