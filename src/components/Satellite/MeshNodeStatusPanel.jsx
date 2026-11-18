import React from 'react';
import { Radio, Wifi } from 'lucide-react';

export const MeshNodeStatusPanel = ({ meshNodes }) => {
  const nodes = meshNodes || [
    { id: 'node-alpha', name: 'Rohtang Gateway', status: 'ONLINE', signal: 98, battery: '100%', activeClients: 14 },
    { id: 'node-beta', name: 'Kedarkantha Relay', status: 'ONLINE', signal: 84, battery: '78%', activeClients: 9 },
    { id: 'node-gamma', name: 'Zanskar Sub-Station', status: 'DEGRADED', signal: 42, battery: '31%', activeClients: 3 },
    { id: 'node-delta', name: 'Silent Valley Node', status: 'OFFLINE', signal: 0, battery: '0%', activeClients: 0 }
  ];

  return (
    <div className="bg-[#25433E] border border-white/10 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white select-none">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15 text-emerald-300">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h4 className="font-black text-sm text-white tracking-wide font-sans">Satellite Mesh Constellation</h4>
          <p className="text-[11px] text-white/70 font-sans mt-0.5">3 of 4 Low-Earth Orbit Gateways Synchronized</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
        {nodes.map((node) => (
          <div key={node.id} className="p-2.5 rounded-2xl bg-[#1E3732] border border-white/10 space-y-1 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white text-[11px] truncate font-sans">{node.name}</span>
              <span className={`w-2 h-2 rounded-full ${
                node.status === 'ONLINE' ? 'bg-emerald-400 shadow-sm' : node.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
              <span className="flex items-center gap-1 text-honey font-bold">
                <Wifi className="w-3 h-3 text-honey" /> {node.signal}%
              </span>
              <span>Bat: {node.battery}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
