import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CloudSnow, Wind, ShieldAlert, Thermometer, Layers } from 'lucide-react';

// Custom Marker Icons
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
      animation: ${color === '#ef4444' ? 'pulse-glow 1.2s infinite ease-in-out' : 'none'};
    "><div style="background-color: #ffffff; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const iconGreen = createMarkerIcon('#10b981');
const iconYellow = createMarkerIcon('#f59e0b');
const iconRed = createMarkerIcon('#ef4444');

// Helper to center map view smoothly on selected tourist
const MapCameraController = ({ selectedLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation?.location?.lat && selectedLocation?.location?.lng) {
      map.flyTo([selectedLocation.location.lat, selectedLocation.location.lng], 10, {
        duration: 1.5
      });
    }
  }, [selectedLocation, map]);
  return null;
};

const sampleHazards = [
  {
    id: 'hz-1',
    name: 'Rohtang Avalanche Risk Zone',
    severity: 'CRITICAL',
    polygon: [
      [32.39, 77.23],
      [32.38, 77.28],
      [32.34, 77.26],
      [32.35, 77.21]
    ]
  },
  {
    id: 'hz-2',
    name: 'Valley of Flowers Flash Flood',
    severity: 'HIGH',
    polygon: [
      [30.75, 79.59],
      [30.74, 79.63],
      [30.71, 79.62],
      [30.72, 79.58]
    ]
  }
];

export const LiveMap = ({ locations, selectedTouristId, onSelectTourist, hazardZones = sampleHazards, weather }) => {
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

        <MapCameraController selectedLocation={selectedLocation} />

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

          const icon = loc.status === 'EMERGENCY' ? iconRed : loc.status === 'Offline' ? iconYellow : iconGreen;
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
