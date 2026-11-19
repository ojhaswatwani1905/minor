import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { getDestinationImageUrl } from '../utils/destinationImages';

export const TripStatusCard = ({
  activeTrip,
  onStartTrip,
  onEndTrip,
  onViewDetails,
}) => {
  const { colors } = useTheme();

  // If there's an active trip / safe zone trip
  if (activeTrip) {
    const destinationName = activeTrip.destination || activeTrip.destinationName || 'Active Expedition';
    const statusText = activeTrip.status || 'Active';
    const radiusText = activeTrip.radiusMeters ? `${(activeTrip.radiusMeters / 1000).toFixed(0)} km` : '5 km';
    const photoUrl =
      activeTrip.imageUrl ||
      getDestinationImageUrl(destinationName);

    return (
      <View style={styles.container}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Trip</Text>
          <TouchableOpacity onPress={onViewDetails} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.tripCard,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
          onPress={onViewDetails}
          activeOpacity={0.85}
        >
          <Image source={{ uri: photoUrl }} style={styles.tripThumb} />
          <View style={styles.tripInfo}>
            <Text style={[styles.destName, { color: colors.text }]} numberOfLines={1}>
              {destinationName}
            </Text>
            <View style={styles.safeZoneRow}>
              <Text style={[styles.safeZoneText, { color: colors.textSecondary }]}>
                Safe Zone: {radiusText}
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{statusText}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Plan New Trip Coral Pill Button */}
        <TouchableOpacity
          style={[styles.planNewTripBtn, SHADOWS.glowCoral]}
          onPress={onStartTrip}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.planNewTripText}>Plan New Trip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // When no trip is active
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Trip</Text>
      <View
        style={[
          styles.emptyTripCard,
          { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
          SHADOWS.card,
        ]}
      >
        <View style={styles.emptyIconBadge}>
          <Ionicons name="compass-outline" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTripTitle, { color: colors.text }]}>No Active Expedition</Text>
        <Text style={[styles.emptyTripSubtitle, { color: colors.textSecondary }]}>
          Activate destination tracking and your 5 km geofence boundary.
        </Text>
        <TouchableOpacity
          style={[styles.planNewTripBtn, SHADOWS.glowCoral]}
          onPress={onStartTrip}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.planNewTripText}>Plan New Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  tripThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 14,
  },
  destName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  safeZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safeZoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#E8FDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06D6A0',
  },
  planNewTripBtn: {
    backgroundColor: '#FF5E7E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
  },
  planNewTripText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTripCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
  },
  emptyIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTripTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyTripSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 14,
  },
});
