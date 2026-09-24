import React, { useState } from 'react';
import { Compass, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export const PredictiveRiskWidget = () => {
  const [route, setRoute] = useState('Rohtang Pass Pass Track');
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm">AI Route Risk Index Calculator</h3>
            <p className="text-[10px] text-slate-400">Predictive Machine Learning Risk Assessment</p>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 ${
          riskScore > 75 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : riskScore > 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span>Risk Score: {riskScore} / 100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Target Expedition Route</label>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
          >
            <option value="Rohtang Pass Track">Rohtang High Altitude Pass (3,978m)</option>
            <option value="Kedarkantha Peak">Kedarkantha Summit (3,800m)</option>
            <option value="Valley of Flowers">Valley of Flowers River Track (3,600m)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Tourist Experience Level</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
          >
            <option value="Beginner">First-Time High Altitude Trekker</option>
            <option value="Intermediate">Intermediate Trekker</option>
            <option value="Expert">Experienced Mountaineer</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Environmental Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
          >
            <option value="Winter Snowpack">Winter Active Snowpack</option>
            <option value="Monsoon Rain">Monsoon Torrential Rain</option>
            <option value="Summer Clear">Summer Clear Window</option>
          </select>
        </div>
      </div>

      {/* AI Recommendation Summary */}
      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">AI Recommendation Engine Output:</p>
          <p className="text-slate-300 text-[11px]">
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
