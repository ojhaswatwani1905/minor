import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  Radio, 
  Battery, 
  Wifi, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Clock, 
  AlertTriangle,
  Phone,
  User,
  Compass
} from 'lucide-react';

export const UserDetailModal = ({ isOpen, onClose, userDetail }) => {
  const [activeTab, setActiveTab] = useState('telemetry');

  if (!userDetail) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tourist Profile: ${userDetail.fullName}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header Profile Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-extrabold text-xl flex items-center justify-center shadow-lg">
              {userDetail.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{userDetail.fullName}</h3>
                <StatusBadge status={userDetail.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{userDetail.email} • {userDetail.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <Battery className={`w-4 h-4 ${userDetail.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-bold text-white">{userDetail.batteryLevel}%</span>
            <span className="text-slate-500">•</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">{userDetail.networkSignal}</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'telemetry', label: 'Live Telemetry & GPS', icon: Radio },
            { id: 'guardians', label: 'Guardians & Contacts', icon: ShieldCheck },
            { id: 'documents', label: 'Identity Documents', icon: FileText },
            { id: 'trips', label: `Trip History (${userDetail.trips?.length || 0})`, icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <p className="font-bold text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Current Registered Location
              </p>
              <p className="text-sm font-extrabold text-white">{userDetail.currentLocation?.name}</p>
              <div className="flex items-center gap-4 text-slate-400 pt-1">
                <span>Elevation: <strong className="text-slate-200">{userDetail.currentLocation?.elevation || 'N/A'}</strong></span>
                <span>Offline: <strong className="text-slate-200">{userDetail.offlineDurationMinutes}m</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <p className="font-bold text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                GPS Coordinates Telemetry
              </p>
              <p className="text-sm font-mono font-bold text-cyan-400">
                Latitude: {userDetail.currentLocation?.lat} N
              </p>
              <p className="text-sm font-mono font-bold text-cyan-400">
                Longitude: {userDetail.currentLocation?.lng} E
              </p>
              <p className="text-[10px] text-slate-500 pt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Ping: {new Date(userDetail.lastPing).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Guardians */}
        {activeTab === 'guardians' && (
          <div className="space-y-3 text-xs">
            {userDetail.guardians?.map((g, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{g.name}</p>
                    <p className="text-slate-400">Relation: {g.relation} • {g.phone}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Verified Contact
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-3 text-xs">
            {userDetail.documents?.map((d, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">{d.type}</p>
                    <p className="text-slate-400 font-mono">Reference No: {d.number}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Trip History */}
        {activeTab === 'trips' && (
          <div className="space-y-3 text-xs">
            {userDetail.trips?.length === 0 ? (
              <p className="text-center py-6 text-slate-500">No expedition trips recorded for this traveler.</p>
            ) : (
              userDetail.trips?.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{t.destination}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-slate-400">Route: {t.route}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Boundary Radius: <strong className="text-slate-300">{t.boundaryRadiusKm} km</strong></span>
                    <span>Started: {new Date(t.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
