import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Custom Leaflet Icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background-color: ${color};
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px ${color};
      animation: ${color === '#ef4444' ? 'pulse-glow 1.5s infinite ease-in-out' : 'none'};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const iconOnline = createCustomIcon('#10b981');
const iconOffline = createCustomIcon('#f59e0b');
const iconEmergency = createCustomIcon('#ef4444');

const sampleLocations = [
  { id: '1', name: 'Aarav Sharma', lat: 32.3716, lng: 77.2466, status: 'Online', loc: 'Rohtang Pass Track', battery: '88%' },
  { id: '2', name: 'Priya Nair', lat: 30.7280, lng: 79.6053, status: 'EMERGENCY', loc: 'Valley of Flowers', battery: '14%' },
  { id: '3', name: 'Rohan Deshmukh', lat: 31.0232, lng: 78.1729, status: 'Online', loc: 'Kedarkantha Peak', battery: '62%' },
  { id: '4', name: 'Emily Watson', lat: 11.0827, lng: 76.4428, status: 'Offline', loc: 'Silent Valley Reserve', battery: '41%' },
  { id: '5', name: 'Vikramaditya Verma', lat: 33.7782, lng: 76.8273, status: 'Online', loc: 'Zanskar Frozen Route', battery: '95%' }
];

export const QuickMapPreview = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCount = sampleLocations.filter((l) => l.status === 'Online').length;
  const offlineCount = sampleLocations.filter((l) => l.status === 'Offline').length;
  const emergencyCount = sampleLocations.filter((l) => l.status === 'EMERGENCY').length;

  if (!mounted) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        Initializing Satellite Map Engine...
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative group">
      <MapContainer
        center={[31.0, 78.0]}
        zoom={6}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sampleLocations.map((loc) => {
          const icon = loc.status === 'EMERGENCY' ? iconEmergency : loc.status === 'Offline' ? iconOffline : iconOnline;
          return (
            <React.Fragment key={loc.id}>
              <Marker position={[loc.lat, loc.lng]} icon={icon}>
                <Popup className="leaflet-popup-dark">
                  <div className="p-1 text-slate-900">
                    <p className="font-bold text-xs">{loc.name}</p>
                    <p className="text-[10px] text-slate-600">{loc.loc}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        loc.status === 'EMERGENCY' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {loc.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Bat: {loc.battery}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {loc.status === 'EMERGENCY' && (
                <Circle
                  center={[loc.lat, loc.lng]}
                  radius={15000}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl flex items-center gap-4 text-xs font-semibold shadow-lg text-white">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
          <span>Active ({activeCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Offline ({offlineCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">SOS Rescue ({emergencyCount})</span>
        </div>
      </div>
    </div>
  );
};
