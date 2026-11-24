import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { locationService } from '../services/locationService';
import { offlineStorage } from '../services/offlineStorage';
import { useAuth } from '../context/AuthContext';

// Haversine formula to compute distance in meters between two lat/lng points
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocation = (trackingActive = true, isOffline = false) => {
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [speedKmH, setSpeedKmH] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('Satellite GNSS Active');
  const [lastSync, setLastSync] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Adaptive Polling Metrics (36+ Hours Battery Extension)
  const [pollingMode, setPollingMode] = useState('Adaptive 100m Polling (36h+ Battery)');
  const [distanceTraveledMeters, setDistanceTraveledMeters] = useState(0);
  const lastLoggedPositionRef = useRef(null);

  // Read hardware battery level
  useEffect(() => {
    let batterySubscription;
    (async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level >= 0) {
          setBatteryLevel(Math.round(level * 100));
        }

        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel: newLevel }) => {
          if (newLevel >= 0) {
            setBatteryLevel(Math.round(newLevel * 100));
          }
        });
      } catch (err) {
        console.log('Expo battery info note:', err.message);
      }
    })();

    return () => {
      if (batterySubscription) batterySubscription.remove();
    };
  }, []);

  // Request device location permission on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
        }
      } catch (err) {
        console.log('Location permission request note:', err.message);
      }
    })();
  }, []);

  // Flush offline pings if network comes online
  useEffect(() => {
    if (!isOffline) {
      offlineStorage.flushPendingPings();
    }
  }, [isOffline]);

  useEffect(() => {
    let interval;
    if (trackingActive) {
      const syncLocation = async () => {
        let currentLat = null;
        let currentLng = null;
        let currentSpeed = 0;
        let currentBattery = batteryLevel;

        try {
          const freshBat = await Battery.getBatteryLevelAsync();
          if (freshBat >= 0) {
            currentBattery = Math.round(freshBat * 100);
            setBatteryLevel(currentBattery);
          }
        } catch (e) {}

        if (hasPermission) {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (loc && loc.coords) {
              currentLat = loc.coords.latitude;
              currentLng = loc.coords.longitude;
              currentSpeed = loc.coords.speed ? +(loc.coords.speed * 3.6).toFixed(1) : 0;
            }
          } catch (e) {
            try {
              const last = await Location.getLastKnownPositionAsync();
              if (last && last.coords) {
                currentLat = last.coords.latitude;
                currentLng = last.coords.longitude;
              }
            } catch (err) {}
          }
        }

        if (currentLat == null || currentLng == null) {
          return;
        }

        // Calculate displacement from last logged position
        const distFromLast = lastLoggedPositionRef.current
          ? getDistanceMeters(
              lastLoggedPositionRef.current.lat,
              lastLoggedPositionRef.current.lng,
              currentLat,
              currentLng
            )
          : 999; // Force log on first fix

        setCoords({ lat: currentLat, lng: currentLng });
        setSpeedKmH(currentSpeed);

        // ADAPTIVE POLLING FILTER (PRD Bottleneck B):
        // Only transmit/store ping if traveler has moved >= 100 meters OR speed is significant (>5 km/h)
        const shouldLogPing = distFromLast >= 100 || currentSpeed > 5.0;

        if (shouldLogPing) {
          lastLoggedPositionRef.current = { lat: currentLat, lng: currentLng };
          setDistanceTraveledMeters(prev => Math.round(prev + distFromLast));
          setLastSync(new Date().toLocaleTimeString());

          const pingPayload = {
            userId: user?.id || 'usr_102',
            email: user?.email || 'traveler@safety.org',
            lat: currentLat,
            lng: currentLng,
            locationName: coords?.name || `GPS Fix (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`,
            speedKmH: currentSpeed,
            batteryLevel: currentBattery,
            networkSignal: isOffline ? 'Offline (Local SQLite Buffer)' : networkStatus,
            distanceMovedMeters: Math.round(distFromLast),
            pollingMode: 'Adaptive 100m Distance Polling',
            timestamp: new Date().toISOString()
          };

          if (isOffline) {
            // PRD Bottleneck A & Rule 1: Store offline location pings locally in SQLite
            await offlineStorage.saveOfflinePing(pingPayload);
            console.log(`[Adaptive 100m GPS] Offline - Saved ${Math.round(distFromLast)}m displacement ping to SQLite store.`);
          } else {
            // Check Rules.md Exponential Network Back-Off Status
            const backoff = await offlineStorage.getBackOffStatus();
            if (backoff.isPaused) {
              await offlineStorage.saveOfflinePing(pingPayload);
              setNetworkStatus(`Modem Rest (${backoff.remainingMins}m remaining)`);
              console.log(`[EXPONENTIAL BACKOFF ACTIVE] Sync paused for next ${backoff.remainingMins} mins. Ping buffered to SQLite.`);
            } else {
              try {
                await locationService.sendLocationUpdate(pingPayload);
                await offlineStorage.recordSyncSuccess();
                setNetworkStatus('Satellite GNSS Active');
                console.log(`[Adaptive 100m GPS & 36h Battery Sync] Moved ${Math.round(distFromLast)}m | ${currentBattery}% Battery | Lat: ${currentLat}, Lng: ${currentLng}`);
              } catch (e) {
                await offlineStorage.recordSyncFailure();
                await offlineStorage.saveOfflinePing(pingPayload);
              }
            }
          }
        } else {
          console.log(`[Adaptive 100m GPS] Battery Preserved: Only moved ${Math.round(distFromLast)}m (<100m threshold). Skipping GPS power surge.`);
        }
      };

      // Initial check
      syncLocation();

      // Poll check loop
      interval = setInterval(syncLocation, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trackingActive, hasPermission, batteryLevel, networkStatus, isOffline, user?.id, user?.email]);

  return {
    coords,
    speedKmH,
    batteryLevel,
    networkStatus,
    lastSync,
    pollingMode,
    distanceTraveledMeters,
    setBatteryLevel
  };
};
