import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import { safeZoneService } from '../services/safeZoneService';
import { emergencyService } from '../services/emergencyService';
import { storage } from '../utils/storage';

export const SAFEZONE_BACKGROUND_TASK_NAME = 'STSMS_BACKGROUND_SAFEZONE_TASK';

// Module-level task definition (Required by Expo TaskManager)
try {
  TaskManager.defineTask(SAFEZONE_BACKGROUND_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn('[BACKGROUND SAFEZONE TASK ERROR]', error.message);
      return;
    }
    if (data && data.locations && data.locations.length > 0) {
      const fix = data.locations[data.locations.length - 1];
      try {
        const cached = await storage.getItem('stsms_active_safe_zone');
        if (cached) {
          const trip = JSON.parse(cached);
          if (trip && trip.id && trip.destinationCoords) {
            await safeZoneService.sendLocationUpdate(trip.id, {
              lat: fix.coords.latitude,
              lng: fix.coords.longitude,
              accuracy: fix.coords.accuracy,
              speedKmH: fix.coords.speed ? +(fix.coords.speed * 3.6).toFixed(1) : 0,
              timestamp: new Date(fix.timestamp).toISOString(),
              isBackground: true
            });
          }
        }
      } catch (err) {
        console.warn('[BACKGROUND TASK PROCESSING NOTE]', err.message);
      }
    }
  });
} catch (defErr) {
  console.log('[TASKMANAGER DEFINITION NOTE]', defErr.message);
}

// Haversine formula to compute distance in meters between two lat/lon points
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const useSafeZoneGeofence = (initialTrip = null, onStateChange = null) => {
  const [activeZone, setActiveZone] = useState(initialTrip);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [distanceOutsideMeters, setDistanceOutsideMeters] = useState(0);
  const [status, setStatus] = useState(initialTrip?.status || 'APPROACHING');
  const [warningActive, setWarningActive] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(30);
  const [hasEnteredZone, setHasEnteredZone] = useState(Boolean(initialTrip?.hasEnteredZone));
  const [consecutiveOutsideCount, setConsecutiveOutsideCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [lastFixTime, setLastFixTime] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [backgroundPermissionGranted, setBackgroundPermissionGranted] = useState(false);

  const countdownIntervalRef = useRef(null);
  const consecutiveOutsideRef = useRef(0);
  const isBreachingRef = useRef(false);

  // Sync internal state when initialTrip changes
  useEffect(() => {
    if (initialTrip) {
      setActiveZone(initialTrip);
      setStatus(initialTrip.status || 'APPROACHING');
      setHasEnteredZone(Boolean(initialTrip.hasEnteredZone));
      if (initialTrip.distanceFromDestMeters != null) {
        setDistanceMeters(initialTrip.distanceFromDestMeters);
      }
    }
  }, [initialTrip?.id, initialTrip?.status]);

  // Read hardware battery level
  useEffect(() => {
    (async () => {
      try {
        const lvl = await Battery.getBatteryLevelAsync();
        if (lvl >= 0) setBatteryLevel(Math.round(lvl * 100));
      } catch (e) {}
    })();
  }, []);

  // Request foreground & background permissions with explanations
  useEffect(() => {
    (async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus === 'granted') {
          setPermissionGranted(true);

          try {
            const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
            if (bgStatus === 'granted') {
              setBackgroundPermissionGranted(true);
            }
          } catch (bgErr) {
            console.log('Background location permission note (may require Dev Build):', bgErr.message);
          }
        }
      } catch (err) {
        console.log('Permission request note:', err.message);
      }
    })();
  }, []);

  // Register background task if background permission is granted and safe zone is active
  useEffect(() => {
    if (backgroundPermissionGranted && activeZone?.id && status !== 'COMPLETED' && status !== 'PAUSED') {
      (async () => {
        try {
          const isStarted = await Location.hasStartedLocationUpdatesAsync(SAFEZONE_BACKGROUND_TASK_NAME);
          if (!isStarted) {
            await Location.startLocationUpdatesAsync(SAFEZONE_BACKGROUND_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 15000,
              distanceInterval: 50,
              foregroundService: {
                notificationTitle: 'STSMS 5km Safe Travel Zone Active',
                notificationBody: 'Automated geofence emergency monitoring is active in the background.',
                notificationColor: '#06b6d4'
              },
              pausesLocationUpdatesAutomatically: false,
              showsBackgroundLocationIndicator: true
            });
            console.log('[SAFEZONE] Registered background TaskManager location updates.');
          }
        } catch (e) {
          console.log('[SAFEZONE BACKGROUND REGISTER NOTE]:', e.message);
        }
      })();
    }
  }, [backgroundPermissionGranted, activeZone?.id, status]);

  // Core Geofencing Evaluation Cycle (every 8 seconds when active zone exists)
  useEffect(() => {
    if (!activeZone || !activeZone.destinationCoords || status === 'COMPLETED' || status === 'PAUSED') {
      return;
    }

    const checkLocationAndGeofence = async () => {
      try {
        let lat = null;
        let lng = null;
        let accuracy = 15;
        let speed = 0;

        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc?.coords) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
            accuracy = loc.coords.accuracy || 15;
            speed = loc.coords.speed ? +(loc.coords.speed * 3.6).toFixed(1) : 0;
          }
        } catch (locErr) {
          try {
            const lastLoc = await Location.getLastKnownPositionAsync();
            if (lastLoc?.coords) {
              lat = lastLoc.coords.latitude;
              lng = lastLoc.coords.longitude;
              accuracy = lastLoc.coords.accuracy || 25;
            }
          } catch (e) {}
        }

        if (lat == null || lng == null) {
          // GPS unavailable: do NOT treat as proof of exit!
          return;
        }

        const now = new Date().toLocaleTimeString();
        setCurrentCoords({ lat, lng, accuracy });
        setGpsAccuracy(accuracy);
        setLastFixTime(now);

        // Discard poor fixes from boundary evaluations
        if (accuracy > 80) {
          console.log(`[SafeZone GPS] Inaccurate fix discarded (${accuracy}m > 80m threshold).`);
          return;
        }

        const destLat = activeZone.destinationCoords.lat;
        const destLng = activeZone.destinationCoords.lng;
        const radiusMeters = activeZone.radiusMeters || 5000;

        const dist = calculateDistanceMeters(lat, lng, destLat, destLng);
        const distOutside = Math.max(0, dist - radiusMeters);
        const isInside = dist <= radiusMeters;

        setDistanceMeters(dist);
        setDistanceOutsideMeters(distOutside);

        // ==========================================
        // Client-Side Geofence Evaluation & Transitions
        // ==========================================
        if (!hasEnteredZone) {
          if (isInside) {
            // First time entry into the 5 km safe zone!
            setHasEnteredZone(true);
            setStatus('ACTIVE');
            setWarningActive(false);
            consecutiveOutsideRef.current = 0;
            setConsecutiveOutsideCount(0);

            // Sync to backend
            sendTelemetry({
              lat,
              lng,
              accuracy,
              speedKmH: speed,
              batteryLevel,
              timestamp: new Date().toISOString()
            });
          } else {
            // Still in approaching phase; outside boundary is completely NORMAL
            setStatus('APPROACHING');
          }
        } else {
          // Has entered zone previously
          if (isInside) {
            // Tourist is safely within the 5 km zone
            if (warningActive || status !== 'ACTIVE') {
              setWarningActive(false);
              setStatus('ACTIVE');
              consecutiveOutsideRef.current = 0;
              setConsecutiveOutsideCount(0);
              stopCountdown();
            }
          } else {
            // Tourist is outside the 5 km boundary!
            consecutiveOutsideRef.current += 1;
            setConsecutiveOutsideCount(consecutiveOutsideRef.current);

            if (consecutiveOutsideRef.current === 1 && !warningActive) {
              // 1st reading outside: Trigger WARNING state & 30-sec safety countdown
              setStatus('WARNING');
              setWarningActive(true);
              startCountdown();
            } else if (consecutiveOutsideRef.current >= 3 && !isBreachingRef.current) {
              // 3 consecutive verified fixes outside: Confirm BREACH!
              isBreachingRef.current = true;
              setStatus('BREACHED');
              setWarningActive(true);
              stopCountdown();

              // Transmit confirmed breach to backend
              sendTelemetry({
                lat,
                lng,
                accuracy,
                speedKmH: speed,
                batteryLevel,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } catch (cycleErr) {
        console.warn('[SAFEZONE CYCLE ERROR]', cycleErr.message);
      }
    };

    // Run initial check and set periodic interval
    checkLocationAndGeofence();
    const interval = setInterval(checkLocationAndGeofence, 8000);

    return () => {
      clearInterval(interval);
    };
  }, [activeZone?.id, status, hasEnteredZone, warningActive]);

  // Countdown timer for Warning State before automated breach
  const startCountdown = () => {
    stopCountdown();
    setWarningCountdown(30);

    countdownIntervalRef.current = setInterval(() => {
      setWarningCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          // Countdown reached zero without confirmation: escalate to BREACHED
          setStatus('BREACHED');
          if (currentCoords) {
            sendTelemetry({
              lat: currentCoords.lat,
              lng: currentCoords.lng,
              accuracy: gpsAccuracy,
              batteryLevel,
              timestamp: new Date().toISOString()
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Transmit location & receive authoritative state from server
  const sendTelemetry = async (telemetry) => {
    if (!activeZone?.id) return;
    setIsSyncing(true);
    try {
      const res = await safeZoneService.sendLocationUpdate(activeZone.id, telemetry);
      if (res.success) {
        if (res.trip) {
          setActiveZone(res.trip);
          onStateChange && onStateChange(res.trip);
        }
        if (res.status) {
          setStatus(res.status);
        }
      }
    } catch (e) {
      console.warn('[SAFEZONE TELEMETRY SYNC NOTE]', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tourist confirms "I Am Safe"
  const confirmSafe = async (note = 'Tourist confirmed safe in-app') => {
    stopCountdown();
    setWarningActive(false);
    consecutiveOutsideRef.current = 0;
    setConsecutiveOutsideCount(0);
    isBreachingRef.current = false;
    setStatus('ACTIVE');

    if (!activeZone?.id) return;
    try {
      const res = await safeZoneService.confirmSafe(activeZone.id, note);
      if (res.success && res.trip) {
        setActiveZone(res.trip);
        onStateChange && onStateChange(res.trip);
      }
    } catch (e) {
      console.error('[CONFIRM SAFE ERROR]', e.message);
    }
  };

  // Pause monitoring
  const pauseMonitoring = async () => {
    stopCountdown();
    setWarningActive(false);
    setStatus('PAUSED');
    if (activeZone?.id) {
      await safeZoneService.updateStatus(activeZone.id, 'PAUSE');
    }
  };

  // Resume monitoring
  const resumeMonitoring = async () => {
    const nextSt = hasEnteredZone ? 'ACTIVE' : 'APPROACHING';
    setStatus(nextSt);
    if (activeZone?.id) {
      await safeZoneService.updateStatus(activeZone.id, 'RESUME');
    }
  };

  // End trip
  const endSafeZone = async () => {
    stopCountdown();
    setWarningActive(false);
    setStatus('COMPLETED');
    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(SAFEZONE_BACKGROUND_TASK_NAME);
      if (isStarted) {
        await Location.stopLocationUpdatesAsync(SAFEZONE_BACKGROUND_TASK_NAME);
      }
    } catch (e) {}
    if (activeZone?.id) {
      await safeZoneService.updateStatus(activeZone.id, 'COMPLETE');
    }
    setActiveZone(null);
  };

  return {
    activeZone,
    setActiveZone,
    currentCoords,
    distanceMeters,
    distanceOutsideMeters,
    status,
    warningActive,
    warningCountdown,
    hasEnteredZone,
    consecutiveOutsideCount,
    batteryLevel,
    lastFixTime,
    gpsAccuracy,
    isSyncing,
    permissionGranted,
    backgroundPermissionGranted,
    confirmSafe,
    pauseMonitoring,
    resumeMonitoring,
    endSafeZone
  };
};

