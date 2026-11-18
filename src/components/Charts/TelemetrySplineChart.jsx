import React from 'react';

export const TelemetrySplineChart = () => {
  const months = [
    { name: 'Jan', x: '8.9%' },
    { name: 'Feb', x: '26.2%' },
    { name: 'Mar', x: '43.5%' },
    { name: 'Apr', x: '60.8%' },
    { name: 'May', x: '78.2%' },
    { name: 'Jun', x: '93.3%' },
  ];
  const yTicks = [6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="glass-card p-6 md:p-8 relative select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
        <div>
          <h3 className="text-lg font-black text-[#192E2A] tracking-tight font-sans">
            Tourist Inflow & Safety Telemetry
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time corridor volume vs incident frequency
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold font-sans">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E5A93C] shadow-xs" />
            <span className="text-slate-600">Corridor Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1A312D] shadow-xs" />
            <span className="text-slate-600">Incident Telemetry</span>
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex items-stretch gap-3 h-64 md:h-72">
        {/* Y Axis Numbers */}
        <div className="flex flex-col justify-between h-[82%] text-[11px] font-bold text-slate-400 font-mono pr-1 select-none">
          {yTicks.map(t => (
            <span key={t} className="leading-none text-right w-4">{t}</span>
          ))}
        </div>

        {/* Main Spline Graph Canvas */}
        <div className="flex-1 relative flex flex-col justify-between">
          <div className="relative w-full h-[82%]">
            <svg 
              viewBox="0 0 900 240" 
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Honey Soft Gradient Fill matching Photo 2 */}
                <linearGradient id="honeyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5A93C" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#E5A93C" stopOpacity="0.02" />
                </linearGradient>

                {/* Drop shadow for tooltip and dots */}
                <filter id="tooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines for 0 to 6 */}
              <line x1="60" y1="30" x2="860" y2="30" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="60" x2="860" y2="60" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="90" x2="860" y2="90" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="120" x2="860" y2="120" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="150" x2="860" y2="150" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="180" x2="860" y2="180" stroke="#E9EFF0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="60" y1="210" x2="860" y2="210" stroke="#E2ECEB" strokeWidth="1.2" />

              {/* Curve 1: Honey Gold Spline Area Fill */}
              <path
                d="M 80,162 C 130,162 180,99 236,99 C 290,99 340,147 392,147 C 440,147 495,156 548,156 C 600,156 650,60 704,60 C 750,60 800,117 840,117 L 840,210 L 80,210 Z"
                fill="url(#honeyAreaGradient)"
              />

              {/* Curve 1: Honey Gold Spline Stroke */}
              <path
                d="M 80,162 C 130,162 180,99 236,99 C 290,99 340,147 392,147 C 440,147 495,156 548,156 C 600,156 650,60 704,60 C 750,60 800,117 840,117"
                fill="none"
                stroke="#E5A93C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Curve 2: Deep Pine Green Spline Path */}
              <path
                d="M 80,162 C 130,162 180,195 236,195 C 290,195 340,162 392,162 C 445,162 495,105 548,105 C 600,105 650,189 704,189 C 750,189 800,150 840,150"
                fill="none"
                stroke="#1A312D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Golden Apex Circle at May Peak (Photo 2) */}
              <circle 
                cx="704" 
                cy="60" 
                r="7" 
                fill="#E5A93C" 
                stroke="#FFFFFF" 
                strokeWidth="3" 
                className="transition-transform hover:scale-125 cursor-pointer"
              />

              {/* Dark Pin Marker at April Peak (Photo 2) */}
              <circle 
                cx="548" 
                cy="105" 
                r="6" 
                fill="#1A312D" 
                stroke="#FFFFFF" 
                strokeWidth="2.5" 
                className="transition-transform hover:scale-125 cursor-pointer"
              />

              {/* Floating Dark Tooltip Pill: "3500 Monitored" (Photo 2) */}
              <g filter="url(#tooltipShadow)">
                {/* Tooltip Rounded Box */}
                <rect 
                  x="508" 
                  y="46" 
                  width="80" 
                  height="44" 
                  rx="12" 
                  fill="#1E3732" 
                  stroke="rgba(255,255,255,0.25)" 
                  strokeWidth="1" 
                />
                {/* Tooltip Downward Pointer Stem */}
                <polygon 
                  points="542,90 554,90 548,97" 
                  fill="#1E3732" 
                />
                {/* Tooltip Text */}
                <text 
                  x="548" 
                  y="65" 
                  textAnchor="middle" 
                  fill="#FFFFFF" 
                  fontSize="13" 
                  fontWeight="900" 
                  fontFamily="system-ui, sans-serif"
                >
                  3500
                </text>
                <text 
                  x="548" 
                  y="81" 
                  textAnchor="middle" 
                  fill="rgba(255,255,255,0.75)" 
                  fontSize="9.5" 
                  fontWeight="600" 
                  fontFamily="system-ui, sans-serif"
                >
                  Monitored
                </text>
              </g>
            </svg>
          </div>

          {/* X Axis Months */}
          <div className="relative w-full flex items-center justify-between text-xs font-bold text-slate-500 pt-3 border-t border-slate-200/80 font-sans">
            {months.map(m => (
              <span key={m.name} className="text-center font-sans tracking-wide">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
