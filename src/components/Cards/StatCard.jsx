import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export const StatCard = ({ title, value, trend, icon: Icon, color = 'cyan', highlight = false }) => {
  const colorMap = {
    cyan: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20',
    emerald: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
    blue: 'bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/20',
    red: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
    amber: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20',
    purple: 'bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/20',
  };

  const selectedColor = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 apple-card bg-white dark:bg-[#242426] shadow-apple dark:shadow-apple-dark ${
        highlight
          ? 'border-[#FF3B30]/50 bg-gradient-to-br from-red-950/30 via-[#242426] to-[#242426] shadow-red-500/10 animate-pulse-slow'
          : 'border-slate-200/80 dark:border-[#38383A]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>

        <div className={`p-3 rounded-2xl border ${selectedColor} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (() => {
        const trendStr = typeof trend === 'string' ? trend : (trend?.value || '');
        return (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
            {trendStr.includes('+') ? (
              <span className="flex items-center gap-1 text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full border border-[#34C759]/20 text-[11px] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                {trendStr}
              </span>
            ) : trendStr.includes('-') ? (
              <span className="flex items-center gap-1 text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full border border-[#007AFF]/20 text-[11px] font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                {trendStr}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#FF9500] bg-[#FF9500]/10 px-2.5 py-0.5 rounded-full border border-[#FF9500]/20 text-[11px] font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                {trendStr}
              </span>
            )}
            <span className="text-slate-400 text-[11px]">vs last month</span>
          </div>
        );
      })()}

      {/* Ambient background glow */}
      <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#007AFF]/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
