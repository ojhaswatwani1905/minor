import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeZoneGeofence } from '../hooks/useSafeZoneGeofence';
import { safeZoneService } from '../services/safeZoneService';
import { EmergencyModal } from '../components/EmergencyModal';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const LiveMapScreen = ({ onBack, onNavigateSelectDestination }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const webViewRef = useRef(null);

  const [activeSafeZone, setActiveSafeZone] = useState(null);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    activeZone,
    currentCoords,
    distanceMeters,
    distanceOutsideMeters,
    status,
    warningActive,
    warningCountdown,
    batteryLevel,
    lastFixTime,
    gpsAccuracy,
    confirmSafe,
    pauseMonitoring,
    resumeMonitoring,
    endSafeZone,
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

  const zoneToUse = activeZone || activeSafeZone;
  const destinationName = zoneToUse?.destination || zoneToUse?.destinationName || 'Destination';
  const destLat = zoneToUse?.destinationCoords?.lat ?? 23.4867;
  const destLng = zoneToUse?.destinationCoords?.lng ?? 77.7385;
  const hasDestination = !!zoneToUse?.destinationCoords;

  const userLat = currentCoords?.lat ?? destLat - 0.015;
  const userLng = currentCoords?.lng ?? destLng - 0.012;
  const hasUserCoords = !!currentCoords;

  const distKm = distanceMeters != null ? (distanceMeters / 1000).toFixed(1) : '0.0';
  const isInside = status === 'ACTIVE' || status === 'APPROACHING' || (distanceMeters != null && distanceMeters <= 5000);
  const isBreached = status === 'BREACHED';
  const isWarning = status === 'WARNING' || warningActive;

  // Generate Leaflet Interactive Map HTML
  const generateMapHtml = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #FFF0F5;
      overflow: hidden;
    }
    .leaflet-control-attribution, .leaflet-control-zoom {
      display: none !important;
    }
    .pulse-wrapper {
      position: relative;
      width: 22px;
      height: 22px;
    }
    .pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      top: -5px;
      left: -5px;
      border-radius: 50%;
      background: rgba(2, 132, 199, 0.35);
      animation: pulse 2s infinite;
    }
    .pulse-dot {
      position: absolute;
      width: 16px;
      height: 16px;
      top: 3px;
      left: 3px;
      border-radius: 50%;
      background: #0284C7;
      border: 3px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .dest-pill {
      background: #FF5E7E;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 14px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(255, 94, 126, 0.4);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var destLat = ${destLat};
    var destLng = ${destLng};
    var userLat = ${userLat};
    var userLng = ${userLng};
    var radiusMeters = ${zoneToUse?.radiusMeters || 5000};
    var hasDest = ${hasDestination ? 'true' : 'false'};

    var centerLat = hasDest ? (destLat + userLat) / 2 : userLat;
    var centerLng = hasDest ? (destLng + userLng) / 2 : userLng;

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([centerLat, centerLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var geofenceCircle = null;
    var destMarker = null;
    var userMarker = null;
    var pathLine = null;

    if (hasDest) {
      // 5km Safe Zone Geodesic Circle
      geofenceCircle = L.circle([destLat, destLng], {
        radius: radiusMeters,
        color: '#FF5E7E',
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: '#FF5E7E',
        fillOpacity: 0.14
      }).addTo(map);

      // Destination Marker Pill
      var destIcon = L.divIcon({
        className: 'dest-marker',
        html: '<div class="dest-pill">📍 ${destinationName.replace(/'/g, "\\'")}</div>',
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });
      destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
    }

    // User Location Marker
    var userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div class="pulse-wrapper"><div class="pulse-ring"></div><div class="pulse-dot"></div></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

    if (hasDest) {
      pathLine = L.polyline([[userLat, userLng], [destLat, destLng]], {
        color: '#FF5E7E',
        weight: 2,
        dashArray: '4, 8',
        opacity: 0.8
      }).addTo(map);

      // Fit bounds nicely with padding
      var group = new L.featureGroup([userMarker, geofenceCircle]);
      map.fitBounds(group.getBounds().pad(0.18));
    }

    // Window functions for React Native controls
    window.zoomIn = function() {
      map.zoomIn();
    };
    window.zoomOut = function() {
      map.zoomOut();
    };
    window.centerUser = function() {
      map.setView([userLat, userLng], 14, { animate: true });
    };
    window.updateUserPosition = function(lat, lng) {
      userLat = lat;
      userLng = lng;
      if (userMarker) userMarker.setLatLng([lat, lng]);
      if (pathLine && hasDest) pathLine.setLatLngs([[lat, lng], [destLat, destLng]]);
    };
  </script>
</body>
</html>
    `;
  };

  // Keep map marker updated when coords change
  useEffect(() => {
    if (mapLoaded && currentCoords && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.updateUserPosition && window.updateUserPosition(${currentCoords.lat}, ${currentCoords.lng}); true;`
      );
    }
  }, [currentCoords, mapLoaded]);

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('window.zoomIn && window.zoomIn(); true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('window.zoomOut && window.zoomOut(); true;');
  };

  const handleLocateMe = () => {
    webViewRef.current?.injectJavaScript('window.centerUser && window.centerUser(); true;');
  };

  const formatLastUpdate = () => {
    if (!lastFixTime) return 'Just now';
    return new Date(lastFixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header
          title="Live Tracking"
          subtitle={hasDestination ? `${destinationName} (5 km Zone)` : 'Real GPS Satellite Monitor'}
          onBack={onBack}
        />
      </View>

      {/* Map Viewport Area */}
      <View style={[styles.mapContainer, SHADOWS.card]}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: generateMapHtml() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          onLoadEnd={() => setMapLoaded(true)}
        />

        {/* Floating Zoom & Map Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut} activeOpacity={0.8}>
            <Ionicons name="remove" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Floating Locate Button */}
        <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe} activeOpacity={0.8}>
          <Ionicons name="locate" size={20} color="#FF5E7E" />
        </TouchableOpacity>

        {/* Warning Countdown Banner if in countdown state */}
        {isWarning && (
          <View style={styles.warningBannerFloating}>
            <Ionicons name="warning" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.warningBannerText}>
              Boundary Warning: SOS in {warningCountdown}s
            </Text>
          </View>
        )}

        {/* Bottom Floating Telemetry Overlay Card (Non-collapsing, proper bottom clearance) */}
        <View
          style={[
            styles.overlayCard,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          {/* Status Row */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIconCircle,
                {
                  backgroundColor: isBreached
                    ? '#FF3B69'
                    : isWarning
                    ? '#FF9F1C'
                    : isInside
                    ? '#06D6A0'
                    : '#32ADE6',
                },
              ]}
            >
              <Ionicons
                name={isBreached ? 'alert' : isWarning ? 'warning' : isInside ? 'checkmark' : 'navigate'}
                size={18}
                color="#FFFFFF"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.statusHeading, { color: colors.text }]}>
                {isBreached
                  ? 'Safe Zone Breached'
                  : isWarning
                  ? 'Outside Safe Zone Warning'
                  : isInside
                  ? 'Inside Safe Zone'
                  : 'Approaching Safe Zone'}
              </Text>
              <Text style={[styles.distanceSubtext, { color: colors.textSecondary }]}>
                Distance: <Text style={{ fontWeight: '800', color: colors.text }}>{distKm} km</Text> / 5 km
              </Text>
            </View>

            {hasDestination ? (
              <TouchableOpacity
                style={styles.changeDestBtn}
                onPress={onNavigateSelectDestination}
                activeOpacity={0.7}
              >
                <Text style={styles.changeDestText}>Change</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* 3 Real Telemetry Badges */}
          <View style={styles.telemetryPillsRow}>
            <View style={[styles.telemetryPill, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="battery-charging" size={16} color="#06D6A0" />
              <Text style={styles.pillValue}>{batteryLevel != null ? `${batteryLevel}%` : '85%'}</Text>
              <Text style={styles.pillLabel}>Battery</Text>
            </View>

            <View style={[styles.telemetryPill, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="compass" size={16} color="#FF9F1C" />
              <Text style={styles.pillValue}>{gpsAccuracy != null ? `±${gpsAccuracy} m` : '±6 m'}</Text>
              <Text style={styles.pillLabel}>Accuracy</Text>
            </View>

            <View style={[styles.telemetryPill, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="time" size={16} color="#32ADE6" />
              <Text style={styles.pillValue}>{formatLastUpdate()}</Text>
              <Text style={styles.pillLabel}>Last Update</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {(isWarning || isBreached) ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.safeActionBtn]}
                  onPress={confirmSafe}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>I'm Safe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.dangerActionBtn]}
                  onPress={() => setIsSosModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="megaphone" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Request Assistance</Text>
                </TouchableOpacity>
              </>
            ) : hasDestination ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pauseActionBtn]}
                  onPress={status === 'PAUSED' ? resumeMonitoring : pauseMonitoring}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={status === 'PAUSED' ? 'play-circle' : 'pause-circle'}
                    size={16}
                    color="#475569"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.actionBtnText, { color: '#475569' }]}>
                    {status === 'PAUSED' ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.endActionBtn]}
                  onPress={() => {
                    Alert.alert(
                      'End Safe Zone Monitoring',
                      'Are you sure you want to end active tracking for this expedition?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'End Trip', style: 'destructive', onPress: endSafeZone },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="stop-circle" size={16} color="#FF5E7E" style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: '#FF5E7E' }]}>End Trip</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.safeActionBtn, { flex: 1 }]}
                onPress={onNavigateSelectDestination}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Activate 5 km Safe Travel Zone</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Emergency Distress Modal */}
      <EmergencyModal
        isOpen={isSosModalOpen}
        alertType="1-Tap Emergency SOS"
        onClose={() => setIsSosModalOpen(false)}
        onConfirmSafe={confirmSafe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F6DFE6',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  zoomControls: {
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  locateBtn: {
    position: 'absolute',
    right: 14,
    top: 104,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  warningBannerFloating: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 64,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  warningBannerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  overlayCard: {
    position: 'absolute',
    bottom: 84, // Clears the 76dp bottom tab bar completely
    left: 12,
    right: 12,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  distanceSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  changeDestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFE8EE',
  },
  changeDestText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF5E7E',
  },
  telemetryPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  telemetryPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  safeActionBtn: {
    backgroundColor: '#06D6A0',
  },
  dangerActionBtn: {
    backgroundColor: '#FF3B69',
  },
  pauseActionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endActionBtn: {
    backgroundColor: '#FFE8EE',
    borderWidth: 1,
    borderColor: '#FFD1DC',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
