import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'online':
      case 'active':
      case 'passed':
      case 'verified':
        return 'bg-pine/10 text-pine border-pine/25';
      case 'pending':
      case 'manual_sos':
      case 'manual sos':
      case 'critical':
      case 'emergency':
      case 'sos request':
      case 'active rescue':
        return 'bg-red-500/15 text-red-600 border-red-500/30 animate-pulse';
      case 'acknowledged':
      case 'under monitoring':
      case 'monitored':
      case 'warning':
      case 'offline':
        return 'bg-honey/15 text-[#C48419] border-honey/30';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};
