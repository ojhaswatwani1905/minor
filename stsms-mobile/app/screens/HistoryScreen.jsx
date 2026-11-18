import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { tripService } from '../services/tripService';
import { safeZoneService } from '../services/safeZoneService';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const HistoryScreen = ({ onBack, onSelectTrip }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const [tripRes, safeZoneRes] = await Promise.allSettled([
        tripService.getTrips(),
        safeZoneService.getActiveSafeZone(user?.id),
      ]);

      let fetchedTrips = [];
      if (tripRes.status === 'fulfilled' && tripRes.value?.trips) {
        fetchedTrips = tripRes.value.trips;
      }

      // Check if user has an active safe-zone trip
      let activeSafeTrip = null;
      if (safeZoneRes.status === 'fulfilled' && safeZoneRes.value?.success && safeZoneRes.value?.trip) {
        activeSafeTrip = safeZoneRes.value.trip;
      }

      // Format trips
      let allTrips = fetchedTrips.map((t) => {
        const dest = t.destination || t.title || 'Expedition Route';
        const rawDate = t.startDate || t.created_at || t.start_at || t.date || new Date().toISOString();
        const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const status = t.status || (t.current_state === 'sos' ? 'Breached' : 'Active');

        return {
          id: t.id,
          destination: dest,
          date: formattedDate,
          rawDate,
          status,
          safeRadius: t.radiusMeters ? `${(t.radiusMeters / 1000).toFixed(0)} km` : (t.boundaryRadiusKm ? `${t.boundaryRadiusKm} km` : '5 km'),
          imageUrl: t.imageUrl || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&q=80',
          destinationCoords: t.destinationCoords || null,
          isSafeZone: !!t.destinationCoords,
        };
      });

      // If active safe zone exists and not in trips, unshift it to the top
      if (activeSafeTrip) {
        const exists = allTrips.some((t) => t.id === activeSafeTrip.id);
        if (!exists) {
          const rawDate = activeSafeTrip.startDate || new Date().toISOString();
          allTrips.unshift({
            id: activeSafeTrip.id,
            destination: activeSafeTrip.destination || activeSafeTrip.destinationName || 'Safe Travel Zone',
            date: new Date(rawDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            rawDate,
            status: activeSafeTrip.status || 'Active',
            safeRadius: activeSafeTrip.radiusMeters ? `${(activeSafeTrip.radiusMeters / 1000).toFixed(0)} km` : '5 km',
            imageUrl: activeSafeTrip.imageUrl || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&q=80',
            destinationCoords: activeSafeTrip.destinationCoords || null,
            isSafeZone: true,
          });
        }
      }

      setTrips(allTrips);
    } catch (e) {
      console.log('Error fetching trips:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const isActiveStatus = (status) => {
    const s = (status || '').toUpperCase();
    return s === 'ACTIVE' || s === 'APPROACHING' || s === 'WARNING' || s === 'BREACHED' || s === 'PAUSED';
  };

  const isCompletedStatus = (status) => {
    const s = (status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'RESOLVED' || s === 'ENDED';
  };

  const filteredLogs = trips.filter((trip) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Active') return isActiveStatus(trip.status);
    if (selectedFilter === 'Completed') return isCompletedStatus(trip.status);
    return true;
  });

  const getStatusBadgeStyle = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'RESOLVED') {
      return {
        bg: '#F1F5F9',
        border: '#E2E8F0',
        text: '#475569',
        icon: null,
      };
    }
    if (s === 'BREACHED') {
      return {
        bg: '#FFE5EC',
        border: '#FFB6C1',
        text: '#FF3B69',
        icon: 'warning',
      };
    }
    if (s === 'WARNING') {
      return {
        bg: '#FFF8EB',
        border: '#FDE68A',
        text: '#D97706',
        icon: 'alert-circle',
      };
    }
    if (s === 'APPROACHING') {
      return {
        bg: '#EBF8FF',
        border: '#BAE6FD',
        text: '#0284C7',
        icon: 'navigate',
      };
    }
    // Default Active
    return {
      bg: '#E8FDF5',
      border: '#B2F5EA',
      text: '#06D6A0',
      icon: 'shield-checkmark',
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header title="Trip History" subtitle="Expeditions & Safe Zones" onBack={onBack} />
      </View>

      {/* Filter Tabs (All, Active, Completed matching Reference Screen 10) */}
      <View style={styles.filterTabsRow}>
        {['All', 'Active', 'Completed'].map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                isActive
                  ? [styles.filterTabActive, SHADOWS.glowCoral]
                  : [styles.filterTabInactive, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }],
              ]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive ? styles.filterTabTextActive : { color: colors.textSecondary },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Trip Cards List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5E7E']} />}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#FF5E7E" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading trip logs...</Text>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }]}>
            <Ionicons name="map-outline" size={48} color="#FF9F1C" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Trips Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {selectedFilter === 'Active'
                ? 'You do not have any active expeditions right now.'
                : 'No historical journeys recorded in this category.'}
            </Text>
          </View>
        ) : (
          filteredLogs.map((item) => {
            const badge = getStatusBadgeStyle(item.status);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.tripItemCard,
                  { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
                  SHADOWS.card,
                ]}
                onPress={() => onSelectTrip && onSelectTrip(item)}
                activeOpacity={0.85}
              >
                {/* Heritage Photo */}
                <Image source={{ uri: item.imageUrl }} style={styles.tripThumb} />

                {/* Destination and Date */}
                <View style={styles.tripDetails}>
                  <Text style={[styles.destinationTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.destination}
                  </Text>
                  <Text style={[styles.tripDate, { color: colors.textSecondary }]}>
                    {item.date} • {item.safeRadius} Radius
                  </Text>
                </View>

                {/* Status Pill Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: badge.bg, borderColor: badge.border },
                  ]}
                >
                  {badge.icon && (
                    <Ionicons name={badge.icon} size={11} color={badge.text} style={{ marginRight: 3 }} />
                  )}
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                    {item.status}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color={badge.text} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FF5E7E',
  },
  filterTabInactive: {
    borderWidth: 1.5,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
  },
  tripItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
  },
  tripThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  tripDetails: {
    flex: 1,
    marginLeft: 14,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: '#E8FDF5',
    borderColor: '#B2F5EA',
  },
  completedText: {
    color: '#06D6A0',
    fontSize: 11,
    fontWeight: '800',
  },
  breachedBadge: {
    backgroundColor: '#FFF8EB',
    borderColor: '#FFE3B8',
  },
  breachedText: {
    color: '#E07A00',
    fontSize: 11,
    fontWeight: '800',
  },
  activeBadge: {
    backgroundColor: '#FFE8EE',
    borderColor: '#FFD1DC',
  },
  activeText: {
    color: '#FF5E7E',
    fontSize: 11,
    fontWeight: '800',
  },
});
