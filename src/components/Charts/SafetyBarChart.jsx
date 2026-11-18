import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SafetyBarChart = ({ users = [], stats }) => {
  const navigate = useNavigate();

  // Dynamic user count from live users array or stats fallback
  const totalCount = Array.isArray(users) && users.length > 0 
    ? users.length 
    : (stats?.totalUsers?.value ?? 4);

  const data = [
    { month: 'Jan', active: 3.2, newUsers: 2.1, label: '5.3k' },
    { month: 'Feb', active: 3.6, newUsers: 3.7, label: '7.3k' },
    { month: 'Mar', active: 4.3, newUsers: 3.0, label: '7.3k' },
    { month: 'Apr', active: 2.9, newUsers: 2.5, label: '5.4k' },
    { month: 'May', active: 7.2, newUsers: 0.0, label: '7.2k' },
    { month: 'Jun', active: 2.7, newUsers: 3.8, label: '6.5k' },
  ];

  const yTicks = ['8k', '6k', '4k', '2k', '0'];

  return (
    <div className="glass-card p-6 md:p-7 flex flex-col justify-between h-full select-none">
      <div>
        {/* Card Header: Title and View All */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#192E2A] tracking-tight font-sans flex items-center gap-2">
              <Users className="w-4 h-4 text-pine" />
              <span>Number of Users</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Monthly tourist inflow & active telemetry
            </p>
          </div>

          <button
            onClick={() => navigate('/users')}
            className="text-xs font-bold text-[#192E2A] hover:text-pine flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Big Number of Users Metric */}
        <div className="mt-4 flex items-baseline justify-between border-b border-slate-100 pb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#192E2A] font-sans tracking-tight">
              {totalCount}
            </span>
            <span className="text-xs font-bold text-slate-400 font-sans">
              Registered Profiles
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Monthly User Inflow Bars */}
      <div className="mt-4 flex items-end gap-3 h-44">
        {/* Y Axis */}
        <div className="flex flex-col justify-between h-full text-[9px] font-bold text-slate-400 pb-6 pr-1 font-mono">
          {yTicks.map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-end justify-between h-full pb-6 border-b border-slate-100">
          {data.map((item) => {
            const totalVal = item.active + item.newUsers;
            const totalHeightPercent = (totalVal / 8.0) * 100;
            const activePercent = (item.active / (totalVal || 1)) * 100;
            const newPercent = 100 - activePercent;

            return (
              <div 
                key={item.month} 
                className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end relative"
                title={`${item.month}: ${item.label} Monitored Users`}
              >
                {/* Stacked Vertical Bar */}
                <div 
                  className="w-2.5 rounded-full overflow-hidden flex flex-col-reverse justify-start transition-all group-hover:scale-y-105 duration-200"
                  style={{ height: `${totalHeightPercent}%` }}
                >
                  {/* Pine Portion (Active Tourists) */}
                  <div 
                    className="w-full bg-[#24403B] rounded-b-full transition-all"
                    style={{ height: `${activePercent}%` }}
                  />
                  {/* Honey Portion (New Registrations) */}
                  <div 
                    className="w-full bg-[#E5A93C] rounded-t-full transition-all"
                    style={{ height: `${newPercent}%` }}
                  />
                </div>

                {/* X Axis Label */}
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-pine transition-colors font-sans">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Breakdown Footer */}
      <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#24403B]" />
          <span>Active Tourists</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" />
          <span>New Registrations</span>
        </div>
      </div>
    </div>
  );
};

export const UserStatsBarChart = SafetyBarChart;
