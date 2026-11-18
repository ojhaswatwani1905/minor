import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CloudSnow, Wind, ShieldAlert, Thermometer, Layers } from 'lucide-react';

// Custom Marker Icons
const createEmergencyMarkerIcon = (name) => {
  const shortName = name && name.length > 15 ? name.substring(0, 15) + '...' : (name || 'Distress');
  return L.divIcon({
    className: 'custom-live-marker-sos',
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

const createMarkerIcon = (color) => {
  return L.divIcon({
    className: 'custom-live-marker',
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 16px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="background-color: #ffffff; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const iconGreen = createMarkerIcon('#10b981');
const iconYellow = createMarkerIcon('#f59e0b');

// Helper to center map view smoothly on selected tourist or active emergency
const MapCameraController = ({ selectedLocation, locations = [] }) => {
  const map = useMap();
  const hasCenteredEmergency = React.useRef(false);

  useEffect(() => {
    if (selectedLocation?.location?.lat && selectedLocation?.location?.lng) {
      map.flyTo([selectedLocation.location.lat, selectedLocation.location.lng], 13, {
        duration: 1.2
      });
      return;
    }

    if (!hasCenteredEmergency.current) {
      const emergency = locations.find(l => (l.status === 'EMERGENCY' || l.activeAlertsCount > 0) && l.location?.lat && l.location?.lng);
      if (emergency) {
        hasCenteredEmergency.current = true;
        map.flyTo([emergency.location.lat, emergency.location.lng], 12, {
          duration: 1.5
        });
      }
    }
  }, [selectedLocation, locations, map]);

  return null;
};

export const LiveMap = ({ locations, selectedTouristId, onSelectTourist, hazardZones = [], weather }) => {
  const [showHazards, setShowHazards] = useState(true);
  const selectedLocation = locations.find(l => l.id === selectedTouristId);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative group">
      <MapContainer
        center={[31.0, 78.0]}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCameraController selectedLocation={selectedLocation} locations={locations} />

        {/* High-Altitude Avalanche & Flood Danger Polygons */}
        {showHazards && (hazardZones || sampleHazards).map((hz) => (
          <Polygon
            key={hz.id}
            positions={hz.polygon}
            pathOptions={{
              color: hz.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: hz.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '6, 6'
            }}
          >
            <Popup className="leaflet-popup-dark">
              <div className="p-2 text-white space-y-1.5 min-w-[180px]">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-wider inline-block">
                  ⚠️ {hz.severity} DANGER ZONE
                </span>
                <p className="font-black text-sm text-white font-sans">{hz.name}</p>
                <p className="text-[11px] text-white/80 leading-relaxed font-sans">{hz.riskDescription || 'Avalanche risk level 4/5. 50 km/h gusts.'}</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {locations.map((loc) => {
          if (!loc.location?.lat || !loc.location?.lng) return null;

          const icon = loc.status === 'EMERGENCY'
            ? createEmergencyMarkerIcon(loc.fullName)
            : loc.status === 'Offline'
            ? iconYellow
            : iconGreen;
          const isSelected = selectedTouristId === loc.id;

          return (
            <React.Fragment key={loc.id}>
              <Marker
                position={[loc.location.lat, loc.location.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectTourist(loc.id)
                }}
              >
                <Popup className="leaflet-popup-dark">
                  <div className="p-2 text-white space-y-2 min-w-[200px]">
                    <div>
                      <p className="font-black text-sm text-white font-sans">{loc.fullName}</p>
                      <p className="text-[11px] text-white/70 font-sans mt-0.5">{loc.location.name}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/20">
                      <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                        loc.status === 'EMERGENCY' 
                          ? 'bg-red-500 text-white shadow-sm' 
                          : loc.status === 'Offline'
                          ? 'bg-amber-400 text-[#192E2A] font-extrabold'
                          : 'bg-emerald-500 text-white font-extrabold'
                      }`}>
                        {loc.status}
                      </span>
                      <span className="font-mono text-honey font-black text-xs">{loc.speedKmH || 0} km/h</span>
                    </div>

                    <button
                      onClick={() => onSelectTourist(loc.id)}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl bg-honey hover:brightness-105 active:scale-95 text-[#25433E] text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Track Telemetry</span>
                      <span>→</span>
                    </button>
                  </div>
                </Popup>
              </Marker>

              {/* Geofence Perimeter Circle */}
              {loc.activeTrip?.boundaryRadiusKm && (
                <Circle
                  center={[loc.location.lat, loc.location.lng]}
                  radius={loc.activeTrip.boundaryRadiusKm * 1000}
                  pathOptions={{
                    color: loc.status === 'EMERGENCY' ? '#ef4444' : '#0284c7',
                    fillColor: loc.status === 'EMERGENCY' ? '#ef4444' : '#0284c7',
                    fillOpacity: isSelected ? 0.25 : 0.1,
                    weight: isSelected ? 2 : 1
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating High-Altitude Weather Radar Badge Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-[#25433E]/95 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xl text-white">
        <div className="flex items-center gap-1.5 text-honey">
          <CloudSnow className="w-4 h-4 animate-bounce text-honey" />
          <span className="font-extrabold">{weather?.temperatureC ?? -4}°C</span>
        </div>
        <div className="h-3 w-px bg-white/20" />
        <div className="flex items-center gap-1.5 text-white/90">
          <Wind className="w-3.5 h-3.5 text-white/80" />
          <span>{weather?.windSpeedKmH ?? 48} km/h</span>
        </div>
        <div className="h-3 w-px bg-white/20" />
        <div className="px-2.5 py-0.5 rounded-lg bg-red-500/25 border border-red-400/40 text-red-300 font-extrabold text-[10px] flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-red-300" />
          <span>Avalanche Level {weather?.avalancheRiskLevel ?? 4}/5</span>
        </div>
      </div>

      {/* Hazard Layer Toggle Button */}
      <button
        onClick={() => setShowHazards(!showHazards)}
        className="absolute top-3 right-3 z-[400] bg-[#25433E]/95 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl text-xs font-extrabold text-white hover:text-honey flex items-center gap-1.5 shadow-xl transition-all"
      >
        <Layers className="w-3.5 h-3.5 text-honey" />
        <span>{showHazards ? 'Hide Hazard Polygons' : 'Show Hazard Polygons'}</span>
      </button>
    </div>
  );
};
