import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

export const SafetyMonitoringScreen = ({
  inactivityMinutes = 0,
  geofenceViolated = false,
  isOffline = false,
  fallDetected = false,
  onSimulateFall,
  onSimulateGeofence,
  onToggleOffline,
  onBack
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Background Safety Sensors" subtitle="Inactivity, fall detection & geofence perimeter" onBack={onBack} />

      {/* Sensor Dashboard Cards */}
      <View style={styles.grid}>
        <View style={styles.sensorCard}>
          <Text style={styles.sensorLabel}>INACTIVITY TIMER</Text>
          <Text style={[styles.sensorVal, styles.cyanText]}>{inactivityMinutes} mins</Text>
          <Text style={styles.sensorSub}>Auto "Are You Okay?" at 15m</Text>
        </View>

        <View style={styles.sensorCard}>
          <Text style={styles.sensorLabel}>GEOFENCE STATUS</Text>
          <Text style={[styles.sensorVal, geofenceViolated ? styles.redText : styles.greenText]}>
            {geofenceViolated ? '⚠️ Boundary Crossed' : '✓ Inside 5km Radius'}
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <Text style={styles.sensorLabel}>NETWORK MODE</Text>
          <Text style={[styles.sensorVal, isOffline ? styles.amberText : styles.greenText]}>
            {isOffline ? '📡 Offline Queue' : '⚡ 5G Mesh Online'}
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <Text style={styles.sensorLabel}>G-SHOCK SENSOR</Text>
          <Text style={[styles.sensorVal, fallDetected ? styles.redText : styles.grayText]}>
            {fallDetected ? '🚨 Fall Impact' : '✓ Normal Motion'}
          </Text>
        </View>
      </View>

      {/* Simulator Test Controls */}
      <View style={styles.simCard}>
        <Text style={styles.simTitle}>SENSOR SIMULATOR CONTROLS</Text>
        
        <View style={styles.simBtns}>
          <Button
            title="Simulate G-Shock Fall Detection Impact"
            onPress={onSimulateFall}
            variant="danger"
          />

          <Button
            title="Simulate 5km Geofence Boundary Breach"
            onPress={onSimulateGeofence}
            variant="secondary"
          />

          <Button
            title={isOffline ? "Switch to Online 5G Satellite Mode" : "Simulate Offline Mode (Queue Alerts)"}
            onPress={onToggleOffline}
            variant="outline"
          />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sensorLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  sensorVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  sensorSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  cyanText: {
    color: '#22d3ee',
  },
  greenText: {
    color: '#34d399',
  },
  redText: {
    color: '#f87171',
  },
  amberText: {
    color: '#fbbf24',
  },
  grayText: {
    color: '#94a3b8',
  },
  simCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  simTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22d3ee',
    marginBottom: 12,
  },
  simBtns: {
    gap: 8,
  },
});

