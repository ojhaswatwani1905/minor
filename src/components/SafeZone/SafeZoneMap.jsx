import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Destination Center Marker Icon
const createDestinationIcon = (name) => {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="background: #0f172a; color: #38bdf8; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; border: 1.5px solid #0284c7; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 4px;">
          🎯 ${name || 'Destination'} (5km Center)
        </div>
        <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #0284c7;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Tourist Position Marker Icon with Status Glow
const createTouristIcon = (name, status) => {
  const short = name && name.length > 14 ? name.substring(0, 14) + '...' : (name || 'Tourist');
  const isBreached = status === 'BREACHED';
  const isWarning = status === 'WARNING';
  const isApproaching = status === 'APPROACHING';
  const isPaused = status === 'PAUSED';

  const color = isBreached
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : isApproaching
    ? '#06b6d4'
    : isPaused
    ? '#64748b'
    : '#10b981';

  const pulseAnimation = isBreached
    ? 'animation: pulse 1s infinite;'
    : isWarning
    ? 'animation: pulse 1.5s infinite;'
    : '';

  return L.divIcon({
    className: 'custom-tourist-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="background: ${color}; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 9999px; border: 1.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4); white-space: nowrap; margin-bottom: 3px;">
          ${isBreached ? '🚨 ' : ''}${short} [${status}]
        </div>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 14px ${color}; display: flex; align-items: center; justify-content: center; ${pulseAnimation}">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Map Camera Controller
const MapCameraController = ({ selectedSafeZone }) => {
  const map = useMap();
  const prevIdRef = useRef(null);

  useEffect(() => {
    if (!selectedSafeZone) return;

    const dest = selectedSafeZone.destinationCoords;
    const tourist = selectedSafeZone.currentLocation;

    if (tourist?.lat && tourist?.lng && dest?.lat && dest?.lng) {
      // Fit both tourist and destination in bounds
      const bounds = L.latLngBounds([
        [dest.lat, dest.lng],
        [tourist.lat, tourist.lng]
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true, duration: 1.2 });
    } else if (dest?.lat && dest?.lng) {
      map.flyTo([dest.lat, dest.lng], 13, { duration: 1.2 });
    }

    prevIdRef.current = selectedSafeZone.id;
  }, [selectedSafeZone?.id, selectedSafeZone?.currentLocation?.lat, selectedSafeZone?.currentLocation?.lng, map]);

  return null;
};

export const SafeZoneMap = ({
  safeZones = [],
  selectedSafeZoneId,
  onSelectSafeZone
}) => {
  const selectedSafeZone = safeZones.find((sz) => sz.id === selectedSafeZoneId) || safeZones[0];

  const defaultCenter = selectedSafeZone?.destinationCoords?.lat
    ? [selectedSafeZone.destinationCoords.lat, selectedSafeZone.destinationCoords.lng]
    : [32.3716, 77.2466];

  return (
    <div className="w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCameraController selectedSafeZone={selectedSafeZone} />

        {/* Render each Safe Zone boundary & tourist */}
        {safeZones.map((sz) => {
          const dest = sz.destinationCoords;
          const tourist = sz.currentLocation;
          if (!dest || dest.lat == null || dest.lng == null) return null;

          const isSelected = sz.id === selectedSafeZone?.id;
          const status = sz.status || 'APPROACHING';
          const isBreached = status === 'BREACHED';
          const isWarning = status === 'WARNING';
          const isApproaching = status === 'APPROACHING';

          const circleColor = isBreached
            ? '#ef4444'
            : isWarning
            ? '#f59e0b'
            : isApproaching
            ? '#06b6d4'
            : '#10b981';

          const radius = sz.radiusMeters || 5000;

          return (
            <React.Fragment key={sz.id}>
              {/* 5,000m Circular Geofence Safe Boundary */}
              <Circle
                center={[dest.lat, dest.lng]}
                radius={radius}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isSelected ? 0.18 : 0.08,
                  weight: isSelected ? 3 : 2,
                  dashArray: isApproaching ? '6, 6' : isWarning ? '4, 4' : undefined
                }}
                eventHandlers={{
                  click: () => onSelectSafeZone(sz.id)
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-extrabold text-slate-900">{sz.destination}</p>
                    <p className="text-slate-600">5 km Circular Safe Boundary</p>
                    <p className="text-cyan-700 font-bold mt-1">Status: {status}</p>
                  </div>
                </Popup>
              </Circle>

              {/* Destination Center Marker */}
              <Marker
                position={[dest.lat, dest.lng]}
                icon={createDestinationIcon(sz.destination)}
                eventHandlers={{
                  click: () => onSelectSafeZone(sz.id)
                }}
              />

              {/* Tourist Marker */}
              {tourist && tourist.lat != null && tourist.lng != null && (
                <>
                  <Marker
                    position={[tourist.lat, tourist.lng]}
                    icon={createTouristIcon(sz.userName, status)}
                    eventHandlers={{
                      click: () => onSelectSafeZone(sz.id)
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <p className="font-extrabold text-slate-900">{sz.userName}</p>
                        <p className="text-slate-600">
                          Lat: {tourist.lat.toFixed(4)}, Lng: {tourist.lng.toFixed(4)}
                        </p>
                        <p className="font-semibold text-slate-700 mt-1">
                          Distance: {(sz.distanceFromDestMeters / 1000).toFixed(2)} km
                        </p>
                        {sz.distanceOutsideBoundaryMeters > 0 && (
                          <p className="text-rose-600 font-bold">
                            Outside Boundary: +{sz.distanceOutsideBoundaryMeters}m
                          </p>
                        )}
                        <p className="text-slate-500 text-[10px] mt-1">Battery: {sz.batteryLevel ?? 'N/A'}%</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Connecting Trajectory Line between Tourist and Center */}
                  {isSelected && (
                    <Polyline
                      positions={[
                        [dest.lat, dest.lng],
                        [tourist.lat, tourist.lng]
                      ]}
                      pathOptions={{
                        color: circleColor,
                        weight: 2,
                        dashArray: '4, 8',
                        opacity: 0.7
                      }}
                    />
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10 text-[11px] shadow-xl text-white space-y-1.5 font-sans">
        <div className="flex items-center gap-2 font-bold tracking-wider text-[10px] text-slate-400 uppercase">
          Safe Zone Perimeters (5km Radius)
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Active Inside
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> Approaching
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span> Breached SOS
          </span>
        </div>
      </div>
    </div>
  );
};

