import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { safeZoneService } from '../services/safeZoneService';
import { apiFetch } from '../utils/api';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const NotificationsScreen = ({ onBack }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const notifs = [];

      // 1. Check for active safe zone
      try {
        const zoneRes = await safeZoneService.getActiveSafeZone(user?.id);
        if (zoneRes.success && zoneRes.trip) {
          const trip = zoneRes.trip;
          notifs.push({
            id: `notif-sz-${trip.id}`,
            title: `Safe Zone Protection Active`,
            body: `Your 5 km circular boundary for ${trip.destination || trip.destinationName || 'Destination'} is active with real-time GPS telemetry.`,
            timestamp: 'Active Now',
            type: 'SAFE_ZONE',
            unread: trip.status === 'WARNING' || trip.status === 'BREACHED',
          });
        }
      } catch (e) {}

      // 2. Check for alerts
      try {
        const alertsRes = await apiFetch('/alerts');
        if (alertsRes && alertsRes.alerts && Array.isArray(alertsRes.alerts)) {
          const userAlerts = alertsRes.alerts.filter(
            (a) =>
              (user?.id && (a.userId === user.id || a.user_id === user.id)) ||
              (user?.name && a.userName && a.userName.toLowerCase() === user.name.toLowerCase())
          );

          userAlerts.slice(0, 5).forEach((al) => {
            notifs.push({
              id: `notif-alt-${al.id}`,
              title: al.type === 'GEOFENCE_BREACH' ? 'Geofence Breach Alert' : 'Emergency SOS Alert',
              body: al.message || `Incident logged with status: ${al.status}`,
              timestamp: al.timestamp ? new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              type: al.type === 'GEOFENCE_BREACH' ? 'SAFE_ZONE' : 'EMERGENCY',
              unread: al.status === 'Pending' || al.status === 'open',
            });
          });
        }
      } catch (e) {}

      // 3. User Guardian status notification
      const guardian = user?.guardians?.[0] || (user?.emergencyContact ? { phone: user.emergencyContact } : null);
      if (guardian && guardian.phone) {
        notifs.push({
          id: 'notif-guardian-configured',
          title: 'Guardian Emergency SMS Active',
          body: `Automatic distress SMS broadcast configured for guardian (${guardian.phone}).`,
          timestamp: 'Configured',
          type: 'GUARDIAN',
          unread: false,
        });
      }

      // 4. General system status
      notifs.push({
        id: 'notif-system-connected',
        title: 'Safety Network Standing By',
        body: 'Local GNSS sensor telemetry streaming and offline emergency incident caching are active.',
        timestamp: 'System',
        type: 'ADVISORY',
        unread: false,
      });

      setNotifications(notifs);
    } catch (err) {
      console.log('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header
          title="Notifications"
          subtitle="Alerts & system updates"
          onBack={onBack}
          rightAction={
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markReadBtn}>
              <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5E7E']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF5E7E" style={{ marginTop: 40 }} />
        ) : (
          notifications.map((n) => {
            const isSafeZone = n.type === 'SAFE_ZONE';
            const isGuardian = n.type === 'GUARDIAN';
            const isEmergency = n.type === 'EMERGENCY';

            return (
              <View
                key={n.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
                  n.unread && { borderWidth: 2, borderColor: colors.primary },
                  SHADOWS.card,
                ]}
              >
                <View style={styles.notifHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isEmergency
                          ? '#FFE5EC'
                          : isSafeZone
                          ? '#E8FDF5'
                          : isGuardian
                          ? '#FFE8EE'
                          : '#FFF8EB',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isEmergency
                          ? 'megaphone'
                          : isSafeZone
                          ? 'shield-checkmark'
                          : isGuardian
                          ? 'chatbubble-ellipses'
                          : 'information-circle'
                      }
                      size={20}
                      color={
                        isEmergency ? '#FF3B69' : isSafeZone ? '#06D6A0' : isGuardian ? '#FF5E7E' : '#FF9F1C'
                      }
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                        {n.title}
                      </Text>
                      {n.unread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                      {n.timestamp}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.notifBody, { color: colors.textSecondary }]}>
                  {n.body}
                </Text>
              </View>
            );
          })
        )}
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
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  notifCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B69',
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    paddingLeft: 52,
  },
});
