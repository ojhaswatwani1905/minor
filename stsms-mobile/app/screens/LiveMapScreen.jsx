import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { useLocation } from '../hooks/useLocation';

export const LiveMapScreen = ({ onBack }) => {
  const { coords, speedKmH, batteryLevel, networkStatus, lastSync } = useLocation(true);
  const [showHazards, setShowHazards] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Live GPS Satellite Tracking" subtitle="Real-time position, velocity & hazard perimeters" onBack={onBack} />

      {/* Telemetry Status Bar */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryLabel}>SPEED</Text>
          <Text style={[styles.telemetryVal, styles.cyanText]}>{speedKmH} km/h</Text>
        </View>
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryLabel}>BATTERY</Text>
          <Text style={[styles.telemetryVal, styles.greenText]}>{batteryLevel}%</Text>
        </View>
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryLabel}>SATELLITE MESH</Text>
          <Text style={[styles.telemetryVal, styles.cyanText]}>{networkStatus}</Text>
        </View>
      </View>

      {/* Map Card View */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Live Satellite View</Text>
          <TouchableOpacity
            onPress={() => setShowHazards(!showHazards)}
            style={styles.layerBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.layerBtnText}>
              {showHazards ? 'Hide Avalanche Layer' : 'Show Avalanche Layer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mock Map Display */}
        <View style={styles.mapViewport}>
          {showHazards && (
            <View style={styles.hazardOverlay}>
              <Text style={styles.hazardBadge}>⚠️ Rohtang Avalanche Zone</Text>
            </View>
          )}

          <View style={styles.userPin}>
            <View style={styles.pinDot} />
            <Text style={styles.pinName}>{coords.name}</Text>
            <Text style={styles.pinCoords}>
              Lat: {coords.lat.toFixed(4)} • Lng: {coords.lng.toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.mapFooter}>
          <Text style={styles.footerText}>Background Location: Active</Text>
          <Text style={[styles.footerText, styles.cyanText]}>Last Ping: {lastSync}</Text>
        </View>
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
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  telemetryVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  cyanText: {
    color: '#22d3ee',
  },
  greenText: {
    color: '#34d399',
  },
  mapCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  layerBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  layerBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22d3ee',
  },
  mapViewport: {
    height: 240,
    backgroundColor: '#05080e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  hazardOverlay: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardBadge: {
    backgroundColor: '#0f172a',
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  userPin: {
    alignItems: 'center',
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#06b6d4',
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 6,
  },
  pinName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  pinCoords: {
    color: '#22d3ee',
    fontSize: 10,
    marginTop: 2,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});

