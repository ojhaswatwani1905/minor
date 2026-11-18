import React, { useState } from 'react';
import { Compass, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export const PredictiveRiskWidget = () => {
  const [route, setRoute] = useState('Rohtang Pass Track');
  const [experience, setExperience] = useState('Beginner');
  const [season, setSeason] = useState('Winter Snowpack');

  const calculateRisk = () => {
    let score = 45;
    if (route.includes('Rohtang')) score += 35;
    if (route.includes('Kedarkantha')) score += 20;
    if (experience === 'Beginner') score += 15;
    if (season.includes('Winter')) score += 10;
    return Math.min(score, 98);
  };

  const riskScore = calculateRisk();

  return (
    <div className="glass-card p-6 md:p-7 shadow-xl space-y-4 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pine/10 border border-pine/20 text-pine shadow-sm">
            <Sparkles className="w-5 h-5 text-honey" />
          </div>
          <div>
            <h3 className="font-black text-[#192E2A] text-base font-sans">AI Route Risk Index Calculator</h3>
            <p className="text-[11px] text-slate-400 font-sans">Predictive Machine Learning Risk Assessment & Telemetry Engine</p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 shadow-sm ${
          riskScore > 75 
            ? 'bg-rose-50 text-rose-700 border border-rose-300' 
            : riskScore > 50 
            ? 'bg-honey/15 text-[#C48419] border border-honey/30' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span>Risk Score: {riskScore} / 100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div>
          <label className="block text-slate-500 font-bold mb-1.5 font-sans">Target Expedition Route</label>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full p-2.5 bg-white/90 border border-slate-200 rounded-2xl text-[#192E2A] font-bold shadow-2xs focus:outline-none focus:border-pine"
          >
            <option value="Rohtang Pass Track">Rohtang High Altitude Pass (3,978m)</option>
            <option value="Kedarkantha Peak">Kedarkantha Summit (3,800m)</option>
            <option value="Valley of Flowers">Valley of Flowers River Track (3,600m)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-bold mb-1.5 font-sans">Tourist Experience Level</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full p-2.5 bg-white/90 border border-slate-200 rounded-2xl text-[#192E2A] font-bold shadow-2xs focus:outline-none focus:border-pine"
          >
            <option value="Beginner">First-Time High Altitude Trekker</option>
            <option value="Intermediate">Intermediate Trekker</option>
            <option value="Expert">Experienced Mountaineer</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-bold mb-1.5 font-sans">Environmental Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full p-2.5 bg-white/90 border border-slate-200 rounded-2xl text-[#192E2A] font-bold shadow-2xs focus:outline-none focus:border-pine"
          >
            <option value="Winter Snowpack">Winter Active Snowpack</option>
            <option value="Monsoon Rain">Monsoon Torrential Rain</option>
            <option value="Summer Clear">Summer Clear Window</option>
          </select>
        </div>
      </div>

      {/* AI Recommendation Summary */}
      <div className="p-4 rounded-2xl bg-pine/5 border border-pine/15 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-pine mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-extrabold text-[#192E2A] text-xs font-sans">AI Recommendation Engine Output:</p>
          <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
            {riskScore > 75 
              ? 'HIGH RISK DETECTED: Mandate satellite mesh tracker pair, set 5km geofence radius limit, and dispatch pre-expedition weather advisory broadcast.'
              : 'MODERATE RISK: Standard satellite telemetry active. Continuous altitude oxygen monitoring recommended.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
