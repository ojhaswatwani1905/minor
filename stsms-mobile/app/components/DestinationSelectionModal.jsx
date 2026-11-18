import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeZoneService } from '../services/safeZoneService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

// Popular heritage destinations with imagery
const POPULAR_DESTINATIONS = [
  {
    name: 'Sanchi Stupa',
    displayName: 'Sanchi Buddhist Monument Complex, Raisen, MP',
    lat: 23.4867,
    lng: 77.7385,
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&q=80',
    type: 'UNESCO Heritage',
  },
  {
    name: 'Bhojpur Temple',
    displayName: 'Bhojeshwar Mahadev Temple, Bhopal Corridor, MP',
    lat: 23.1008,
    lng: 77.5855,
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80',
    type: 'Historic Monument',
  },
  {
    name: 'Udaygiri Caves',
    displayName: 'Udaygiri Rock Cut Sanctuaries, Vidisha, MP',
    lat: 23.5350,
    lng: 77.7797,
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=400&q=80',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(POPULAR_DESTINATIONS);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [guardianPhone, setGuardianPhone] = useState(userGuardianPhone);
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Load search results or suggestions
  useEffect(() => {
    if (visible && !selectedDestination) {
      loadSuggestions('');
    }
  }, [visible]);

  const loadSuggestions = async (q) => {
    setIsSearching(true);
    setErrorMessage('');
    try {
      const res = await safeZoneService.geocode(q);
      if (res.success && Array.isArray(res.results) && res.results.length > 0) {
        setSearchResults(res.results);
      } else {
        setSearchResults(POPULAR_DESTINATIONS);
      }
    } catch (e) {
      setSearchResults(POPULAR_DESTINATIONS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      loadSuggestions(trimmed);
    } else if (trimmed.length === 0) {
      setSearchResults(POPULAR_DESTINATIONS);
    }
  };

  const handleSelectDestination = (item) => {
    setSelectedDestination(item);
    setErrorMessage('');
  };

  const calculateDistanceToDest = () => {
    if (!selectedDestination || !currentCoords?.lat || !currentCoords?.lng) {
      return 2300; // Default simulated 2.3km for preview if coords pending
    }
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(selectedDestination.lat - currentCoords.lat);
    const dLon = toRad(selectedDestination.lng - currentCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(currentCoords.lat)) *
        Math.cos(toRad(selectedDestination.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceMeters = calculateDistanceToDest();
  const distKm = (distanceMeters / 1000).toFixed(1);

  const handleConfirmActivation = async () => {
    if (!selectedDestination) return;
    setIsActivating(true);
    setErrorMessage('');

    try {
      const payload = {
        destinationName: selectedDestination.name,
        destinationLat: selectedDestination.lat,
        destinationLng: selectedDestination.lng,
        radiusMeters: 5000,
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
    setSelectedDestination(null);
    setIsPreviewMode(false);
    setSearchQuery('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background || '#FFF0F5' }]}>
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: colors.cardBorder || '#F6DFE6' }]}>
          <TouchableOpacity
            onPress={isPreviewMode ? () => setIsPreviewMode(false) : handleClose}
            style={[styles.backBtn, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isPreviewMode ? 'Safe Zone Preview' : 'Select Destination'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!isPreviewMode ? (
            /* ========================================================
               STAGE 1: SELECT DESTINATION (Matching Reference Screen 4)
               ======================================================== */
            <View>
              {/* Search Bar */}
              <View style={[styles.searchBar, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}>
                <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search destination (e.g. Sanchi, Bhojpur)"
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

              {/* Popular Destinations Grid / Horizontal scroll */}
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Popular Destinations</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularRow}>
                {POPULAR_DESTINATIONS.map((dest) => {
                  const isSelected = selectedDestination?.name === dest.name;
                  return (
                    <TouchableOpacity
                      key={dest.name}
                      style={[
                        styles.popularCard,
                        { backgroundColor: colors.card || '#FFFFFF', borderColor: isSelected ? colors.primary : colors.cardBorder || '#F6DFE6' },
                        isSelected && { borderWidth: 2 },
                        SHADOWS.card,
                      ]}
                      onPress={() => handleSelectDestination(dest)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: dest.imageUrl }} style={styles.popularImage} />
                      <View style={styles.popularInfo}>
                        <Text style={[styles.popularName, { color: colors.text }]} numberOfLines={1}>
                          {dest.name}
                        </Text>
                        <Text style={[styles.popularType, { color: colors.textSecondary }]}>
                          {dest.type}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected Location Card */}
              {selectedDestination && (
                <View style={styles.selectedSection}>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Selected Location</Text>
                  <View style={[styles.selectedCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
                    <View style={styles.selectedPinBadge}>
                      <Ionicons name="location" size={24} color="#FF5E7E" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.selectedDestName, { color: colors.text }]}>{selectedDestination.name}</Text>
                      <Text style={[styles.selectedDestCoords, { color: colors.textSecondary }]}>
                        Lat: {selectedDestination.lat?.toFixed(4)}, Lng: {selectedDestination.lng?.toFixed(4)}
                      </Text>
                    </View>
                  </View>

                  {/* Safe Zone Radius Card */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 14 }]}>Safe Zone Radius</Text>
                  <View style={[styles.radiusCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }]}>
                    <View style={styles.radiusLeft}>
                      <Ionicons name="radio-button-on" size={20} color={colors.primary} />
                      <Text style={[styles.radiusText, { color: colors.text }]}>5 km (Recommended)</Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                  </View>

                  {/* Guardian Phone Setup */}
                  <View style={[styles.guardianCard, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }]}>
                    <Text style={[styles.guardianLabel, { color: colors.textSecondary }]}>
                      GUARDIAN PHONE FOR AUTOMATIC SMS ALERTS
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

                  {/* Create Safe Zone CTA */}
                  <TouchableOpacity
                    style={[styles.primaryCTA, SHADOWS.glowCoral]}
                    onPress={() => setIsPreviewMode(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryCTAText}>Create Safe Zone</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* All Search Results List */}
              {!selectedDestination && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>All Destinations</Text>
                  {searchResults.map((item, idx) => (
                    <TouchableOpacity
                      key={`${item.name}-${idx}`}
                      style={[styles.resultCard, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.soft]}
                      onPress={() => handleSelectDestination(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.resultPin}>
                        <Ionicons name="pin" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.resultName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.displayName || 'India Safe Corridor'}
                        </Text>
                        <Text style={[styles.resultCoords, { color: colors.textMuted }]}>
                          Lat: {item.lat?.toFixed(4)} • Lng: {item.lng?.toFixed(4)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* ========================================================
               STAGE 2: SAFE ZONE PREVIEW (Matching Reference Screen 5)
               ======================================================== */
            <View>
              {/* Map Preview Canvas */}
              <View style={[styles.mapCanvasContainer, SHADOWS.card]}>
                {/* Background topographic map rendering representation */}
                <View style={styles.mapCanvas}>
                  {/* Circular Safe Zone Radius 5km */}
                  <View style={[styles.geofenceCircle5km, { transform: [{ scale: zoomLevel }] }]}>
                    <View style={styles.radiusPillBadge}>
                      <Text style={styles.radiusPillText}>Radius: 5 km</Text>
                    </View>
                    {/* Destination Center Pin */}
                    <View style={styles.centerPinMarker}>
                      <Ionicons name="location" size={32} color="#FF5E7E" />
                      <Text style={styles.centerPinLabel}>{selectedDestination.name}</Text>
                    </View>

                    {/* Tourist Live Marker */}
                    <View style={styles.touristPreviewMarker}>
                      <View style={styles.touristDotPulse} />
                      <Text style={styles.touristPreviewLabel}>You ({distKm} km)</Text>
                    </View>
                  </View>

                  {/* Zoom Controls */}
                  <View style={styles.zoomControls}>
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
                    >
                      <Text style={styles.zoomBtnText}>+</Text>
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity
                      style={styles.zoomBtn}
                      onPress={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                    >
                      <Text style={styles.zoomBtnText}>-</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Center Crosshair Button */}
                  <TouchableOpacity
                    style={styles.crosshairBtn}
                    onPress={() => setZoomLevel(1)}
                  >
                    <Ionicons name="locate" size={20} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Destination Summary Card */}
              <View style={[styles.previewBottomCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
                <View style={styles.previewBottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.previewBottomName, { color: colors.text }]}>{selectedDestination.name}</Text>
                    <Text style={[styles.previewBottomCoords, { color: colors.textSecondary }]}>
                      {selectedDestination.lat?.toFixed(4)}, {selectedDestination.lng?.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.safeZoneMintBadge}>
                    <Text style={styles.safeZoneMintBadgeText}>Safe Zone: 5 km</Text>
                  </View>
                </View>

                {/* Explanation */}
                <View style={styles.previewInfoBox}>
                  <Ionicons name="shield-checkmark" size={16} color="#06D6A0" style={{ marginRight: 6 }} />
                  <Text style={styles.previewInfoText}>
                    Automatic boundary protection begins when you enter the 5 km perimeter.
                  </Text>
                </View>

                {/* Activate Safe Zone Button */}
                <TouchableOpacity
                  style={[styles.primaryCTA, SHADOWS.glowCoral]}
                  onPress={handleConfirmActivation}
                  disabled={isActivating}
                  activeOpacity={0.85}
                >
                  {isActivating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryCTAText}>Activate Safe Zone</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEF',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD1DC',
  },
  errorText: {
    color: '#FF3B69',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  popularRow: {
    marginBottom: 20,
  },
  popularCard: {
    width: 145,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginRight: 12,
  },
  popularImage: {
    width: '100%',
    height: 95,
  },
  popularInfo: {
    padding: 10,
  },
  popularName: {
    fontSize: 13,
    fontWeight: '800',
  },
  popularType: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedSection: {
    marginTop: 8,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  selectedPinBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDestName: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDestCoords: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  radiusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  radiusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  guardianCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 20,
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
  primaryCTA: {
    backgroundColor: '#FF5E7E',
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  resultPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  resultCoords: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // Preview Map Styles
  mapCanvasContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 340,
    backgroundColor: '#E8F5E9',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#F6DFE6',
    marginBottom: 16,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#F3FBF5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  geofenceCircle5km: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 94, 126, 0.18)',
    borderWidth: 2,
    borderColor: '#FF5E7E',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radiusPillBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#FFD1DC',
  },
  radiusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5E7E',
  },
  centerPinMarker: {
    alignItems: 'center',
  },
  centerPinLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  touristPreviewMarker: {
    position: 'absolute',
    bottom: 30,
    left: 45,
    alignItems: 'center',
  },
  touristDotPulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#32ADE6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  touristPreviewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  zoomControls: {
    position: 'absolute',
    right: 14,
    top: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  crosshairBtn: {
    position: 'absolute',
    right: 14,
    bottom: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewBottomCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
  },
  previewBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  previewBottomName: {
    fontSize: 18,
    fontWeight: '800',
  },
  previewBottomCoords: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  safeZoneMintBadge: {
    backgroundColor: '#E8FDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  safeZoneMintBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06D6A0',
  },
  previewInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#F6DFE6',
    marginBottom: 16,
  },
  previewInfoText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
  },
});
