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
  Platform 
} from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { useAuth } from '../context/AuthContext';
import { emergencyService } from '../services/emergencyService';
import { locationService } from '../services/locationService';
import { getServerBaseUrl, setServerBaseUrl, DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '../utils/api';

export const HomeScreen = ({ onNavigateProfile }) => {
  const { user } = useAuth();

  // Traveller Identity
  const [travellerName, setTravellerName] = useState(user?.name || user?.fullName || 'Traveller');
  const [userId] = useState(user?.id || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || user?.fullName || 'Traveller');

  // GPS Telemetry State (NO FABRICATED COORDINATES)
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsPermission, setGpsPermission] = useState('checking'); // 'granted' | 'denied' | 'checking'
  const [gpsFetching, setGpsFetching] = useState(false);

  // Battery Telemetry State
  const [batteryLevel, setBatteryLevel] = useState(null);

  // Real-time Telemetry Sync Stream State
  const [telemetrySyncing, setTelemetrySyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncedCityName, setSyncedCityName] = useState(null);

  // Network & Server Connectivity State
  const [serverUrl, setServerUrl] = useState('');
  const [serverReachable, setServerReachable] = useState(null);
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [serverInput, setServerInput] = useState('');

  // SOS Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosSuccessResult, setSosSuccessResult] = useState(null);
  const [sosError, setSosError] = useState('');

  // Track if SOS was tapped to prevent multi-tap race conditions
  const submitLockRef = useRef(false);

  // 1. Initialize Server URL and verify connectivity
  const checkServerConnection = async () => {
    try {
      const base = await getServerBaseUrl();
      setServerUrl(base);
      setServerInput(base);

      // Ping health check endpoint
      const healthUrl = `${base.replace(/\/api$/, '')}/api/health`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3000);

      const res = await fetch(healthUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        setServerReachable(true);
      } else {
        setServerReachable(false);
      }
    } catch (e) {
      setServerReachable(false);
    }
  };

  useEffect(() => {
    checkServerConnection();
    const interval = setInterval(checkServerConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Real Telemetry Sync to Express Backend (Real Location & Real Battery)
  const syncTelemetry = async (locToSync, batToSync) => {
    const loc = locToSync !== undefined ? locToSync : gpsLocation;
    let bat = batToSync !== undefined ? batToSync : batteryLevel;

    if (bat === null) {
      try {
        const freshBat = await Battery.getBatteryLevelAsync();
        if (freshBat >= 0) {
          bat = Math.round(freshBat * 100);
          setBatteryLevel(bat);
        }
      } catch (e) {}
    }

    try {
      setTelemetrySyncing(true);

      let locationName = null;
      if (loc?.lat && loc?.lng) {
        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: loc.lat,
            longitude: loc.lng
          });
          if (rev && rev.length > 0) {
            const r = rev[0];
            const parts = [r.name, r.city || r.subregion, r.region, r.country].filter(Boolean);
            if (parts.length > 0) {
              locationName = parts.slice(0, 3).join(', ');
              setSyncedCityName(locationName);
            }
          }
        } catch (e) {}
      }

      const payload = {
        userId: user?.id || userId,
        email: user?.email,
        name: travellerName,
        fullName: travellerName,
        phone: user?.phone,
        lat: loc ? loc.lat : null,
        lng: loc ? loc.lng : null,
        locationName: locationName || (loc ? `GPS Fix (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})` : null),
        batteryLevel: bat,
        networkSignal: loc ? 'Mobile GNSS (Online)' : 'No GPS Fix (Offline)',
        elevation: loc?.altitude ? `${loc.altitude} m` : null
      };

      const res = await locationService.sendLocationUpdate(payload);
      if (res && res.success) {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.log('[TELEMETRY SYNC NOTE]', e.message);
    } finally {
      setTelemetrySyncing(false);
    }
  };

  // 2. Read Real Hardware Battery Level
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
      } catch (err) {
        setBatteryLevel(null);
      }
    })();

    return () => {
      if (batterySub) batterySub.remove();
    };
  }, [gpsLocation, user?.id, travellerName]);

  // 3. Request and Fetch GPS Location (No Fake Data)
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

      // Attempt high-accuracy fresh fix
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
      // Try last known location as fallback
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

      // If location is truly unavailable, set to null (never fabricate)
      setGpsLocation(null);
      syncTelemetry(null, batteryLevel);
    } finally {
      setGpsFetching(false);
    }
    return null;
  };

  useEffect(() => {
    refreshLocation();

    // Continuous heartbeat every 20 seconds while app is active
    const syncInterval = setInterval(() => {
      refreshLocation();
    }, 20000);

    return () => clearInterval(syncInterval);
  }, [user?.id, travellerName]);

  // 4. Submit Manual SOS Alert
  const handleTriggerSos = async () => {
    if (submitLockRef.current || isSubmitting) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSosError('');
    setSosSuccessResult(null);

    try {
      // 1. Get freshest available GPS location (or null if denied)
      let currentLoc = gpsLocation;
      if (!currentLoc && gpsPermission !== 'denied') {
        currentLoc = await refreshLocation();
      }

      // 2. Get freshest battery level
      let currentBat = batteryLevel;
      try {
        const bat = await Battery.getBatteryLevelAsync();
        if (bat >= 0) {
          currentBat = Math.round(bat * 100);
          setBatteryLevel(currentBat);
        }
      } catch (e) {}

      // 3. Assemble hardware / platform device telemetry
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        model: Platform.constants?.Model || Platform.constants?.Brand || Platform.OS,
      };

      // 4. Assemble clean payload (no fabricated values)
      const sosPayload = {
        userId,
        userName: travellerName.trim() || 'Active Traveller',
        type: 'MANUAL_SOS',
        priority: 'CRITICAL',
        message: `🚨 MANUAL SOS triggered by ${travellerName}! Immediate emergency SAR response required.`,
        location: currentLoc ? {
          lat: currentLoc.lat,
          lng: currentLoc.lng,
          name: `GPS Fix (Lat: ${currentLoc.lat.toFixed(4)}, Lng: ${currentLoc.lng.toFixed(4)})`
        } : null,
        batteryLevel: currentBat,
        networkStatus: serverReachable ? 'Online (LAN Wi-Fi)' : 'Attempting Broadcast',
        deviceInfo,
        tripId: user?.activeTripId || null,
        tripInfo: user?.tripDestination ? `Expedition to ${user.tripDestination}` : null,
        timestamp: new Date().toISOString()
      };

      console.log('[MOBILE SOS] Transmitting alert to backend:', sosPayload);

      // 5. Submit to backend
      const res = await emergencyService.triggerSos(sosPayload);

      if (res && res.success) {
        setSosSuccessResult({
          alertId: res.alert?.id || `alt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          location: currentLoc ? `${currentLoc.lat.toFixed(4)}, ${currentLoc.lng.toFixed(4)}` : 'Coordinates Unavailable',
          status: res.alert?.status || 'Pending'
        });
      } else {
        throw new Error(res?.message || 'Server did not acknowledge SOS transmission.');
      }
    } catch (err) {
      console.error('[MOBILE SOS ERROR]', err);
      setSosError(err.message || 'Failed to dispatch SOS alert. Verify that your phone is on the same Wi-Fi as your computer.');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleSaveServerUrl = async () => {
    if (serverInput.trim()) {
      await setServerBaseUrl(serverInput.trim());
      setServerUrl(serverInput.trim());
      setIsEditingServer(false);
      checkServerConnection();
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setTravellerName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* App Branding Header */}
      <View style={styles.brandHeader}>
        <View style={styles.shieldBadge}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>
        <View style={styles.brandTextCol}>
          <Text style={styles.brandTitle}>STSMS EMERGENCIES</Text>
          <Text style={styles.brandSubtitle}>Smart Tourist Safety Monitoring System</Text>
        </View>
      </View>

      {/* Traveller Identity Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>TRAVELLER PROFILE</Text>
          <TouchableOpacity onPress={() => setIsEditingName(true)} activeOpacity={0.7}>
            <Text style={styles.editBtnText}>Edit Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.travellerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{travellerName ? travellerName.charAt(0).toUpperCase() : 'T'}</Text>
          </View>
          <View style={styles.travellerInfo}>
            <Text style={styles.travellerName}>{travellerName}</Text>
            <Text style={styles.travellerId}>ID: {userId} • Registered Traveller</Text>
          </View>
        </View>
      </View>

      {/* Edit Name Modal */}
      <Modal visible={isEditingName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Traveller Name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setIsEditingName(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalBtn, styles.modalBtnSave]}
              >
                <Text style={styles.modalBtnSaveText}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Real-time Hardware Telemetry Status Grid */}
      <View style={styles.telemetryGrid}>
        {/* GPS Status Card */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryTop}>
            <Text style={styles.telemetryLabel}>GPS POSITION</Text>
            <TouchableOpacity onPress={refreshLocation} disabled={gpsFetching}>
              <Text style={styles.refreshText}>{gpsFetching ? 'Fixing...' : '↻ Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {gpsPermission === 'denied' ? (
            <View>
              <Text style={styles.telemetryWarn}>⚠️ Permission Denied</Text>
              <TouchableOpacity onPress={refreshLocation}>
                <Text style={styles.reqPermissionLink}>Grant GPS Permission</Text>
              </TouchableOpacity>
            </View>
          ) : gpsLocation ? (
            <View>
              <Text style={styles.telemetryValCyan}>
                {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
              </Text>
              {syncedCityName ? (
                <Text style={styles.telemetryCityText} numberOfLines={1}>
                  📍 {syncedCityName}
                </Text>
              ) : null}
              <Text style={styles.telemetrySub}>
                Accuracy: {gpsLocation.accuracy ? `±${gpsLocation.accuracy}m` : 'Valid GNSS'}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.telemetryValMuted}>
                {gpsFetching ? 'Acquiring satellite fix...' : 'GPS Not Available'}
              </Text>
              <Text style={styles.telemetrySub}>Location will be sent as null</Text>
            </View>
          )}
        </View>

        {/* Battery & Network Status Card */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryTop}>
            <Text style={styles.telemetryLabel}>DEVICE STATUS</Text>
            <Text style={styles.platformBadge}>{Platform.OS.toUpperCase()}</Text>
          </View>

          <View style={styles.deviceStatusRow}>
            <Text style={styles.statusProp}>Battery:</Text>
            <Text style={styles.statusValGreen}>
              {batteryLevel != null ? `🔋 ${batteryLevel}%` : 'Unknown'}
            </Text>
          </View>

          <View style={styles.deviceStatusRow}>
            <Text style={styles.statusProp}>Server:</Text>
            <Text style={serverReachable ? styles.statusValGreen : styles.statusValAmber}>
              {serverReachable === true ? '🟢 Connected' : serverReachable === false ? '🔴 Unreachable' : '🟡 Checking...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Real-time Hardware Telemetry Live Stream Strip */}
      <View style={styles.telemetrySyncStrip}>
        <View style={styles.syncStatusLeft}>
          <View style={[styles.pulseDot, { backgroundColor: lastSyncTime ? '#10b981' : '#f59e0b' }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.syncStatusTitle}>
              {lastSyncTime ? 'Live Telemetry Stream Active' : 'Initializing Hardware Telemetry...'}
            </Text>
            <Text style={styles.syncStatusSubtitle}>
              {lastSyncTime 
                ? `Real GPS & battery synced at ${lastSyncTime}` 
                : 'Connecting device sensors to Command Center'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => refreshLocation()}
          disabled={gpsFetching || telemetrySyncing}
          activeOpacity={0.7}
          style={styles.syncNowBtn}
        >
          <Text style={styles.syncNowBtnText}>
            {telemetrySyncing || gpsFetching ? 'Syncing...' : '↻ Push Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prominent Tactile SOS Distress Button */}
      <View style={styles.sosContainer}>
        <TouchableOpacity
          onPress={handleTriggerSos}
          disabled={isSubmitting}
          activeOpacity={0.8}
          style={[
            styles.sosButton,
            isSubmitting && styles.sosButtonDisabled
          ]}
        >
          {isSubmitting ? (
            <View style={styles.sosInnerLoading}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.sosLoadingText}>BROADCASTING...</Text>
            </View>
          ) : (
            <View style={styles.sosInner}>
              <Text style={styles.sosMainText}>SOS</Text>
              <Text style={styles.sosSubText}>1-TAP EMERGENCY</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sosHint}>
          Pressing SOS dispatches an authentic distress beacon directly to the Admin Command Center with your latest coordinates and battery level.
        </Text>
      </View>

      {/* Success Banner */}
      {sosSuccessResult && (
        <View style={styles.successBanner}>
          <View style={styles.bannerHeader}>
            <Text style={styles.successTitle}>✅ EMERGENCY SOS REGISTERED</Text>
            <Text style={styles.badgePending}>{sosSuccessResult.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.successText}>
            Command Center has received your distress alert. An emergency operator has been alerted.
          </Text>
          <View style={styles.successDetails}>
            <Text style={styles.detailText}>• Alert ID: <Text style={styles.boldWhite}>{sosSuccessResult.alertId}</Text></Text>
            <Text style={styles.detailText}>• Transmitted: <Text style={styles.boldWhite}>{sosSuccessResult.timestamp}</Text></Text>
            <Text style={styles.detailText}>• Location: <Text style={styles.boldWhite}>{sosSuccessResult.location}</Text></Text>
          </View>
        </View>
      )}

      {/* Error Banner */}
      {!!sosError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>❌ SOS TRANSMISSION FAILED</Text>
          <Text style={styles.errorText}>{sosError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleTriggerSos}
            disabled={isSubmitting}
          >
            <Text style={styles.retryBtnText}>Retry SOS Transmission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Configurable Server IP Strip (For Physical Phone Testing) */}
      <View style={styles.serverStrip}>
        <View style={styles.serverStripRow}>
          <View style={styles.serverInfoCol}>
            <Text style={styles.serverStripLabel}>API TARGET SERVER</Text>
            <Text style={styles.serverStripUrl} numberOfLines={1}>{serverUrl || 'Loading...'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditingServer(true)}
            style={styles.serverChangeBtn}
          >
            <Text style={styles.serverChangeBtnText}>Change IP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Server IP Modal */}
      <Modal visible={isEditingServer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure API Server URL</Text>
            <Text style={styles.modalSub}>
              Enter your development computer's LAN IP address so your physical phone can communicate over Wi-Fi.
            </Text>
            <TextInput
              value={serverInput}
              onChangeText={setServerInput}
              placeholder={`http://${DEFAULT_SERVER_HOST}:${DEFAULT_SERVER_PORT}/api`}
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setIsEditingServer(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveServerUrl}
                style={[styles.modalBtn, styles.modalBtnSave]}
              >
                <Text style={styles.modalBtnSaveText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#0B0F17',
    flexGrow: 1,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 14,
  },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 22,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22d3ee',
  },
  travellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  travellerInfo: {
    flex: 1,
  },
  travellerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  travellerId: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-between',
  },
  telemetryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  refreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22d3ee',
  },
  telemetryValCyan: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22d3ee',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  telemetryValMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  telemetryWarn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f87171',
  },
  reqPermissionLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22d3ee',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  telemetrySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  platformBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusProp: {
    fontSize: 11,
    color: '#94a3b8',
  },
  statusValGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  statusValAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#dc2626',
    borderWidth: 6,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 16,
  },
  sosButtonDisabled: {
    backgroundColor: '#991b1b',
    opacity: 0.85,
  },
  sosInner: {
    alignItems: 'center',
  },
  sosMainText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  sosSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fecaca',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  sosInnerLoading: {
    alignItems: 'center',
    gap: 8,
  },
  sosLoadingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  sosHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 16,
  },
  successBanner: {
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#34d399',
  },
  badgePending: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    fontWeight: '800',
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  successText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 8,
  },
  successDetails: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  boldWhite: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f87171',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#fecaca',
    lineHeight: 16,
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  serverStrip: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 8,
  },
  serverStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  serverInfoCol: {
    flex: 1,
  },
  serverStripLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  serverStripUrl: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  serverChangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
  },
  serverChangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22d3ee',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#05080e',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalBtnCancel: {
    backgroundColor: '#1e293b',
  },
  modalBtnCancelText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  modalBtnSave: {
    backgroundColor: '#0891b2',
  },
  modalBtnSaveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  telemetryCityText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  telemetrySyncStrip: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncStatusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  syncStatusSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  syncNowBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  syncNowBtnText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
  },
});
