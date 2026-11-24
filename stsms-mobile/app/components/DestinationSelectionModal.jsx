import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { safeZoneService } from '../services/safeZoneService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS } from '../constants/theme';
import { getDestinationImageUrl } from '../utils/destinationImages';

// Verified fallback reference destinations
const POPULAR_DESTINATIONS = [
  {
    name: 'Agra Airport',
    displayName: 'Agra Airport (Kheria Airport), Agra, Uttar Pradesh',
    lat: 27.1558,
    lng: 77.9654,
    imageUrl: getDestinationImageUrl('Agra Airport'),
    type: 'Aviation Transit',
  },
  {
    name: 'Sanchi Stupa',
    displayName: 'Sanchi Buddhist Monument Complex, Raisen, MP',
    lat: 23.4867,
    lng: 77.7385,
    imageUrl: getDestinationImageUrl('Sanchi Stupa'),
    type: 'UNESCO Heritage',
  },
  {
    name: 'Rohtang Pass Summit',
    displayName: 'Rohtang Mountain Pass, Himachal Pradesh',
    lat: 32.3716,
    lng: 77.2466,
    imageUrl: getDestinationImageUrl('Rohtang Pass'),
    type: 'Mountain Pass',
  },
  {
    name: 'Solang Valley',
    displayName: 'Solang Valley Trail & Ski Reserve, Manali, HP',
    lat: 32.3166,
    lng: 77.1575,
    imageUrl: getDestinationImageUrl('Solang Valley'),
    type: 'Alpine Valley',
  },
  {
    name: 'Bhojpur Temple',
    displayName: 'Bhojeshwar Mahadev Temple, Bhopal Corridor, MP',
    lat: 23.1008,
    lng: 77.5855,
    imageUrl: getDestinationImageUrl('Bhojpur Temple'),
    type: 'Historic Monument',
  },
  {
    name: 'Udaygiri Caves',
    displayName: 'Udaygiri Rock Cut Sanctuaries, Vidisha, MP',
    lat: 23.5350,
    lng: 77.7797,
    imageUrl: getDestinationImageUrl('Udaygiri Caves'),
    type: 'Rock Sanctuary',
  },
];

export const DestinationSelectionModal = ({
  visible,
  currentCoords,
  onClose,
  onActivateZone,
  userGuardianPhone = '+91 98765 43210',
}) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  const searchTimerRef = useRef(null);
  const requestIdRef = useRef(0);
  const isMapReadyRef = useRef(false);
  const pendingCoordsRef = useRef(null);

  // Default coordinate: current GPS fix or Agra Airport
  const defaultLat = currentCoords?.lat ?? 27.1558;
  const defaultLng = currentCoords?.lng ?? 77.9654;

  const [selectedCoords, setSelectedCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [resolvedAddress, setResolvedAddress] = useState('Current Selected Point');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [guardianPhone, setGuardianPhone] = useState(userGuardianPhone);
  const [customLabel, setCustomLabel] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // When modal becomes visible, initialize coordinates
  useEffect(() => {
    if (visible) {
      const lat = currentCoords?.lat ?? 27.1558;
      const lng = currentCoords?.lng ?? 77.9654;
      setSelectedCoords({ lat, lng });
      performReverseGeocode(lat, lng);
    }
  }, [visible]);

  // Reverse Geocoding helper with graceful fallback
  const performReverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const res = await safeZoneService.reverseGeocode(lat, lng);
      if (res.success && res.location) {
        const name = res.location.displayName || res.location.name || `Custom Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setResolvedAddress(name);
        if (!customLabel) {
          setCustomLabel(res.location.name || name.split(',')[0]);
        }
      } else {
        setResolvedAddress(`Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (err) {
      setResolvedAddress(`Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Place search with 350ms debounce and stale response rejection
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    searchTimerRef.current = setTimeout(async () => {
      const thisReqId = ++requestIdRef.current;
      try {
        const res = await safeZoneService.geocode(trimmed);
        if (thisReqId !== requestIdRef.current) return; // Stale response discarded

        if (res.success && Array.isArray(res.results)) {
          setSearchResults(res.results);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        if (thisReqId === requestIdRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (thisReqId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 350);
  };

  // Select place from search results
  const handleSelectSearchResult = (item) => {
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // 1. Close dropdown and clear query
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);

    // 2. Authoritative single state update
    setSelectedCoords({ lat, lng });
    const chosenName = item.name || item.displayName?.split(',')[0] || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    const fullAddress = item.displayName || item.name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setResolvedAddress(fullAddress);
    setCustomLabel(chosenName);
    setErrorMessage('');

    // 3. Move Leaflet map position without reloading WebView
    if (webViewRef.current) {
      if (isMapReadyRef.current) {
        webViewRef.current.injectJavaScript(`window.setMapPosition && window.setMapPosition(${lat}, ${lng}); true;`);
      } else {
        pendingCoordsRef.current = { lat, lng };
      }
    }

    // 4. Background reverse geocode for full address accuracy
    performReverseGeocode(lat, lng);
  };

  // User taps "Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (!currentCoords?.lat || !currentCoords?.lng) {
      setErrorMessage('GPS Location not acquired yet. Please ensure GPS is enabled.');
      return;
    }
    const lat = currentCoords.lat;
    const lng = currentCoords.lng;
    setSelectedCoords({ lat, lng });
    setCustomLabel('Current GPS Location');
    setErrorMessage('');

    if (webViewRef.current) {
      if (isMapReadyRef.current) {
        webViewRef.current.injectJavaScript(`window.setMapPosition && window.setMapPosition(${lat}, ${lng}); true;`);
      } else {
        pendingCoordsRef.current = { lat, lng };
      }
    }
    performReverseGeocode(lat, lng);
  };

  // Message from Leaflet WebView (map click, marker drag, or map ready handshake)
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        isMapReadyRef.current = true;
        if (pendingCoordsRef.current) {
          const { lat, lng } = pendingCoordsRef.current;
          webViewRef.current?.injectJavaScript(`window.setMapPosition && window.setMapPosition(${lat}, ${lng}); true;`);
          pendingCoordsRef.current = null;
        }
      } else if (data.type === 'LOCATION_SELECTED' && data.lat != null && data.lng != null) {
        const lat = parseFloat(data.lat);
        const lng = parseFloat(data.lng);
        setSelectedCoords({ lat, lng });
        performReverseGeocode(lat, lng);
        setCustomLabel('');
        setErrorMessage('');
      }
    } catch (e) {}
  };

  // Calculate distance from user's current GPS fix to the chosen safe-zone center
  const calculateDistance = () => {
    if (!currentCoords?.lat || !currentCoords?.lng || !selectedCoords?.lat || !selectedCoords?.lng) {
      return null;
    }
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(selectedCoords.lat - currentCoords.lat);
    const dLon = toRad(selectedCoords.lng - currentCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(currentCoords.lat)) *
        Math.cos(toRad(selectedCoords.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distMeters = calculateDistance();
  const distKm = distMeters != null ? (distMeters / 1000).toFixed(1) : null;

  // Confirm and activate Safe Travel Zone
  const handleConfirmActivation = async () => {
    if (!selectedCoords?.lat || !selectedCoords?.lng) return;
    setIsActivating(true);
    setErrorMessage('');

    const finalDestName = (customLabel || resolvedAddress || '').trim() || `Custom Location (${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)})`;

    try {
      const payload = {
        destinationName: finalDestName,
        destinationLat: selectedCoords.lat,
        destinationLng: selectedCoords.lng,
        radiusMeters: 5000,
        imageUrl: getDestinationImageUrl(finalDestName),
        currentLat: currentCoords?.lat || null,
        currentLng: currentCoords?.lng || null,
        currentAccuracy: currentCoords?.accuracy || null,
        guardianPhone: guardianPhone.trim() || '+91 98765 43210',
      };

      const res = await safeZoneService.createSafeZone(payload);
      if (res.success && res.trip) {
        onActivateZone(res.trip);
        handleClose();
      } else {
        setErrorMessage(res.message || 'Failed to activate Safe Travel Zone.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error communicating with safety server.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setIsPreviewMode(false);
    setSearchQuery('');
    setShowSearchResults(false);
    setErrorMessage('');
    onClose();
  };

  // Generate Interactive Leaflet Picker HTML (Memoized once to guarantee zero Webview reloads)
  const pickerHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #FFF0F5; overflow: hidden; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    .custom-marker {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-pin {
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      background: #FF5E7E;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -22px 0 0 -13px;
      box-shadow: 0 4px 12px rgba(255, 94, 126, 0.45);
      border: 2px solid #FFFFFF;
    }
    .marker-pin::after {
      content: '';
      width: 10px;
      height: 10px;
      margin: 6px 0 0 6px;
      background: #FFFFFF;
      position: absolute;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${defaultLat}, ${defaultLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    var circle = L.circle([${defaultLat}, ${defaultLng}], {
      radius: 5000,
      color: '#FF5E7E',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#FF5E7E',
      fillOpacity: 0.16
    }).addTo(map);

    var markerIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    var marker = L.marker([${defaultLat}, ${defaultLng}], {
      icon: markerIcon,
      draggable: true
    }).addTo(map);

    function notifyPosition(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_SELECTED',
          lat: lat,
          lng: lng
        }));
      }
    }

    marker.on('drag', function(e) {
      var p = e.target.getLatLng();
      if (circle) circle.setLatLng(p);
    });

    marker.on('dragend', function(e) {
      var p = e.target.getLatLng();
      if (circle) circle.setLatLng(p);
      notifyPosition(p.lat, p.lng);
    });

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      if (marker) marker.setLatLng([lat, lng]);
      if (circle) circle.setLatLng([lat, lng]);
      notifyPosition(lat, lng);
    });

    window.setMapPosition = function(lat, lng) {
      if (marker) marker.setLatLng([lat, lng]);
      if (circle) circle.setLatLng([lat, lng]);
      if (map) {
        map.setView([lat, lng], 13, { animate: true });
        setTimeout(function() { map.invalidateSize(); }, 200);
      }
    };

    window.zoomIn = function() { if (map) map.zoomIn(); };
    window.zoomOut = function() { if (map) map.zoomOut(); };

    // Handshake: Notify React Native that Leaflet map is fully initialized
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background || '#FFF0F5' }]}>
        {/* Top Header */}
        <View style={[styles.headerRow, { borderBottomColor: colors.cardBorder || '#F6DFE6' }]}>
          <TouchableOpacity
            onPress={isPreviewMode ? () => setIsPreviewMode(false) : handleClose}
            style={[styles.backBtn, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isPreviewMode ? 'Confirm Safe Zone' : 'Universal Location Picker'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!isPreviewMode ? (
          /* ========================================================
             STAGE 1: INTERACTIVE MAP & SEARCH PICKER
             ======================================================== */
          <View style={{ flex: 1 }}>
            {/* Search Bar */}
            <View style={styles.searchSection}>
              <View style={[styles.searchBar, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}>
                <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search city, town, airport, station, landmark..."
                  placeholderTextColor={colors.inputPlaceholder || '#A0ABC0'}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => handleSearchChange('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[styles.useGpsBtn, { backgroundColor: '#E8FDF5', borderColor: '#A7F3D0' }]}
                  onPress={handleUseCurrentLocation}
                  activeOpacity={0.8}
                >
                  <Ionicons name="locate" size={16} color="#059669" />
                  <Text style={styles.useGpsText}>Use Current Location</Text>
                </TouchableOpacity>

                <View style={styles.hintBadge}>
                  <Text style={styles.hintText}>Tap or drag pin anywhere</Text>
                </View>
              </View>

              {/* Autocomplete Search Dropdown */}
              {showSearchResults && (
                <View style={[styles.searchDropdown, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
                  {isSearching ? (
                    <View style={{ padding: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, fontWeight: '600' }}>
                        Searching locations in India...
                      </Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                      {searchResults.map((item, idx) => (
                        <TouchableOpacity
                          key={`${item.name}-${idx}`}
                          style={[styles.dropdownItem, { borderBottomColor: colors.cardBorder || '#F6DFE6' }]}
                          onPress={() => handleSelectSearchResult(item)}
                        >
                          <Ionicons name="pin" size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.dropdownTitle, { color: colors.text }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.dropdownSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.displayName || `${item.lat?.toFixed(4)}, ${item.lng?.toFixed(4)}`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : searchQuery.trim().length >= 2 ? (
                    <View style={{ padding: 16, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>No matching locations found</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        Try searching by city, district, or landmark name
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* Interactive Leaflet Map Picker View */}
            <View style={styles.mapContainer}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: pickerHtml }}
                onMessage={handleWebViewMessage}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />

              {/* Map Zoom Controls Overlay */}
              <View style={styles.mapControlsOverlay}>
                <TouchableOpacity
                  style={styles.mapControlBtn}
                  onPress={() => webViewRef.current?.injectJavaScript('window.zoomIn && window.zoomIn(); true;')}
                >
                  <Ionicons name="add" size={20} color="#192E2A" />
                </TouchableOpacity>
                <View style={styles.mapControlDivider} />
                <TouchableOpacity
                  style={styles.mapControlBtn}
                  onPress={() => webViewRef.current?.injectJavaScript('window.zoomOut && window.zoomOut(); true;')}
                >
                  <Ionicons name="remove" size={20} color="#192E2A" />
                </TouchableOpacity>
              </View>

              {/* 5 km Radius Tag */}
              <View style={styles.radiusPill}>
                <Ionicons name="radio" size={13} color="#FF5E7E" />
                <Text style={styles.radiusPillText}>5.0 km Perimeter</Text>
              </View>
            </View>

            {/* Bottom Coordinate & Address Card */}
            <View style={[styles.bottomCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderTopColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
              <View style={styles.locationHeader}>
                <View style={styles.pinCircle}>
                  <Ionicons name="location" size={22} color="#FF5E7E" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.locationName, { color: colors.text }]} numberOfLines={1}>
                      {resolvedAddress}
                    </Text>
                    {isReverseGeocoding && <ActivityIndicator size="small" color="#FF5E7E" />}
                  </View>
                  <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                    Lat: {selectedCoords.lat.toFixed(5)}° • Lng: {selectedCoords.lng.toFixed(5)}°
                  </Text>
                </View>
                {distKm != null && (
                  <View style={styles.distPill}>
                    <Text style={styles.distPillText}>{distKm} km away</Text>
                  </View>
                )}
              </View>

              {/* Set Safe Zone CTA */}
              <TouchableOpacity
                style={[styles.primaryCTA, SHADOWS.glowCoral]}
                onPress={() => setIsPreviewMode(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryCTAText}>Review & Set 5 km Safe Travel Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ========================================================
             STAGE 2: CONFIRMATION & GUARDIAN SETUP
             ======================================================== */
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Location Summary Card */}
            <View style={[styles.previewCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
              <View style={styles.previewHeader}>
                <View style={styles.pinCircle}>
                  <Ionicons name="shield-checkmark" size={24} color="#06D6A0" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    5.0 km Safe Travel Zone
                  </Text>
                  <Text style={[styles.previewCoords, { color: colors.textSecondary }]}>
                    Center: {selectedCoords.lat.toFixed(5)}°, {selectedCoords.lng.toFixed(5)}°
                  </Text>
                </View>
              </View>

              {/* Custom Destination Name / Tag Input */}
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ZONE LABEL / DESTINATION NAME</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.cardBorder || '#F6DFE6', backgroundColor: '#FFFFFF' }]}
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholder={resolvedAddress}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              {/* Safety Parameters Overview */}
              <View style={styles.safetyGrid}>
                <View style={styles.safetyItem}>
                  <Ionicons name="radio-outline" size={18} color="#FF5E7E" />
                  <Text style={styles.safetyValue}>5.0 km</Text>
                  <Text style={styles.safetyLabel}>Perimeter Radius</Text>
                </View>

                <View style={styles.safetyItem}>
                  <Ionicons name="timer-outline" size={18} color="#FF9F1C" />
                  <Text style={styles.safetyValue}>10s Grace</Text>
                  <Text style={styles.safetyLabel}>Warning Window</Text>
                </View>

                <View style={styles.safetyItem}>
                  <Ionicons name="shield-outline" size={18} color="#06D6A0" />
                  <Text style={styles.safetyValue}>Cloud-Escalated</Text>
                  <Text style={styles.safetyLabel}>Background Watch</Text>
                </View>
              </View>
            </View>

            {/* Guardian Phone Setup */}
            <View style={[styles.guardianCard, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
              <Text style={[styles.guardianLabel, { color: colors.textSecondary }]}>
                EMERGENCY GUARDIAN PHONE (AUTOMATED SMS ALERT)
              </Text>
              <TextInput
                style={[styles.guardianInput, { color: colors.text }]}
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
              />
            </View>

            {/* Activate CTA */}
            <TouchableOpacity
              style={[styles.primaryCTA, SHADOWS.glowCoral, isActivating && { opacity: 0.7 }]}
              onPress={handleConfirmActivation}
              disabled={isActivating}
              activeOpacity={0.85}
            >
              {isActivating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryCTAText}>Activate 5 km Safe Travel Zone</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backToMapBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              onPress={() => setIsPreviewMode(false)}
            >
              <Text style={[styles.backToMapText, { color: colors.textSecondary }]}>Modify Selected Location</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFB3C6',
  },
  errorText: {
    color: '#D90429',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  useGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    gap: 6,
  },
  useGpsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  hintBadge: {
    paddingHorizontal: 8,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  searchDropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownSub: {
    fontSize: 11,
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  mapControlsOverlay: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapControlBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapControlDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  radiusPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#FFD1DC',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF5E7E',
  },
  bottomCard: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  pinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationName: {
    fontSize: 15,
    fontWeight: '800',
  },
  coordsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginTop: 2,
  },
  distPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  distPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  primaryCTA: {
    backgroundColor: '#FF5E7E',
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  previewCard: {
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  previewCoords: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  safetyGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1E1E6',
  },
  safetyItem: {
    alignItems: 'center',
  },
  safetyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#192E2A',
    marginTop: 4,
  },
  safetyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  guardianCard: {
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  guardianLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  guardianInput: {
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 4,
  },
  backToMapBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  backToMapText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
