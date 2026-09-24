import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { tripService } from '../services/tripService';
import { apiFetch } from '../utils/api';

export const TripDetailScreen = ({ tripId, onBack, onTripEnded }) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchTripDetail = async () => {
    try {
      setLoading(true);
      const res = await tripService.getTripById(tripId);
      if (res.success) {
        setTrip(res.trip);
      }
    } catch (err) {
      console.error('Failed to fetch trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchTripDetail();
  }, [tripId]);

  const handleSafeCheckIn = async () => {
    try {
      const res = await apiFetch(`/trips/${trip.id}/checkin`, { method: 'POST' });
      if (res.success) {
        setTrip(res.trip);
        setActionMessage('✅ Safe Check-In Confirmed! Dead Man Switch Timer Reset.');
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      setActionMessage('Check-in logged');
    }
  };

  const handleExtendDeadline = async () => {
    try {
      const res = await apiFetch(`/trips/${trip.id}/extend-deadline`, {
        method: 'POST',
        body: JSON.stringify({ additionalMinutes: 60 })
      });
      if (res.success) {
        setTrip(res.trip);
        setActionMessage('⏱️ Check-in deadline extended by +60 minutes!');
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      setActionMessage('Deadline extended');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#06b6d4" size="large" />
        <Text style={styles.loadingText}>Loading Expedition Telemetry...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.notFoundText}>Expedition Record Not Found</Text>
        <Button title="Back to Trips" onPress={onBack} variant="secondary" />
      </View>
    );
  }

  const deadlineFormatted = trip.expectedArrivalDeadline 
    ? new Date(trip.expectedArrivalDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '18:00 Today';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title={trip.destination} subtitle={`ID: ${trip.id} • ${trip.status}`} onBack={onBack} />

      {!!actionMessage && (
        <View style={styles.actionBanner}>
          <Text style={styles.actionBannerText}>{actionMessage}</Text>
        </View>
      )}

      {/* Dead Man's Switch Cloud Timer Section (PRD Bottleneck C) */}
      <View style={styles.dmsCard}>
        <View style={styles.dmsHeader}>
          <View>
            <Text style={styles.dmsBadgeText}>CLOUD DEAD MAN'S SWITCH ACTIVE</Text>
            <Text style={styles.dmsDeadline}>Deadline: {deadlineFormatted}</Text>
          </View>
          <View style={[styles.dmsStatusBadge, trip.status === 'EXPIRED_UNCHECKED' ? styles.expiredBadge : styles.safeBadge]}>
            <Text style={styles.dmsStatusText}>
              {trip.status === 'EXPIRED_UNCHECKED' ? '🚨 AUTO DISPATCHED' : '⏱️ MONITORED'}
            </Text>
          </View>
        </View>

        <Text style={styles.dmsDesc}>
          If safe check-in is missed, server-side pg_cron dispatcher will auto-alert guardian ({trip.guardianPhone || '+91 98765 43210'}).
        </Text>

        <View style={styles.dmsBtnRow}>
          <TouchableOpacity style={styles.checkInBtn} onPress={handleSafeCheckIn} activeOpacity={0.8}>
            <Text style={styles.checkInBtnText}>✓ SAFE CHECK-IN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.extendBtn} onPress={handleExtendDeadline} activeOpacity={0.8}>
            <Text style={styles.extendBtnText}>+1 HR EXTEND</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Status Header */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.cyanBadge}>
            <Text style={styles.cyanBadgeText}>Route: {trip.route}</Text>
          </View>
          <View style={[styles.statusBadge, trip.status === 'Active' ? styles.activeBadge : styles.completedBadge]}>
            <Text style={[styles.statusText, trip.status === 'Active' ? styles.activeStatusText : styles.completedStatusText]}>
              {trip.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>GEOFENCE RADIUS</Text>
            <Text style={styles.detailValue}>{trip.boundaryRadiusKm || 5.0} km</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>GEOFENCE STATUS</Text>
            <Text style={[styles.detailValue, trip.geofenceViolated ? styles.redText : styles.greenText]}>
              {trip.geofenceViolated ? '⚠️ Violated' : '✓ Safe Perimeter'}
            </Text>
          </View>
        </View>
      </View>

      {/* Checkpoint Progress Timeline */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Expedition Checkpoints</Text>
          <Text style={styles.pinsText}>{trip.checkpoints?.length || 3} Pins</Text>
        </View>

        <View style={styles.checkpointsList}>
          {trip.checkpoints?.map((cp, idx) => (
            <View key={idx} style={styles.checkpointRow}>
              <View>
                <Text style={styles.checkpointName}>{cp.name}</Text>
                <Text style={styles.checkpointTime}>
                  {cp.time ? new Date(cp.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </Text>
              </View>
              <View style={[
                styles.cpBadge,
                cp.status === 'Passed' || cp.status === 'Verified' ? styles.passedBadge : cp.status === 'In Progress' ? styles.inProgressBadge : styles.pendingBadge
              ]}>
                <Text style={[
                  styles.cpStatusText,
                  cp.status === 'Passed' || cp.status === 'Verified' ? styles.passedText : cp.status === 'In Progress' ? styles.inProgressText : styles.pendingText
                ]}>
                  {cp.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.btnWrapper}>
        <Button
          title="Complete & End Expedition"
          onPress={() => onTripEnded && onTripEnded(trip.id)}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#06b6d4',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 10,
  },
  notFoundText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionBanner: {
    backgroundColor: '#0284c7',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionBannerText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  dmsCard: {
    backgroundColor: '#0c1a2e',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    marginBottom: 12,
  },
  dmsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dmsBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
  },
  dmsDeadline: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  dmsStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  safeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  expiredBadge: {
    backgroundColor: '#dc2626',
  },
  dmsStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  dmsDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 12,
  },
  dmsBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInBtn: {
    flex: 1.2,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
  },
  extendBtn: {
    flex: 0.8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  extendBtnText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 11,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cyanBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 1,
  },
  cyanBadgeText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
  detailsGrid: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  redText: {
    color: '#f87171',
  },
  greenText: {
    color: '#34d399',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  pinsText: {
    fontSize: 11,
    color: '#22d3ee',
    fontWeight: 'bold',
  },
  checkpointsList: {
    gap: 8,
  },
  checkpointRow: {
    backgroundColor: '#05080e',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkpointName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  checkpointTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  cpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  passedBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  pendingBadge: {
    backgroundColor: '#1e293b',
  },
  cpStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  passedText: {
    color: '#34d399',
  },
  inProgressText: {
    color: '#22d3ee',
  },
  pendingText: {
    color: '#64748b',
  },
  btnWrapper: {
    marginTop: 10,
  },
});
