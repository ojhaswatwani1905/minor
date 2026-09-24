import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PlaceholderModulePage = ({ title, moduleStep, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-500/10">
        <ShieldCheck className="w-10 h-10" />
      </div>

      <div className="max-w-md space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          Scheduled for {moduleStep}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title} Module
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description || `The ${title} module interface & REST API endpoints will be built during ${moduleStep}. STEP 1 shell layout, navbar, sidebar, JWT security & main dashboard metrics are fully compiled.`}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 max-w-sm w-full space-y-2">
        <div className="flex items-center justify-between font-bold text-slate-100">
          <span>STEP 1 Status:</span>
          <span className="text-emerald-400">✓ Complete</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Current Active Module:</span>
          <span className="text-cyan-400">Dashboard & Auth</span>
        </div>
      </div>
    </div>
  );
};
