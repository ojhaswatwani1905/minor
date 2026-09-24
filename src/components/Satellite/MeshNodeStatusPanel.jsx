import React from 'react';
import { Radio, Wifi, BatteryCharging, ShieldCheck, AlertOctagon } from 'lucide-react';

export const MeshNodeStatusPanel = ({ meshNodes }) => {
  const nodes = meshNodes || [
    { id: 'node-alpha', name: 'Rohtang Gateway', status: 'ONLINE', signal: 98, battery: '100%', activeClients: 14 },
    { id: 'node-beta', name: 'Kedarkantha Relay', status: 'ONLINE', signal: 84, battery: '78%', activeClients: 9 },
    { id: 'node-gamma', name: 'Zanskar Sub-Station', status: 'DEGRADED', signal: 42, battery: '31%', activeClients: 3 },
    { id: 'node-delta', name: 'Silent Valley Node', status: 'OFFLINE', signal: 0, battery: '0%', activeClients: 0 }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h4 className="font-extrabold text-white">Satellite Mesh Constellation</h4>
          <p className="text-[10px] text-slate-400">3 of 4 Low-Earth Orbit Gateways Synchronized</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
        {nodes.map((node) => (
          <div key={node.id} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white text-[11px] truncate">{node.name}</span>
              <span className={`w-2 h-2 rounded-full ${
                node.status === 'ONLINE' ? 'bg-emerald-500 shadow-glow-emerald' : node.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <Wifi className="w-3 h-3" /> {node.signal}%
              </span>
              <span>Bat: {node.battery}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
