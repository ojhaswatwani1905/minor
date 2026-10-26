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
              <div className="p-1.5 text-slate-900 space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] uppercase">
                  ⚠️ {hz.severity} DANGER ZONE
                </span>
                <p className="font-extrabold text-xs">{hz.name}</p>
                <p className="text-[10px] text-slate-600">{hz.riskDescription || 'Avalanche risk level 4/5. 50 km/h gusts.'}</p>
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
                  <div className="p-1.5 text-slate-900 space-y-1">
                    <p className="font-bold text-xs">{loc.fullName}</p>
                    <p className="text-[10px] text-slate-600">{loc.location.name}</p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200">
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        loc.status === 'EMERGENCY' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {loc.status}
                      </span>
                      <span className="font-mono text-cyan-700 font-bold">{loc.speedKmH} km/h</span>
                    </div>
                    <button
                      onClick={() => onSelectTourist(loc.id)}
                      className="w-full mt-1.5 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold shadow"
                    >
                      Track Telemetry →
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
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xl text-white">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <CloudSnow className="w-4 h-4 animate-bounce text-cyan-300" />
          <span className="font-bold">{weather?.temperatureC ?? -4}°C</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>{weather?.windSpeedKmH ?? 48} km/h</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-[10px] flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          <span>Avalanche Level {weather?.avalancheRiskLevel ?? 4}/5</span>
        </div>
      </div>

      {/* Hazard Layer Toggle Button */}
      <button
        onClick={() => setShowHazards(!showHazards)}
        className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 shadow-lg transition-all"
      >
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>{showHazards ? 'Hide Hazard Polygons' : 'Show Hazard Polygons'}</span>
      </button>
    </div>
  );
};
