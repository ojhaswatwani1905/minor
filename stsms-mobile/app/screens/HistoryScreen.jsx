import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';

export const HistoryScreen = ({ onBack }) => {
  const [historyLogs] = useState([
    {
      id: 'log-101',
      title: 'Rohtang Pass Expedition',
      date: 'July 24, 2026',
      distance: '14.2 km',
      maxAltitude: '3,978 m',
      checkpoints: 3,
      status: 'Completed'
    },
    {
      id: 'log-102',
      title: 'Valley of Flowers River Track',
      date: 'July 18, 2026',
      distance: '18.6 km',
      maxAltitude: '3,600 m',
      checkpoints: 4,
      status: 'Completed'
    },
    {
      id: 'log-103',
      title: 'Solang Nallah Trail Recon',
      date: 'July 10, 2026',
      distance: '8.4 km',
      maxAltitude: '2,480 m',
      checkpoints: 2,
      status: 'Completed'
    }
  ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Expedition Movement History" subtitle="Breadcrumbs, altitude profile & distance logs" onBack={onBack} />

      <View style={styles.list}>
        {historyLogs.map((log) => (
          <View key={log.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{log.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{log.status}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={[styles.statVal, styles.cyanText]}>{log.distance}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>MAX ALTITUDE</Text>
                <Text style={styles.statVal}>{log.maxAltitude}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>CHECKPOINTS</Text>
                <Text style={[styles.statVal, styles.greenText]}>{log.checkpoints} Cleared</Text>
              </View>
            </View>

            <Text style={styles.footerDate}>Completed on {log.date}</Text>
          </View>
        ))}
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
  list: {
    gap: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34d399',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  cyanText: {
    color: '#22d3ee',
  },
  greenText: {
    color: '#34d399',
  },
  footerDate: {
    fontSize: 10,
    color: '#64748b',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 4,
  },
});

