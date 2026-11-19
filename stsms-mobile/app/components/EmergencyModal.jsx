import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const EmergencyModal = ({
  isOpen,
  onClose,
  alertType = '1-Tap Emergency SOS',
  geofenceData = null, // { destination, distanceMeters, radiusMeters: 5000 }
  onConfirmSos,
  onCancelSos,
  onConfirmSafe,
}) => {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(5);
  const [dispatched, setDispatched] = useState(false);

  const isGeofenceBreach =
    alertType === 'GEOFENCE_BREACH' ||
    alertType === 'Boundary Breach' ||
    !!geofenceData;

  // Reset countdown and dispatched status every time modal is opened
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setDispatched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isOpen && !isGeofenceBreach && countdown > 0 && !dispatched) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && !isGeofenceBreach && countdown === 0 && !dispatched) {
      handleFinalDispatch();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, countdown, dispatched, isGeofenceBreach]);

  const handleFinalDispatch = () => {
    setDispatched(true);
    onConfirmSos &&
      onConfirmSos({
        type: isGeofenceBreach ? 'GEOFENCE_BREACH' : 'MANUAL_SOS',
        timestamp: new Date().toISOString(),
      });
  };

  const handleCallHelpline = () => {
    const phoneNumber = 'tel:112';
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) Linking.openURL(phoneNumber);
      })
      .catch((err) => console.log('Cannot open phone dialer:', err));
  };

  if (!isOpen) return null;

  return (
    <Modal visible={!!isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        {isGeofenceBreach ? (
          /* ========================================================
             AUTOMATIC GEOFENCE BREACH EXPERIENCE (Reference Screen 9)
             ======================================================== */
          <View style={[styles.breachModalCard, SHADOWS.glowDanger]}>
            <View style={styles.breachIconCircle}>
              <Ionicons name="megaphone" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.breachTitle}>Geofence Breach</Text>
            <Text style={styles.breachBadge}>(Automatic SOS)</Text>
            <Text style={styles.breachSubtitle}>
              You have left the designated safe zone of{' '}
              {geofenceData?.destination || 'Destination'}.
            </Text>

            {/* Metrics Row */}
            <View style={styles.breachMetricsRow}>
              <View style={styles.breachMetricCard}>
                <Text style={styles.breachMetricLabel}>Current Distance</Text>
                <Text style={styles.breachMetricValue}>
                  {geofenceData?.distanceMeters
                    ? `${(geofenceData.distanceMeters / 1000).toFixed(1)} km`
                    : '5.4 km'}
                </Text>
              </View>
              <View style={styles.breachMetricCard}>
                <Text style={styles.breachMetricLabel}>Safe Radius</Text>
                <Text style={styles.breachMetricValue}>5.0 km</Text>
              </View>
            </View>

            {/* Notification Banner */}
            <View style={styles.breachNoticeBox}>
              <Ionicons name="information-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.breachNoticeText}>
                An automatic SOS has been sent to the Admin and your Guardian.
              </Text>
            </View>

            {/* Primary Action: I'm Safe Now */}
            <TouchableOpacity
              style={[styles.whiteActionBtn, SHADOWS.card]}
              onPress={() => {
                onConfirmSafe && onConfirmSafe();
                onClose && onClose();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={20} color="#1E293B" style={{ marginRight: 6 }} />
              <Text style={styles.whiteActionBtnText}>I'm Safe Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================
             MANUAL SOS EMERGENCY EXPERIENCE
             ======================================================== */
          <View style={[styles.manualModalCard, SHADOWS.glowDanger]}>
            {/* Header Badge */}
            <View style={styles.manualHeader}>
              <View style={styles.manualBadgePill}>
                <Ionicons name="warning" size={16} color="#FF3B69" style={{ marginRight: 4 }} />
                <Text style={styles.manualBadgeText}>Emergency Distress Triggered</Text>
              </View>
              <Text style={styles.manualTitle}>Manual SOS Beacon</Text>
            </View>

            {/* Countdown or Dispatched Notification */}
            {!dispatched ? (
              <View style={styles.countdownBox}>
                <View style={styles.countdownRing}>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                </View>
                <Text style={styles.countdownNotice}>
                  Broadcasting live coordinates to Command Center & Guardians in{' '}
                  <Text style={{ fontWeight: '800', color: '#FF3B69' }}>{countdown}s</Text>
                </Text>
              </View>
            ) : (
              <View style={styles.dispatchedBox}>
                <View style={styles.dispatchedCheck}>
                  <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.dispatchedTitle}>DISTRESS BEACON TRANSMITTED</Text>
                <Text style={styles.dispatchedSub}>
                  Command Center & Guardians have been alerted with your live GPS location.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {!dispatched ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      onCancelSos && onCancelSos();
                      onClose && onClose();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dispatchNowBtn, SHADOWS.glowDanger]}
                    onPress={handleFinalDispatch}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dispatchNowBtnText}>Send SOS Now</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.cardWarm || '#FFFBF7' }]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.closeBtnText, { color: colors.text }]}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 15, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // Geofence Breach Card Styles (Screen 9)
  breachModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FF3B69',
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
  },
  breachIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breachTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  breachBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  breachSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  breachMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 14,
  },
  breachMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
  },
  breachMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  breachMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  breachNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
    width: '100%',
  },
  breachNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  whiteActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  whiteActionBtnText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  crimsonActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E02450',
  },
  crimsonActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Manual SOS Card Styles
  manualModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
  },
  manualHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  manualBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8EE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 8,
  },
  manualBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B69',
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  countdownBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  countdownRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE8EE',
    borderWidth: 3,
    borderColor: '#FF3B69',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF3B69',
  },
  countdownNotice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
  },
  dispatchedBox: {
    alignItems: 'center',
    marginVertical: 14,
    padding: 12,
    backgroundColor: '#E8FDF5',
    borderRadius: RADIUS.lg,
    width: '100%',
  },
  dispatchedCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06D6A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dispatchedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#06D6A0',
    marginBottom: 4,
  },
  dispatchedSub: {
    fontSize: 11,
    color: '#2D3748',
    textAlign: 'center',
  },
  call112Btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FF3B69',
    marginVertical: 12,
  },
  call112BtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#F2D7E0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dispatchNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FF5E7E',
  },
  dispatchNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#F2D7E0',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
