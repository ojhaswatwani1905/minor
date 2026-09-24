import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SosButton } from '../components/SosButton';
import { TripStatusCard } from '../components/TripStatusCard';
import { SafetyTipCard } from '../components/SafetyTipCard';
import { PermissionsModal } from '../components/PermissionsModal';
import { useLocation } from '../hooks/useLocation';
import { apiFetch } from '../utils/api';

export const HomeScreen = ({ onNavigateProfile, onStartNewTrip }) => {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState(null);
  const [sosStatus, setSosStatus] = useState('');
  const [permissionsVisible, setPermissionsVisible] = useState(true);

  // Activates live 10-second background GPS & battery telemetry sync to backend server
  const { coords, lastSync, batteryLevel } = useLocation(true);

  const handleGrantPermissions = () => {
    setPermissionsVisible(false);
  };

  const handleStartTrip = () => {
    if (onStartNewTrip) {
      onStartNewTrip();
    } else {
      setActiveTrip({
        id: `trp_${Date.now()}`,
        destination: 'Rohtang Pass Summit (3,978m)',
        expectedReturnTime: 'Today, 18:00',
        guardianPhone: '+91 98765 43210'
      });
    }
  };

  const handleEndTrip = () => {
    setActiveTrip(null);
  };

  const handleSos = async () => {
    setSosStatus('DISTRESS SOS BROADCAST TRANSMITTED!');
    try {
      await apiFetch('/alerts/simulate', {
        method: 'POST',
        body: JSON.stringify({
          userName: user?.name || 'Priya Nair',
          message: `🚨 1-Tap Mobile SOS Emergency Triggered by ${user?.name || 'Priya Nair'}! Immediate SAR response required.`,
          type: 'SOS Request',
          location: {
            name: coords?.name || 'Rohtang Pass Track (3,978m)',
            lat: coords?.lat || 32.3716,
            lng: coords?.lng || 77.2466
          }
        })
      });
    } catch (e) {
      console.log('SOS triggered locally:', e);
    }
    setTimeout(() => setSosStatus(''), 4000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Mandatory Hardware Permissions Modal */}
      <PermissionsModal
        visible={permissionsVisible}
        onGrantPermissions={handleGrantPermissions}
      />

      {/* Header Welcome Banner */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0) : 'T'}</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome, {user?.name || 'Explorer'}</Text>
            <View style={styles.meshRow}>
              <View style={styles.greenDot} />
              <Text style={styles.meshText}>10s GPS Sync • 🔋 {batteryLevel}%</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={onNavigateProfile} activeOpacity={0.8}>
          <Text style={styles.profileBtnText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* SOS Alert Banner Toast */}
      {!!sosStatus && (
        <View style={styles.sosToast}>
          <Text style={styles.sosToastText}>🚨 {sosStatus}</Text>
        </View>
      )}

      {/* Large 1-Tap SOS Emergency Button */}
      <SosButton onSosTriggered={handleSos} />

      {/* Active Trip Status Card */}
      <TripStatusCard
        activeTrip={activeTrip}
        onStartTrip={handleStartTrip}
        onEndTrip={handleEndTrip}
      />

      {/* Travel Safety & Mountain Advisory Tips */}
      <View style={styles.advisorySection}>
        <View style={styles.advisoryHeader}>
          <Text style={styles.advisoryTitle}>High Altitude Safety Advisories</Text>
          <Text style={styles.advisoryBadge}>2 Active</Text>
        </View>

        <SafetyTipCard
          title="Hypothermia & Freezing Wind Alert"
          category="Weather Advisory"
          description="Temperatures drop below -4°C past 3,000m. Keep battery warm in inner pockets to avoid sudden power loss."
        />
        <SafetyTipCard
          title="High Altitude Oxygen Hydration"
          category="Health Safety"
          description="Drink 3L water daily and maintain 2-way satellite mesh contact every 30 minutes while on active pass."
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  welcomeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  meshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  meshText: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: 11,
  },
  profileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
  },
  profileBtnText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 12,
  },
  sosToast: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  sosToastText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  advisorySection: {
    marginTop: 16,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  advisoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22d3ee',
  },
});

