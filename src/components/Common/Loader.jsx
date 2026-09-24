import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Loader = ({ message = 'Syncing Satellite Telemetry...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <ShieldCheck className="w-7 h-7 text-cyan-400 absolute" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
};
