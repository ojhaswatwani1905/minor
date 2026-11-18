import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { ShieldAlert, CheckCircle2, Circle, Navigation, Radio, Flame, FileText, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { hazardService } from '../../services/hazardService';

export const RescuePlaybookModal = ({ isOpen, onClose, alertItem, onStatusUpdated }) => {
  const [completedSteps, setCompletedSteps] = useState([1]);
  const [droneStatus, setDroneStatus] = useState('READY');
  const [dispatchingDrone, setDispatchingDrone] = useState(false);

  if (!alertItem) return null;

  const sopSteps = [
    { id: 1, title: 'Satellite Beacon Ping Verification', desc: 'Confirm 2-way distress beacon ping with high-altitude mesh network.' },
    { id: 2, title: 'Autonomous Thermal Drone Reconnaissance', desc: 'Deploy SAR drone for IR heat-signature scan and aerial GPS tag.' },
    { id: 3, title: 'Helicopter / Ground SAR Dispatch', desc: 'Alert nearest Army / Disaster Response base camp with coordinates.' },
    { id: 4, title: 'Emergency Contact & Guardian SMS Blast', desc: 'Notify emergency contact and transmit live satellite track link.' }
  ];

  const toggleStep = (id) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter(s => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const handleDispatchDrone = async () => {
    try {
      setDispatchingDrone(true);
      const res = await hazardService.dispatchDrone('dr-101', alertItem.id, alertItem.coordinates || [30.728, 79.6053]);
      if (res.success) {
        setDroneStatus('DISPATCHED');
        toast.success(`🛸 ${res.message}`);
        if (!completedSteps.includes(2)) {
          setCompletedSteps([...completedSteps, 2]);
        }
      }
    } catch (err) {
      toast.error('Drone dispatch error');
    } finally {
      setDispatchingDrone(false);
    }
  };

  const handleExportBriefing = () => {
    const text = `
=== EMERGENCY RESCUE DISPATCH BRIEFING ===
INCIDENT ID: ${alertItem.id || 'INC-901'}
TOURIST: ${alertItem.touristName || alertItem.name || 'Unknown'}
LOCATION: ${alertItem.location || 'Rohtang Pass Sector'}
SEVERITY: ${alertItem.priority || 'CRITICAL'}
GPS TARGET: ${JSON.stringify(alertItem.coordinates || [32.3716, 77.2466])}
DRONE STATUS: ${droneStatus}
SOP CHECKLIST COMPLETION: ${completedSteps.length} / 4
DATE: ${new Date().toLocaleString()}
==========================================
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAR_Briefing_${alertItem.id || 'INC-901'}.txt`;
    a.click();
    toast.success('📄 Rescue Briefing PDF/TXT generated!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚨 High-Altitude Emergency Rescue Playbook"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-slate-200 text-xs">
        {/* Incident Summary Header */}
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-extrabold text-[10px]">
                {alertItem.priority || 'CRITICAL'} SOS
              </span>
              <h4 className="font-extrabold text-sm text-white">{alertItem.touristName || alertItem.name || 'Priya Nair'}</h4>
            </div>
            <p className="text-slate-300 text-xs">{alertItem.location || 'Rohtang High Altitude Sector'}</p>
            <p className="text-[10px] text-slate-400 font-mono">Telemetry: {alertItem.type || 'Geofence Breach'} • Batt: {alertItem.battery || '14%'}</p>
          </div>

          <button
            onClick={handleExportBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3732] hover:brightness-110 text-honey border border-white/10 font-bold transition-all text-xs"
          >
            <FileText className="w-4 h-4" />
            <span>SAR Briefing</span>
          </button>
        </div>

        {/* SOP Step-by-Step Interactive Checklist */}
        <div className="space-y-3">
          <h5 className="font-bold text-white text-xs uppercase tracking-wider text-white/70 flex items-center justify-between">
            <span>Rescue SOP Standard Checklist</span>
            <span className="text-honey font-mono text-xs">{completedSteps.length} of 4 Done</span>
          </h5>

          <div className="space-y-2">
            {sopSteps.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isDone 
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white' 
                      : 'bg-[#1E3732] border-white/10 text-white/70 hover:border-white/20'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-400">
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-white/30" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-bold text-xs ${isDone ? 'text-white' : 'text-white/90'}`}>
                      Step {step.id}: {step.title}
                    </p>
                    <p className="text-[11px] text-white/60 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drone Dispatch Launcher */}
        <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-honey/15 border border-honey/30 text-honey">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Autonomous SAR Thermal Recon Drone</p>
              <p className="text-[10px] text-white/60">Deploy Falcon-1 with IR sensor & Emergency MedKit</p>
            </div>
          </div>

          <button
            onClick={handleDispatchDrone}
            disabled={dispatchingDrone || droneStatus === 'DISPATCHED'}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all ${
              droneStatus === 'DISPATCHED'
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-honey hover:brightness-105 text-[#25433E]'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${dispatchingDrone ? 'animate-spin' : ''}`} />
            <span>{droneStatus === 'DISPATCHED' ? 'Drone En Route 🛸' : 'Dispatch Drone'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </Modal>
  );
};
