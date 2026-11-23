import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deadManService } from '../services/deadManService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS } from '../constants/theme';

const INTERVAL_PRESETS = [
  ...(__DEV__ ? [{ label: '60s (Test)', seconds: 60 }] : []),
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
  { label: '2h', seconds: 7200 },
];

export const DeadManSwitchCard = ({ currentCoords, batteryLevel = 80 }) => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [session, setSession] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState(900); // Default 15m
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [effectiveStatus, setEffectiveStatus] = useState('INACTIVE');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const localTimerRef = useRef(null);

  // Load active session from server on mount
  const refreshStatus = async () => {
    try {
      const res = await deadManService.getStatus(user?.id);
      if (res.success && res.hasActiveSession && res.session) {
        setSession(res.session);
        setRemainingSeconds(res.remainingSeconds);
        setEffectiveStatus(res.effectiveStatus);
      } else {
        setSession(null);
        setRemainingSeconds(0);
        setEffectiveStatus('INACTIVE');
      }
    } catch (e) {
      console.warn('[DEADMAN REFRESH ERROR]', e.message);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [user?.id]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    if (localTimerRef.current) clearInterval(localTimerRef.current);

    if (session && session.status === 'ACTIVE') {
      localTimerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Re-fetch from server when reaching 0
            refreshStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [session?.status, session?.nextDeadlineAt]);

  // Periodic server sync every 15 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (session && session.status === 'ACTIVE') {
        refreshStatus();
      }
    }, 15000);
    return () => clearInterval(syncInterval);
  }, [session?.id, session?.status]);

  // Start Session
  const handleStart = async () => {
    setActionLoading(true);
    try {
      const telemetry = {
        location: currentCoords ? {
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          accuracy: currentCoords.accuracy || 10,
          timestamp: new Date().toISOString()
        } : null,
        hardware: {
          batteryLevel,
          networkSignal: 'Mobile GNSS',
          deviceModel: 'Android Mobile'
        }
      };

      const res = await deadManService.startSession(selectedInterval, telemetry, user || {});
      if (res.success && res.session) {
        setSession(res.session);
        setRemainingSeconds(res.session.intervalSeconds);
        setEffectiveStatus('ACTIVE');
      } else {
        Alert.alert('Activation Error', res.message || 'Could not start Dead Man Switch.');
      }
    } catch (err) {
      Alert.alert('Network Error', err.message || 'Could not communicate with safety server.');
    } finally {
      setActionLoading(false);
    }
  };

  // Check In ("I AM SAFE")
  const handleCheckIn = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      const telemetry = {
        location: currentCoords ? {
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          accuracy: currentCoords.accuracy || 10,
          timestamp: new Date().toISOString()
        } : null,
        hardware: {
          batteryLevel,
          networkSignal: 'Mobile GNSS'
        }
      };

      const res = await deadManService.checkIn(session.id, telemetry, user?.id);
      if (res.success && res.session) {
        setSession(res.session);
        setRemainingSeconds(res.session.intervalSeconds);
        setEffectiveStatus('ACTIVE');
      } else if (res.status === 409 || res.message?.includes('escalated')) {
        setEffectiveStatus('EMERGENCY ESCALATED');
        Alert.alert('Deadline Missed', 'This deadline has expired and an automated alert has been dispatched to Command Center.');
      } else {
        Alert.alert('Check-In Note', res.message || 'Unable to confirm check-in.');
      }
    } catch (err) {
      Alert.alert('Network Note', err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Pause
  const handlePause = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      const res = await deadManService.pause(session.id, user?.id);
      if (res.success && res.session) {
        setSession(res.session);
        setEffectiveStatus('PAUSED');
      }
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  // Resume
  const handleResume = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      const res = await deadManService.resume(session.id, user?.id);
      if (res.success && res.session) {
        setSession(res.session);
        setRemainingSeconds(res.remainingSeconds || res.session.intervalSeconds);
        setEffectiveStatus('ACTIVE');
      }
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  // Stop
  const handleStop = async () => {
    if (!session) return;
    Alert.alert(
      'Deactivate Dead Man Switch',
      'Are you sure you want to stop scheduled safety check-ins?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deadManService.stop(session.id, user?.id);
              setSession(null);
              setRemainingSeconds(0);
              setEffectiveStatus('INACTIVE');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (totalSecs) => {
    if (totalSecs <= 0) return '00:00';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isActive = session && session.status === 'ACTIVE';
  const isPaused = session && session.status === 'PAUSED';
  const isEscalated = effectiveStatus === 'EMERGENCY ESCALATED' || session?.status === 'ESCALATED';
  const isCheckInRequired = effectiveStatus === 'CHECK-IN REQUIRED' || (isActive && remainingSeconds <= 300);
  const isOverdue = effectiveStatus === 'OVERDUE' || (isActive && remainingSeconds === 0);

  // Status badge styling
  const getBadgeConfig = () => {
    if (isEscalated) {
      return { label: 'EMERGENCY ESCALATED', bg: '#FFE5EC', text: '#D90429', border: '#FFB3C6' };
    }
    if (isOverdue) {
      return { label: 'CHECK-IN OVERDUE', bg: '#FFF3E0', text: '#E65100', border: '#FFE0B2' };
    }
    if (isCheckInRequired) {
      return { label: 'CHECK-IN REQUIRED', bg: '#FFF8E1', text: '#F57F17', border: '#FFECB3' };
    }
    if (isPaused) {
      return { label: 'TIMER PAUSED', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
    if (isActive) {
      return { label: 'SAFETY WATCH ACTIVE', bg: '#E8FDF5', text: '#059669', border: '#A7F3D0' };
    }
    return { label: 'INACTIVE', bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  };

  const badge = getBadgeConfig();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardWarm || '#FFFBF7',
          borderColor: isEscalated ? '#FF8FAB' : isCheckInRequired ? '#FFD166' : colors.cardBorder || '#F6DFE6',
        },
        SHADOWS.card,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: isEscalated ? '#FFE5EC' : '#FFF0F5' }]}>
            <Ionicons
              name={isEscalated ? 'alert-circle' : 'timer-outline'}
              size={22}
              color={isEscalated ? '#D90429' : colors.primary || '#FF5E7E'}
            />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.title, { color: colors.text }]}>Dead Man's Switch</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Automated Check-In Safety System
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Main Body */}
      {!isActive && !isPaused && !isEscalated ? (
        /* INACTIVE STATE: Interval Selection & Activation */
        <View style={styles.inactiveBody}>
          <Text style={[styles.sectionPrompt, { color: colors.text }]}>
            Set Periodic Check-in Interval
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            If you miss a check-in, the server will auto-dispatch an emergency SOS incident with your last known location.
          </Text>

          {/* Preset Buttons */}
          <View style={styles.presetsRow}>
            {INTERVAL_PRESETS.map((preset) => {
              const isSelected = selectedInterval === preset.seconds;
              return (
                <TouchableOpacity
                  key={preset.seconds}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: isSelected ? colors.primary || '#FF5E7E' : '#FFFFFF',
                      borderColor: isSelected ? colors.primary || '#FF5E7E' : colors.cardBorder || '#F6DFE6',
                    },
                  ]}
                  onPress={() => setSelectedInterval(preset.seconds)}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Activate Button */}
          <TouchableOpacity
            style={[styles.primaryCTA, SHADOWS.glowCoral, actionLoading && { opacity: 0.7 }]}
            onPress={handleStart}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryCTAText}>Activate Dead Man's Switch</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ACTIVE / PAUSED / ESCALATED STATE: Countdown Timer & Controls */
        <View style={styles.activeBody}>
          {isEscalated ? (
            /* Emergency Escalated Notice */
            <View style={styles.escalatedNotice}>
              <Ionicons name="warning" size={24} color="#D90429" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.escalatedTitle}>Emergency Distress Auto-Dispatched</Text>
                <Text style={styles.escalatedDesc}>
                  You missed your scheduled check-in. Incident #{session?.escalationIncidentId || session?.id} has been transmitted to the Command Center with your last known GPS coordinates.
                </Text>
              </View>
            </View>
          ) : (
            /* Big Countdown Display */
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
                {isPaused ? 'TIME REMAINING (PAUSED)' : 'NEXT CHECK-IN REQUIRED IN'}
              </Text>
              <Text
                style={[
                  styles.countdownTime,
                  {
                    color: isOverdue ? '#D90429' : isCheckInRequired ? '#E65100' : colors.text,
                  },
                ]}
              >
                {formatTime(remainingSeconds)}
              </Text>

              <Text style={[styles.deadlineInfo, { color: colors.textSecondary }]}>
                Deadline: {new Date(session.nextDeadlineAt).toLocaleTimeString()} • Interval: {Math.round(session.intervalSeconds / 60)} min
              </Text>
            </View>
          )}

          {/* Primary Action Button: "I AM SAFE (CHECK-IN)" */}
          {!isEscalated && (
            <TouchableOpacity
              style={[
                styles.checkInCTA,
                isCheckInRequired ? styles.checkInUrgent : styles.checkInNormal,
                actionLoading && { opacity: 0.7 },
                SHADOWS.glowCoral,
              ]}
              onPress={handleCheckIn}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="hand-right" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.checkInCTAText}>I AM SAFE (CHECK-IN)</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Secondary Control Row: Pause / Resume / Stop */}
          <View style={styles.controlsRow}>
            {isPaused ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
                onPress={handleResume}
                disabled={actionLoading}
              >
                <Ionicons name="play" size={16} color="#059669" />
                <Text style={[styles.secondaryBtnText, { color: '#059669' }]}>Resume Timer</Text>
              </TouchableOpacity>
            ) : !isEscalated ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
                onPress={handlePause}
                disabled={actionLoading}
              >
                <Ionicons name="pause" size={16} color="#475569" />
                <Text style={[styles.secondaryBtnText, { color: '#475569' }]}>Pause</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              onPress={handleStop}
              disabled={actionLoading}
            >
              <Ionicons name="stop-circle-outline" size={16} color="#D90429" />
              <Text style={[styles.secondaryBtnText, { color: '#D90429' }]}>
                {isEscalated ? 'Dismiss / Reset' : 'End Switch'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  inactiveBody: {
    paddingTop: 4,
  },
  sectionPrompt: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryCTA: {
    backgroundColor: '#FF5E7E',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBody: {
    paddingTop: 4,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#F1E1E6',
    marginBottom: 14,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  countdownTime: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  deadlineInfo: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  checkInCTA: {
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkInNormal: {
    backgroundColor: '#06D6A0',
  },
  checkInUrgent: {
    backgroundColor: '#FF5E7E',
  },
  checkInCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  escalatedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFE5EC',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FFB3C6',
    marginBottom: 14,
  },
  escalatedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D90429',
  },
  escalatedDesc: {
    fontSize: 11,
    color: '#7A0019',
    marginTop: 2,
    lineHeight: 15,
  },
});

