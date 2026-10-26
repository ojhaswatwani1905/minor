import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Crosshair, ArrowRight, Battery, MapPin } from 'lucide-react';
import { monitoringService } from '../../services/monitoringService';

// Custom Marker Icons
const createEmergencyIcon = (name) => {
  const shortName = name && name.length > 15 ? name.substring(0, 15) + '...' : (name || 'Distress');
  return L.divIcon({
    className: 'custom-leaflet-marker-sos',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; top: -30px; white-space: nowrap; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); border: 1.5px solid #ffffff; letter-spacing: 0.02em; z-index: 100;">
          🚨 SOS: ${shortName}
        </div>
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: pulse-glow 1.4s infinite ease-in-out;"></div>
        <div style="position: relative; background: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 16px #ef4444; display: flex; align-items: center; justify-content: center;">
          <div style="background: #ffffff; width: 7px; height: 7px; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createStandardIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background-color: ${color};
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px ${color};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const iconOnline = createStandardIcon('#10b981');
const iconOffline = createStandardIcon('#f59e0b');

// Camera controller to automatically fly to coordinates
const MapCameraController = ({ targetCoords, targetZoom }) => {
  const map = useMap();
  const lastTarget = useRef(null);

  useEffect(() => {
    if (!targetCoords || targetCoords[0] == null || targetCoords[1] == null) return;
    const targetKey = `${targetCoords[0]}_${targetCoords[1]}_${targetZoom}`;
    if (lastTarget.current === targetKey) return;
    lastTarget.current = targetKey;

    map.flyTo(targetCoords, targetZoom || 13, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [targetCoords, targetZoom, map]);

  return null;
};

export const QuickMapPreview = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [liveLocations, setLiveLocations] = useState([]);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const fetchLocations = async () => {
    try {
      const res = await monitoringService.getLiveLocations();
      if (res.success && Array.isArray(res.locations)) {
        setLiveLocations(res.locations);
      }
    } catch (e) {
      // Background poll
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchLocations();
    const interval = setInterval(fetchLocations, 3000);
    return () => clearInterval(interval);
  }, []);

  const validGpsTourists = liveLocations.filter(
    (l) => l.location && l.location.lat != null && l.location.lng != null
  );

  const emergencyTourists = validGpsTourists.filter(
    (l) => l.status === 'EMERGENCY' || l.activeAlertsCount > 0
  );

  const activeCount = liveLocations.filter((l) => l.status === 'Online').length;
  const offlineCount = liveLocations.filter((l) => l.status === 'Offline').length;
  const emergencyCount = liveLocations.filter(
    (l) => l.status === 'EMERGENCY' || l.status === 'Pending' || l.activeAlertsCount > 0
  ).length;

  // Determine priority focus coordinates:
  // 1. First active SOS emergency tourist
  // 2. Any active GPS tourist
  // 3. Clean India geographic center
  const priorityTarget = emergencyTourists.length > 0
    ? emergencyTourists[0]
    : validGpsTourists.length > 0
    ? validGpsTourists[0]
    : null;

  const targetCoords = priorityTarget
    ? [priorityTarget.location.lat, priorityTarget.location.lng]
    : [28.6139, 77.2090];

  const targetZoom = emergencyTourists.length > 0
    ? 13
    : validGpsTourists.length > 0
    ? 8
    : 5;

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
        center={targetCoords}
        zoom={targetZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCameraController
          targetCoords={targetCoords}
          targetZoom={targetZoom}
          key={`camera_${focusTrigger}_${targetCoords[0]}_${targetCoords[1]}`}
        />

        {validGpsTourists.map((tourist) => {
          const isEmergency = tourist.status === 'EMERGENCY' || tourist.activeAlertsCount > 0;
          const isOffline = tourist.status === 'Offline';
          const icon = isEmergency
            ? createEmergencyIcon(tourist.fullName)
            : isOffline
            ? iconOffline
            : iconOnline;

          const lat = tourist.location.lat;
          const lng = tourist.location.lng;

          return (
            <React.Fragment key={tourist.id}>
              <Marker position={[lat, lng]} icon={icon}>
                <Popup className="leaflet-popup-dark">
                  <div className="p-2 text-slate-100 min-w-[200px] space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isEmergency ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {isEmergency ? '🚨 CRITICAL SOS' : tourist.status}
                      </span>
                      {tourist.batteryLevel != null && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                          <Battery className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tourist.batteryLevel}%</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-extrabold text-sm text-white">{tourist.fullName}</p>
                      <p className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
                      </p>
                    </div>

                    {tourist.activeAlert?.message && (
                      <p className="text-[11px] text-slate-300 bg-red-950/50 p-2 rounded-xl border border-red-500/30">
                        {tourist.activeAlert.message}
                      </p>
                    )}

                    {isEmergency && (
                      <button
                        onClick={() => navigate('/emergency')}
                        className="w-full py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                      >
                        <span>Dispatch Rescue Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Red search grid circle for emergency */}
              {isEmergency && (
                <Circle
                  center={[lat, lng]}
                  radius={1800}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.22,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Center on SOS Action Button */}
      {emergencyTourists.length > 0 && (
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
          <button
            onClick={() => setFocusTrigger((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xl border border-red-400/50 backdrop-blur-md transition-all animate-bounce"
            title="Focus camera onto active SOS coordinates"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Focus SOS Site ({emergencyTourists[0].location.lat.toFixed(2)}, {emergencyTourists[0].location.lng.toFixed(2)})</span>
          </button>
        </div>
      )}

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-4 text-xs font-semibold shadow-xl text-white">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
          <span>Active ({activeCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Offline ({offlineCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${emergencyCount > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
          <span className={emergencyCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
            SOS Distress ({emergencyCount})
          </span>
        </div>
      </div>
    </div>
  );
};
