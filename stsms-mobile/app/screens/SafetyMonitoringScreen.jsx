import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const SafetyMonitoringScreen = ({
  inactivityMinutes = 0,
  geofenceViolated = false,
  isOffline = false,
  fallDetected = false,
  destinationName = 'Safe Travel Zone',
  distanceKm = '0.0',
  batteryLevel = 100,
  accuracyMeters = 6,
  onSimulateFall,
  onSimulateGeofence,
  onToggleOffline,
  onPauseMonitoring,
  onEndTrip,
  onBack,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header title="Trip Monitoring" onBack={onBack} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================
            HERO STATUS BANNER (Deep Emerald Mint Card - Screen 7)
            ======================================================== */}
        <View style={[styles.emeraldHeroCard, SHADOWS.card]}>
          <View style={styles.emeraldLeft}>
            <View style={styles.emeraldPinCircle}>
              <Ionicons name="location" size={24} color="#06D6A0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.emeraldHeading}>Inside Safe Zone</Text>
              <Text style={styles.emeraldSub}>You are within 5 km of {destinationName}</Text>
            </View>
          </View>
          <View style={styles.emeraldCheck}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* ========================================================
            TRIP PROGRESS CARD
            ======================================================== */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          <View style={styles.progressTopRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Trip Progress</Text>
            <Text style={[styles.percentText, { color: colors.primary }]}>46%</Text>
          </View>
          <Text style={[styles.distanceLabel, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{distanceKm} km</Text> from destination
          </Text>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary }]} />
          </View>

          {/* 3 Telemetry Indicators */}
          <View style={styles.telemetryRow}>
            <View style={[styles.telemetryCard, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="battery-charging" size={18} color="#06D6A0" />
              <Text style={styles.telemetryValue}>{batteryLevel}%</Text>
              <Text style={styles.telemetryLabel}>Battery</Text>
            </View>

            <View style={[styles.telemetryCard, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="navigate-circle" size={18} color="#FF9F1C" />
              <Text style={styles.telemetryValue}>±{accuracyMeters} m</Text>
              <Text style={styles.telemetryLabel}>Accuracy</Text>
            </View>

            <View style={[styles.telemetryCard, { borderColor: colors.cardBorder || '#F6DFE6' }]}>
              <Ionicons name="radio" size={18} color="#06D6A0" />
              <Text style={styles.telemetryValue}>Active</Text>
              <Text style={styles.telemetryLabel}>Monitoring</Text>
            </View>
          </View>

          {/* Action Buttons: Pause & End Trip */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.pauseBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              onPress={onPauseMonitoring}
              activeOpacity={0.8}
            >
              <Ionicons name="pause-circle-outline" size={18} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.pauseBtnText, { color: colors.text }]}>Pause Monitoring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.endTripBtn, SHADOWS.glowCoral]}
              onPress={onEndTrip}
              activeOpacity={0.85}
            >
              <Text style={styles.endTripBtnText}>End Trip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            BACKGROUND SENSORS & SAFETY SHIELD DIAGNOSTICS
            ======================================================== */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Safety Sensors Diagnostics</Text>
        <View style={styles.sensorsGrid}>
          <View
            style={[
              styles.sensorBox,
              { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
              SHADOWS.soft,
            ]}
          >
            <Ionicons name="timer-outline" size={20} color={colors.primary} />
            <Text style={[styles.sensorName, { color: colors.textSecondary }]}>INACTIVITY</Text>
            <Text style={[styles.sensorVal, { color: colors.text }]}>{inactivityMinutes} mins</Text>
            <Text style={styles.sensorSub}>Check-in at 15m</Text>
          </View>

          <View
            style={[
              styles.sensorBox,
              { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
              SHADOWS.soft,
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#06D6A0" />
            <Text style={[styles.sensorName, { color: colors.textSecondary }]}>GEOFENCE</Text>
            <Text style={[styles.sensorVal, { color: geofenceViolated ? '#FF3B69' : '#06D6A0' }]}>
              {geofenceViolated ? 'Breached' : 'Inside 5 km'}
            </Text>
            <Text style={styles.sensorSub}>False-alarm filter on</Text>
          </View>

          <View
            style={[
              styles.sensorBox,
              { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
              SHADOWS.soft,
            ]}
          >
            <Ionicons name="wifi-outline" size={20} color="#32ADE6" />
            <Text style={[styles.sensorName, { color: colors.textSecondary }]}>NETWORK</Text>
            <Text style={[styles.sensorVal, { color: isOffline ? '#FF9F1C' : '#06D6A0' }]}>
              {isOffline ? 'Offline' : 'Online'}
            </Text>
            <Text style={styles.sensorSub}>Local sync active</Text>
          </View>

          <View
            style={[
              styles.sensorBox,
              { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
              SHADOWS.soft,
            ]}
          >
            <Ionicons name="fitness-outline" size={20} color="#845EC2" />
            <Text style={[styles.sensorName, { color: colors.textSecondary }]}>G-SHOCK</Text>
            <Text style={[styles.sensorVal, { color: fallDetected ? '#FF3B69' : colors.text }]}>
              {fallDetected ? 'Impact' : 'Normal'}
            </Text>
            <Text style={styles.sensorSub}>Accelerometer</Text>
          </View>
        </View>

        {/* Simulator Diagnostic Controls */}
        <View
          style={[
            styles.simCard,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          <Text style={[styles.simTitle, { color: colors.text }]}>Simulator Testing Actions</Text>
          <View style={styles.simBtnCol}>
            <Button
              title="Simulate 5km Geofence Breach"
              onPress={onSimulateGeofence}
              variant="warning"
              size="sm"
            />
            <Button
              title="Simulate G-Shock Fall Impact"
              onPress={onSimulateFall}
              variant="danger"
              size="sm"
            />
            <Button
              title={isOffline ? 'Switch to Online Mode' : 'Simulate Offline Buffer Mode'}
              onPress={onToggleOffline}
              variant="outline"
              size="sm"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emeraldHeroCard: {
    backgroundColor: '#0B6E4F',
    borderRadius: RADIUS.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  emeraldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emeraldPinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emeraldHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emeraldSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emeraldCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#06D6A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  distanceLabel: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3DFE5',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    width: '46%',
    height: '100%',
    borderRadius: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  pauseBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  endTripBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FF5E7E',
  },
  endTripBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sensorBox: {
    width: '48%',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
  },
  sensorName: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  sensorVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sensorSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  simCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
  },
  simTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  simBtnCol: {
    gap: 4,
  },
});
