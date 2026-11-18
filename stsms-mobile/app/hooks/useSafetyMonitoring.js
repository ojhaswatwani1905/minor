import { useState, useEffect } from 'react';
import { emergencyService } from '../services/emergencyService';

export const useSafetyMonitoring = (activeTrip) => {
  const [inactivityMinutes, setInactivityMinutes] = useState(0);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [geofenceViolated, setGeofenceViolated] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);

  useEffect(() => {
    let interval;
    if (activeTrip) {
      interval = setInterval(() => {
        // Increment inactivity count
        setInactivityMinutes(prev => {
          const nextVal = prev + 1;
          if (nextVal >= 15 && !showCheckInPrompt) {
            setShowCheckInPrompt(true);
          }
          return nextVal;
        });
      }, 10000); // 10s tick simulating background monitor
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTrip, showCheckInPrompt]);

  const confirmSafetyCheckIn = () => {
    setShowCheckInPrompt(false);
    setInactivityMinutes(0);
  };

  const simulateFallDetection = async () => {
    setFallDetected(true);
    try {
      await emergencyService.triggerSos({
        type: 'Fall Detection',
        priority: 'HIGH',
        message: 'Accelerometers detected 3.4g vertical impact shock fall.'
      });
    } catch (e) {}
  };

  const simulateGeofenceBreach = async () => {
    setGeofenceViolated(true);
    try {
      await emergencyService.triggerSos({
        type: 'GEOFENCE_BREACH',
        priority: 'CRITICAL',
        message: '🚨 [GEOFENCE_BREACH] Automatic boundary breach confirmed: Traveler crossed 5.0km geofence safety perimeter.'
      });
    } catch (e) {}
  };

  return {
    inactivityMinutes,
    showCheckInPrompt,
    geofenceViolated,
    isOffline,
    fallDetected,
    confirmSafetyCheckIn,
    simulateFallDetection,
    simulateGeofenceBreach,
    setIsOffline
  };
};
