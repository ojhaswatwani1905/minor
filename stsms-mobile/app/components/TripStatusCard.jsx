import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const TripStatusCard = ({ activeTrip, onStartTrip, onEndTrip }) => {
  if (!activeTrip) {
    return (
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🧭</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.emptyTitle}>No Active Expedition</Text>
          <Text style={styles.emptySubtitle}>
            Register your trip parameters to activate live satellite GPS safety tracking.
          </Text>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={onStartTrip} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>Start New Expedition →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.activeCard]}>
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SATELLITE MESH ACTIVE</Text>
          </View>
          <Text style={styles.activeTitle}>{activeTrip.destination || 'Rohtang Pass Trek'}</Text>
        </View>
        <View style={styles.pulseDot} />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>EXPECTED RETURN</Text>
          <Text style={styles.detailValue}>{activeTrip.expectedReturnTime || 'Today, 18:00'}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>GUARDIAN CONTACT</Text>
          <Text style={[styles.detailValue, styles.cyanText]}>
            {activeTrip.guardianPhone || '+91 98765 43210'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={onEndTrip} activeOpacity={0.8}>
        <Text style={styles.endBtnText}>Complete Expedition</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 10,
  },
  activeCard: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#091322',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 20,
  },
  textGroup: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22d3ee',
    letterSpacing: 0.5,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 6,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34d399',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  cyanText: {
    color: '#22d3ee',
  },
  endBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  endBtnText: {
    color: '#cbd5e1',
    fontWeight: '800',
    fontSize: 12,
  },
});

