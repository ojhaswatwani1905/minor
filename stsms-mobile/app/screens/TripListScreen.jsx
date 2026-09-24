import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { tripService } from '../services/tripService';

export const TripListScreen = ({ onSelectTrip, onCreateTrip, onBack }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await tripService.getTrips();
      if (res.success) {
        setTrips(res.trips);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="Registered Expeditions"
        subtitle="Active & completed trek logs"
        onBack={onBack}
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={onCreateTrip} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Register Trip</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#06b6d4" size="large" />
          <Text style={styles.loadingText}>Loading Registered Expeditions...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Registered Expeditions</Text>
          <Text style={styles.emptySub}>
            Pre-register your trek route before embarking to activate 24/7 command telemetry.
          </Text>
          <Button title="Register First Expedition →" onPress={onCreateTrip} variant="primary" />
        </View>
      ) : (
        <View style={styles.list}>
          {trips.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => onSelectTrip(t.id)}
              activeOpacity={0.8}
              style={styles.tripCard}
            >
              <View style={styles.tripHeader}>
                <Text style={styles.destinationText}>{t.destination}</Text>
                <View style={[styles.statusBadge, t.status === 'Active' ? styles.activeBadge : styles.completedBadge]}>
                  <Text style={[styles.statusText, t.status === 'Active' ? styles.activeStatusText : styles.completedStatusText]}>
                    {t.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.routeText}>Route: {t.route}</Text>
              <View style={styles.tripFooter}>
                <Text style={styles.footerInfo}>ID: {t.id}</Text>
                <Text style={styles.footerInfo}>Geofence: {t.boundaryRadiusKm || 5} km</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  addBtn: {
    backgroundColor: '#0891b2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#06b6d4',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  tripCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
  },
  completedBadge: {
    backgroundColor: '#1e293b',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeStatusText: {
    color: '#34d399',
  },
  completedStatusText: {
    color: '#94a3b8',
  },
  routeText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 10,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
  },
  footerInfo: {
    fontSize: 10,
    color: '#64748b',
  },
});

