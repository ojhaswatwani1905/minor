import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const SafeZoneStatusCard = ({
  safeZone,
  status = 'APPROACHING',
  distanceMeters,
  distanceOutsideMeters = 0,
  currentCoords,
  gpsAccuracy,
  batteryLevel,
  lastFixTime,
  warningActive = false,
  warningCountdown = 30,
  isSyncing = false,
  onOpenSearch,
  onConfirmSafe,
  onPauseMonitoring,
  onResumeMonitoring,
  onEndTrip,
  onTriggerSos,
}) => {
  const { colors } = useTheme();

  // Empty state when no safe zone is set
  if (!safeZone) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
        <View style={styles.emptyIconBadge}>
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Safe Travel Zone</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Select your destination to activate a 5 km automatic geofence boundary with live tourist emergency protection.
        </Text>
        <TouchableOpacity
          style={[styles.emptyActivateBtn, { backgroundColor: colors.primary }, SHADOWS.glowCoral]}
          onPress={onOpenSearch}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.emptyActivateBtnText}>Plan Safe Zone (5 km)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isApproaching = status === 'APPROACHING';
  const isActive = status === 'ACTIVE';
  const isWarning = status === 'WARNING';
  const isBreached = status === 'BREACHED';
  const isPaused = status === 'PAUSED';

  const destinationName = safeZone.destination || safeZone.destinationName || 'Safe Zone Destination';
  const distKm = distanceMeters != null ? (distanceMeters / 1000).toFixed(1) : '--';
  const progressPercent = distanceMeters != null ? Math.min(100, Math.round((distanceMeters / 5000) * 100)) : 0;

  // Render WARNING state (Soft amber card matching reference screen 8)
  if (isWarning) {
    return (
      <View style={[styles.warningContainer, SHADOWS.elevated]}>
        <View style={styles.warningIconCircle}>
          <Ionicons name="warning" size={38} color="#FF9F1C" />
        </View>
        <Text style={styles.warningTitle}>Boundary Warning</Text>
        <Text style={styles.warningSubtitle}>You are moving outside your safe zone.</Text>

        {/* Metrics Row */}
        <View style={styles.warningMetricsRow}>
          <View style={styles.warningMetricCard}>
            <Text style={styles.warningMetricLabel}>Current Distance</Text>
            <Text style={styles.warningMetricValue}>{distKm} km</Text>
          </View>
          <View style={styles.warningMetricCard}>
            <Text style={styles.warningMetricLabel}>Allowed Radius</Text>
            <Text style={styles.warningMetricValue}>5.0 km</Text>
          </View>
        </View>

        {/* Countdown Box */}
        <View style={styles.warningCountdownBox}>
          <Text style={styles.warningCountdownLabel}>Confirming in</Text>
          <View style={styles.warningCountdownRing}>
            <Text style={styles.warningCountdownTimer}>00:{String(warningCountdown).padStart(2, '0')}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.warningSafeBtn, SHADOWS.glowCoral]}
          onPress={onConfirmSafe}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.warningSafeBtnText}>I'm Safe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.warningAssistBtn}
          onPress={onTriggerSos}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
          <Text style={styles.warningAssistBtnText}>Request Assistance</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render BREACHED state (Emergency Coral Red matching reference screen 9)
  if (isBreached) {
    return (
      <View style={[styles.breachedContainer, SHADOWS.glowDanger]}>
        <View style={styles.breachedIconRing}>
          <Ionicons name="megaphone" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.breachedTitle}>Geofence Breach</Text>
        <Text style={styles.breachedBadge}>(Automatic SOS)</Text>
        <Text style={styles.breachedSubtitle}>
          You have left the designated safe zone of {destinationName}.
        </Text>

        <View style={styles.breachedMetricsRow}>
          <View style={styles.breachedMetricCard}>
            <Text style={styles.breachedMetricLabel}>Current Distance</Text>
            <Text style={styles.breachedMetricValue}>{distKm} km</Text>
          </View>
          <View style={styles.breachedMetricCard}>
            <Text style={styles.breachedMetricLabel}>Safe Radius</Text>
            <Text style={styles.breachedMetricValue}>5.0 km</Text>
          </View>
        </View>

        <View style={styles.breachedNoticeBox}>
          <Ionicons name="information-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.breachedNoticeText}>
            An automatic SOS has been sent to the Admin and your Guardian.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.breachedSafeBtn, SHADOWS.soft]}
          onPress={onConfirmSafe}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={20} color="#1E293B" style={{ marginRight: 6 }} />
          <Text style={styles.breachedSafeBtnText}>I'm Safe Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.breachedCallBtn}
          onPress={onTriggerSos}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.breachedCallBtnText}>Call Helpline (112)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render ACTIVE state (Hero Deep Mint Green matching reference screen 7)
  if (isActive) {
    return (
      <View style={styles.activeContainer}>
        {/* Deep Emerald Hero Banner */}
        <View style={[styles.emeraldHeroCard, SHADOWS.card]}>
          <View style={styles.emeraldLeftCol}>
            <View style={styles.emeraldPinCircle}>
              <Ionicons name="location" size={22} color="#06D6A0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.emeraldTitle}>Inside Safe Zone</Text>
              <Text style={styles.emeraldSubtitle} numberOfLines={1}>
                You are within 5 km of {destinationName}
              </Text>
            </View>
          </View>
          <View style={styles.emeraldCheckBadge}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* Trip Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }]}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>Trip Progress</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{progressPercent}%</Text>
          </View>
          <Text style={[styles.progressDistanceText, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{distKm} km</Text> from destination
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>

          {/* Telemetry Row */}
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryPill}>
              <Ionicons name="battery-charging" size={16} color="#06D6A0" />
              <Text style={styles.telemetryValue}>{batteryLevel != null ? `${batteryLevel}%` : '87%'}</Text>
              <Text style={styles.telemetrySub}>Battery</Text>
            </View>
            <View style={styles.telemetryPill}>
              <Ionicons name="navigate-circle" size={16} color="#FF9F1C" />
              <Text style={styles.telemetryValue}>±{gpsAccuracy ? Math.round(gpsAccuracy) : 6} m</Text>
              <Text style={styles.telemetrySub}>Accuracy</Text>
            </View>
            <View style={styles.telemetryPill}>
              <Ionicons name="radio" size={16} color="#06D6A0" />
              <Text style={styles.telemetryValue}>Active</Text>
              <Text style={styles.telemetrySub}>Monitoring</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.pauseBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              onPress={isPaused ? onResumeMonitoring : onPauseMonitoring}
              activeOpacity={0.8}
            >
              <Ionicons name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'} size={18} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.pauseBtnText, { color: colors.text }]}>{isPaused ? 'Resume' : 'Pause Monitoring'}</Text>
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
      </View>
    );
  }

  // Render APPROACHING state (Approaching Safe Zone)
  return (
    <View style={[styles.approachingCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }, SHADOWS.card]}>
      <View style={styles.approachingHeader}>
        <View style={styles.approachingBadge}>
          <View style={styles.approachingDot} />
          <Text style={styles.approachingBadgeText}>APPROACHING SAFE ZONE</Text>
        </View>
        {isSyncing && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <Text style={[styles.approachingTitle, { color: colors.text }]}>{destinationName}</Text>
      <Text style={[styles.approachingSubtitle, { color: colors.textSecondary }]}>
        5.0 km boundary activates automatically when you arrive.
      </Text>

      <View style={styles.approachingDistanceCard}>
        <Ionicons name="navigate" size={20} color={colors.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.approachingDistVal, { color: colors.text }]}>{distKm} km away</Text>
          <Text style={[styles.approachingDistSub, { color: colors.textSecondary }]}>
            GPS active • False-alarm shield enabled
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.pauseBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
          onPress={onOpenSearch}
          activeOpacity={0.8}
        >
          <Text style={[styles.pauseBtnText, { color: colors.text }]}>Change Destination</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.endTripBtn, SHADOWS.glowCoral]}
          onPress={onEndTrip}
          activeOpacity={0.85}
        >
          <Text style={styles.endTripBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Empty State Styles
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyActivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.pill,
  },
  emptyActivateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  // Active State Styles (Hero Emerald)
  activeContainer: {
    marginVertical: 10,
  },
  emeraldHeroCard: {
    backgroundColor: '#0B6E4F',
    borderRadius: RADIUS.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emeraldLeftCol: {
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
  emeraldTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  emeraldSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emeraldCheckBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#06D6A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  progressCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressDistanceText: {
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
    height: '100%',
    borderRadius: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  telemetryPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F6DFE6',
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  telemetrySub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  actionRow: {
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

  // Warning State Styles (Screen 8)
  warningContainer: {
    backgroundColor: '#FFF8EB',
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#FFE3B8',
    alignItems: 'center',
    marginVertical: 10,
  },
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  warningMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE3B8',
  },
  warningMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  warningMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  warningCountdownBox: {
    width: '100%',
    backgroundColor: '#FFE9C7',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  warningCountdownLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  warningCountdownRing: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
  },
  warningCountdownTimer: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E07A00',
  },
  warningSafeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FF5E7E',
    marginBottom: 10,
  },
  warningSafeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  warningAssistBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD1DC',
  },
  warningAssistBtnText: {
    color: '#FF3B69',
    fontSize: 14,
    fontWeight: '700',
  },

  // Breached State Styles (Screen 9)
  breachedContainer: {
    backgroundColor: '#FF3B69',
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: 'center',
    marginVertical: 10,
  },
  breachedIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breachedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  breachedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  breachedSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  breachedMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 14,
  },
  breachedMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
  },
  breachedMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  breachedMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  breachedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
    width: '100%',
  },
  breachedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  breachedSafeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  breachedSafeBtnText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  breachedCallBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E02450',
  },
  breachedCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Approaching State Styles
  approachingCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    marginVertical: 10,
  },
  approachingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  approachingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8EE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  approachingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5E7E',
    marginRight: 6,
  },
  approachingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF5E7E',
  },
  approachingTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  approachingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  approachingDistanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#F6DFE6',
    marginBottom: 14,
  },
  approachingDistVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  approachingDistSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
