import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { StatusBadge } from '../Common/StatusBadge';
import { 
  Radio, 
  MapPin, 
  Battery, 
  Wifi, 
  Clock, 
  ShieldCheck, 
  FileText, 
  User, 
  Compass,
  AlertTriangle 
} from 'lucide-react';

export const UserDetailModal = ({ isOpen, onClose, userDetail }) => {
  const [activeTab, setActiveTab] = useState('telemetry');

  if (!userDetail) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tourist Traveler Command Dossier"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 select-none">
        {/* Header Profile Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1E3732] border border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-honey via-[#E5A93C] to-[#F3C878] text-[#25433E] font-black text-xl flex items-center justify-center shadow-lg">
              {userDetail.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white font-sans">{userDetail.fullName}</h3>
                <StatusBadge status={userDetail.status} />
              </div>
              <p className="text-xs text-white/70 font-sans mt-0.5">{userDetail.email} • {userDetail.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-xs">
            <Battery className={`w-4 h-4 ${userDetail.batteryLevel != null && userDetail.batteryLevel < 20 ? 'text-red-400 animate-pulse' : 'text-emerald-300'}`} />
            <span className="font-extrabold text-white">
              {userDetail.batteryLevel != null ? `${userDetail.batteryLevel}%` : 'Awaiting Ping'}
            </span>
            <span className="text-white/40">•</span>
            <Wifi className="w-4 h-4 text-honey" />
            <span className="text-white/80 font-medium">{userDetail.networkSignal || 'Pending'}</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab.id
                    ? 'bg-honey text-[#25433E] shadow-sm font-extrabold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
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
            <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
              <p className="font-bold text-white/70 flex items-center gap-1.5 font-sans">
                <MapPin className="w-4 h-4 text-honey" />
                Current Registered Location
              </p>
              <p className="text-sm font-extrabold text-white font-sans">
                {userDetail.currentLocation?.name || 'Awaiting Mobile GPS Fix'}
              </p>
              <div className="flex items-center gap-4 text-white/70 pt-1 font-sans">
                <span>Elevation: <strong className="text-white">{userDetail.currentLocation?.elevation || 'N/A'}</strong></span>
                <span>Offline: <strong className="text-white">{userDetail.offlineDurationMinutes || 0}m</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
              <p className="font-bold text-white/70 flex items-center gap-1.5 font-sans">
                <Compass className="w-4 h-4 text-honey" />
                GPS Coordinates Telemetry
              </p>
              {userDetail.currentLocation?.lat != null && userDetail.currentLocation?.lng != null ? (
                <>
                  <p className="text-sm font-mono font-extrabold text-honey">
                    Latitude: {Number(userDetail.currentLocation.lat).toFixed(4)}°
                  </p>
                  <p className="text-sm font-mono font-extrabold text-honey">
                    Longitude: {Number(userDetail.currentLocation.lng).toFixed(4)}°
                  </p>
                </>
              ) : (
                <p className="text-sm italic text-white/50">
                  No GNSS satellite coordinates reported yet.
                </p>
              )}
              <p className="text-[10px] text-white/50 pt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Ping: {userDetail.lastPing ? new Date(userDetail.lastPing).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Guardians */}
        {activeTab === 'guardians' && (
          <div className="space-y-3 text-xs">
            {userDetail.guardians?.map((g, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-honey/20 text-honey flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white font-sans">{g.name}</p>
                    <p className="text-white/70 font-sans">Relation: {g.relation} • {g.phone}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
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
              <div key={idx} className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-honey" />
                  <div>
                    <p className="font-bold text-white font-sans">{d.type}</p>
                    <p className="text-white/70 font-mono">Reference No: {d.number}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
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
              <p className="text-center py-6 text-white/50 font-sans">No expedition trips recorded for this traveler.</p>
            ) : (
              userDetail.trips?.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#1E3732] border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white font-sans">{t.destination}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between text-white/70 text-[11px] font-sans">
                    <span>Radius: {t.boundaryRadiusKm} km</span>
                    <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
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
