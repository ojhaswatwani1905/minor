import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { emergencyService } from '../services/emergencyService';
import { locationService } from '../services/locationService';
import { safeZoneService } from '../services/safeZoneService';
import { DestinationSelectionModal } from '../components/DestinationSelectionModal';
import { SafeZoneStatusCard } from '../components/SafeZoneStatusCard';
import { DeadManSwitchCard } from '../components/DeadManSwitchCard';
import { TripStatusCard } from '../components/TripStatusCard';
import { SosButton } from '../components/SosButton';
import { EmergencyModal } from '../components/EmergencyModal';
import { useSafeZoneGeofence } from '../hooks/useSafeZoneGeofence';
import { getServerBaseUrl, setServerBaseUrl } from '../utils/api';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { getDestinationImageUrl } from '../utils/destinationImages';
import { getDeviceTelemetry } from '../utils/deviceInfo';

export const HomeScreen = ({
  onNavigateProfile,
  onStartNewTrip,
  onNavigateMap,
  onNavigateNotifications,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();

  // Identity
  const travellerName = user?.name || user?.fullName || 'Explorer';
  const userId = user?.id || '';

  // Telemetry state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsPermission, setGpsPermission] = useState('checking');
  const [gpsFetching, setGpsFetching] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Connectivity
  const [serverUrl, setServerUrl] = useState('');
  const [serverReachable, setServerReachable] = useState(true);

  // SOS & Emergency Modal state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalType, setEmergencyModalType] = useState('MANUAL_SOS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosSuccessResult, setSosSuccessResult] = useState(null);
  const [sosError, setSosError] = useState('');
  const submitLockRef = useRef(false);

  // Safe Zone State
  const [activeSafeZone, setActiveSafeZone] = useState(null);
  const [isDestinationModalVisible, setIsDestinationModalVisible] = useState(false);

  const {
    activeZone,
    setActiveZone,
    distanceMeters: safeZoneDistanceMeters,
    distanceOutsideMeters: safeZoneDistanceOutside,
    status: safeZoneStatus,
    warningActive: safeZoneWarningActive,
    warningCountdown: safeZoneWarningCountdown,
    isSyncing: isSafeZoneSyncing,
    confirmSafe: handleConfirmSafeZone,
    pauseMonitoring: handlePauseSafeZone,
    resumeMonitoring: handleResumeSafeZone,
    endSafeZone: handleEndSafeZone,
  } = useSafeZoneGeofence(activeSafeZone, (updated) => {
    setActiveSafeZone(updated);
  });

  // Load active safe zone trip on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await safeZoneService.getActiveSafeZone(user?.id);
        if (res.success && res.trip) {
          setActiveSafeZone(res.trip);
        }
      } catch (e) {}
    })();
  }, [user?.id]);

  // Check backend server connection
  const checkServerConnection = async () => {
    try {
      const base = await getServerBaseUrl();
      setServerUrl(base);
      const healthUrl = `${base.replace(/\/api$/, '')}/api/health`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(healthUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      setServerReachable(res.ok);
    } catch (e) {
      setServerReachable(false);
    }
  };

  useEffect(() => {
    checkServerConnection();
    const interval = setInterval(checkServerConnection, 12000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry sync to backend
  const syncTelemetry = async (locToSync, batToSync) => {
    const loc = locToSync !== undefined ? locToSync : gpsLocation;
    const bat = batToSync !== undefined ? batToSync : batteryLevel;

    try {
      const payload = {
        userId: user?.id || userId,
        email: user?.email,
        name: travellerName,
        fullName: travellerName,
        phone: user?.phone,
        lat: loc ? loc.lat : null,
        lng: loc ? loc.lng : null,
        locationName: loc ? `GPS Fix (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})` : null,
        batteryLevel: bat,
        networkSignal: loc ? 'Mobile GNSS (Online)' : 'No GPS Fix (Offline)',
        elevation: loc?.altitude ? `${loc.altitude} m` : null,
      };

      const res = await locationService.sendLocationUpdate(payload);
      if (res && res.success) {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {}
  };

  // Hardware Battery Listener
  useEffect(() => {
    let batterySub;
    (async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level >= 0) {
          const batPct = Math.round(level * 100);
          setBatteryLevel(batPct);
          syncTelemetry(gpsLocation, batPct);
        }
        batterySub = Battery.addBatteryLevelListener(({ batteryLevel: newLevel }) => {
          if (newLevel >= 0) {
            const batPct = Math.round(newLevel * 100);
            setBatteryLevel(batPct);
            syncTelemetry(gpsLocation, batPct);
          }
        });
      } catch (err) {}
    })();

    return () => {
      if (batterySub) batterySub.remove();
    };
  }, [gpsLocation, user?.id, travellerName]);

  // Request & Refresh Real Hardware Location
  const refreshLocation = async () => {
    try {
      setGpsFetching(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const requestRes = await Location.requestForegroundPermissionsAsync();
        if (requestRes.status !== 'granted') {
          setGpsPermission('denied');
          setGpsLocation(null);
          setGpsFetching(false);
          syncTelemetry(null, batteryLevel);
          return null;
        }
      }

      setGpsPermission('granted');

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,
      });

      if (pos && pos.coords) {
        const locData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          altitude: pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null,
          accuracy: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null,
          timestamp: pos.timestamp,
        };
        setGpsLocation(locData);
        setGpsFetching(false);
        syncTelemetry(locData, batteryLevel);
        return locData;
      }
    } catch (err) {
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && last.coords) {
          const locData = {
            lat: last.coords.latitude,
            lng: last.coords.longitude,
            accuracy: last.coords.accuracy != null ? Math.round(last.coords.accuracy) : null,
            timestamp: last.timestamp,
          };
          setGpsLocation(locData);
          setGpsFetching(false);
          syncTelemetry(locData, batteryLevel);
          return locData;
        }
      } catch (e) {}
    } finally {
      setGpsFetching(false);
    }
    return null;
  };

  useEffect(() => {
    refreshLocation();
    const syncInterval = setInterval(() => {
      refreshLocation();
    }, 20000);
    return () => clearInterval(syncInterval);
  }, [user?.id, travellerName]);

  // Handle Manual SOS Submission
  const handleTriggerSos = async () => {
    if (submitLockRef.current || isSubmitting) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSosError('');
    setSosSuccessResult(null);

    try {
      let currentLoc = gpsLocation;
      if (!currentLoc && gpsPermission !== 'denied') {
        currentLoc = await refreshLocation();
      }

      const sosPayload = {
        userId,
        userName: travellerName.trim() || 'Active Tourist',
        type: 'MANUAL_SOS',
        priority: 'CRITICAL',
        message: `🚨 MANUAL SOS triggered by ${travellerName}! Immediate emergency response required.`,
        location: currentLoc
          ? {
              lat: currentLoc.lat,
              lng: currentLoc.lng,
              name: `GPS Fix (Lat: ${currentLoc.lat.toFixed(4)}, Lng: ${currentLoc.lng.toFixed(4)})`,
            }
          : null,
        batteryLevel,
        networkStatus: serverReachable ? 'Online (LAN)' : 'Attempting Broadcast',
        deviceInfo: await getDeviceTelemetry(batteryLevel),
        tripId: user?.activeTripId || activeSafeZone?.id || null,
        timestamp: new Date().toISOString(),
      };

      const res = await emergencyService.triggerSos(sosPayload);
      if (res && res.success) {
        setSosSuccessResult({
          alertId: res.alert?.id || `alt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          location: currentLoc
            ? `${currentLoc.lat.toFixed(4)}, ${currentLoc.lng.toFixed(4)}`
            : 'Coordinates Unavailable',
          status: res.alert?.status || 'Pending',
        });
      }
    } catch (err) {
      setSosError(err.message || 'Failed to dispatch SOS alert.');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleActivateSafeZoneTrip = (trip) => {
    setActiveSafeZone(trip);
    setActiveZone(trip);
  };

  // Safe Zone display destination object for current trip card
  const displayCurrentTrip = activeZone
    ? {
        destination: activeZone.destination || activeZone.destinationName,
        radiusMeters: activeZone.radiusMeters || 5000,
        status: safeZoneStatus === 'ACTIVE' ? 'Active' : safeZoneStatus,
        imageUrl:
          activeZone.imageUrl ||
          getDestinationImageUrl(activeZone.destination || activeZone.destinationName),
      }
    : null;

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ========================================================
            TOP BAR: Greeting & Avatar (Matching Reference Screen 3)
            ======================================================== */}
        <View style={styles.topBarRow}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={[styles.greetingText, { color: colors.text }]}>
                Hi, {travellerName}
              </Text>
              <Text style={styles.greetingWave}> 👋</Text>
            </View>
            <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Tourist</Text>
          </View>

          <View style={styles.topBarRightGroup}>
            {/* Notification Bell with Badge Dot */}
            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}
              onPress={onNavigateNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <View style={styles.bellBadgeDot} />
            </TouchableOpacity>

            {/* Profile Avatar */}
            <TouchableOpacity onPress={onNavigateProfile} activeOpacity={0.7}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, { backgroundColor: '#FFE5EC', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF5E7E' }}>
                    {(travellerName || 'T').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            STSMS BRAND BANNER (Pastel Gradient with Shield)
            ======================================================== */}
        <View style={[styles.brandBanner, SHADOWS.card]}>
          <View style={styles.bannerLeftCol}>
            <View style={styles.bannerShieldCircle}>
              <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTitle}>STSMS</Text>
              <Text style={styles.bannerSubtitle}>
                Smart Tourist Safety Monitoring System
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            3 STAT BADGES ROW (Active Trip, Alerts, Battery %)
            ======================================================== */}
        <View style={styles.statCardsRow}>
          {/* Active Trip Badge */}
          <View style={[styles.statCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#E8FDF5' }]}>
              <Ionicons name="location" size={18} color="#06D6A0" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {activeZone ? '1' : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Trip</Text>
          </View>

          {/* Alerts Badge */}
          <View style={[styles.statCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FFF8EB' }]}>
              <Ionicons name="notifications" size={18} color="#FF9F1C" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {safeZoneStatus === 'BREACHED' ? '1' : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Alerts</Text>
          </View>

          {/* Battery Badge */}
          <View style={[styles.statCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EBF4FF' }]}>
              <Ionicons name="battery-charging" size={18} color="#32ADE6" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {batteryLevel != null ? `${batteryLevel}%` : '--%'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Battery</Text>
          </View>
        </View>

        {/* ========================================================
            CURRENT TRIP SECTION & PLAN NEW TRIP BUTTON
            ======================================================== */}
        <TripStatusCard
          activeTrip={displayCurrentTrip}
          onStartTrip={() => setIsDestinationModalVisible(true)}
          onViewDetails={onNavigateMap}
        />

        {/* ========================================================
            SAFE ZONE MONITORING CARD (Active, Approaching, Warning)
            ======================================================== */}
        <SafeZoneStatusCard
          safeZone={activeZone}
          status={safeZoneStatus}
          distanceMeters={safeZoneDistanceMeters}
          distanceOutsideMeters={safeZoneDistanceOutside}
          currentCoords={gpsLocation}
          gpsAccuracy={gpsLocation?.accuracy}
          batteryLevel={batteryLevel}
          lastFixTime={lastSyncTime}
          warningActive={safeZoneWarningActive}
          warningCountdown={safeZoneWarningCountdown}
          isSyncing={isSafeZoneSyncing}
          onOpenSearch={() => setIsDestinationModalVisible(true)}
          onConfirmSafe={handleConfirmSafeZone}
          onPauseMonitoring={handlePauseSafeZone}
          onResumeMonitoring={handleResumeSafeZone}
          onEndTrip={handleEndSafeZone}
          onTriggerSos={() => {
            setEmergencyModalType(
              safeZoneStatus === 'BREACHED' ? 'GEOFENCE_BREACH' : 'MANUAL_SOS'
            );
            setIsEmergencyModalOpen(true);
          }}
        />

        {/* ========================================================
            DEAD MAN'S SWITCH AUTOMATED CHECK-IN SAFETY SYSTEM
            ======================================================== */}
        <DeadManSwitchCard
          currentCoords={gpsLocation}
          batteryLevel={batteryLevel}
        />

        {/* ========================================================
            QUICK ACCESS TO LIVE MAP & EMERGENCY SOS
            ======================================================== */}
        <View style={styles.quickAccessSection}>
          <TouchableOpacity
            style={[styles.quickMapCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}
            onPress={onNavigateMap}
            activeOpacity={0.85}
          >
            <View style={styles.quickMapLeft}>
              <View style={styles.mapIconCircle}>
                <Ionicons name="map" size={22} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.quickMapTitle, { color: colors.text }]}>Live Radar Map</Text>
                <Text style={[styles.quickMapSub, { color: colors.textSecondary }]}>
                  View 5 km safe zone boundary & real-time telemetry
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* 1-Tap Emergency SOS Button */}
          <SosButton
            onSosTriggered={() => {
              setEmergencyModalType('MANUAL_SOS');
              setIsEmergencyModalOpen(true);
            }}
          />
        </View>
      </ScrollView>

      {/* ========================================================
          DESTINATION SELECTION & GEOFENCE ACTIVATION MODAL
          ======================================================== */}
      <DestinationSelectionModal
        visible={isDestinationModalVisible}
        currentCoords={gpsLocation}
        onClose={() => setIsDestinationModalVisible(false)}
        onActivateZone={handleActivateSafeZoneTrip}
        userGuardianPhone={user?.phone || '+91 98765 43210'}
      />

      {/* ========================================================
          EMERGENCY DISTRESS / GEOFENCE BREACH MODAL
          ======================================================== */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        alertType={emergencyModalType}
        geofenceData={
          emergencyModalType === 'GEOFENCE_BREACH'
            ? {
                destination: activeZone?.destination || activeZone?.destinationName,
                distanceMeters: safeZoneDistanceMeters,
                radiusMeters: 5000,
              }
            : null
        }
        onClose={() => setIsEmergencyModalOpen(false)}
        onConfirmSos={handleTriggerSos}
        onConfirmSafe={handleConfirmSafeZone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 110,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    fontWeight: '800',
  },
  greetingWave: {
    fontSize: 20,
  },
  roleLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  topBarRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B69',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  brandBanner: {
    backgroundColor: '#FF6B8B',
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
  },
  bannerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerShieldCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  quickAccessSection: {
    marginTop: 10,
  },
  quickMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  quickMapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMapTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickMapSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
