import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LiveMapScreen } from '../screens/LiveMapScreen';
import { SafetyMonitoringScreen } from '../screens/SafetyMonitoringScreen';
import { CommunityHazardsScreen } from '../screens/CommunityHazardsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EmergencyModal } from '../components/EmergencyModal';
import { useSafetyMonitoring } from '../hooks/useSafetyMonitoring';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { emergencyService } from '../services/emergencyService';
import { getDeviceTelemetry } from '../utils/deviceInfo';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const TabNavigator = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  const handleFloatingSosConfirm = async () => {
    try {
      let locCoords = null;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (pos && pos.coords) {
          locCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: `GPS Fix (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          };
        }
      } catch (e) {
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last && last.coords) {
            locCoords = {
              lat: last.coords.latitude,
              lng: last.coords.longitude,
              name: `GPS Fix (${last.coords.latitude.toFixed(4)}, ${last.coords.longitude.toFixed(4)})`,
            };
          }
        } catch (err) {}
      }

      let batPct = null;
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level >= 0) batPct = Math.round(level * 100);
      } catch (e) {}

      const userName = user?.name || user?.fullName || 'Active Tourist';
      const devTelemetry = await getDeviceTelemetry(batPct);
      await emergencyService.triggerSos({
        userId: user?.id,
        userName,
        tripId: user?.activeTripId || null,
        type: 'MANUAL_SOS',
        priority: 'CRITICAL',
        message: `🚨 MANUAL SOS triggered by ${userName}! Immediate emergency response required.`,
        location: locCoords,
        batteryLevel: batPct,
        deviceInfo: devTelemetry,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[FLOATING SOS DISPATCH ERROR]', err.message);
    }
  };

  const {
    inactivityMinutes,
    showCheckInPrompt,
    geofenceViolated,
    isOffline,
    fallDetected,
    confirmSafetyCheckIn,
    simulateFallDetection,
    simulateGeofenceBreach,
    setIsOffline,
  } = useSafetyMonitoring(true);

  // Render the current screen based on activeTab
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateProfile={() => setActiveTab('profile')}
            onStartNewTrip={() => setActiveTab('map')}
            onNavigateMap={() => setActiveTab('map')}
            onNavigateNotifications={() => setActiveTab('notifications')}
          />
        );
      case 'trips':
        return (
          <HistoryScreen
            onBack={() => setActiveTab('home')}
            onSelectTrip={() => setActiveTab('monitoring')}
          />
        );
      case 'map':
        return <LiveMapScreen onBack={() => setActiveTab('home')} />;
      case 'monitoring':
        return (
          <SafetyMonitoringScreen
            inactivityMinutes={inactivityMinutes}
            geofenceViolated={geofenceViolated}
            isOffline={isOffline}
            fallDetected={fallDetected}
            onSimulateFall={simulateFallDetection}
            onSimulateGeofence={simulateGeofenceBreach}
            onToggleOffline={() => setIsOffline((prev) => !prev)}
            onPauseMonitoring={() => {}}
            onEndTrip={() => setActiveTab('trips')}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'hazards':
        return <CommunityHazardsScreen onBack={() => setActiveTab('home')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setActiveTab('home')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setActiveTab('profile')} />;
      case 'profile':
      default:
        return (
          <ProfileScreen
            onBack={() => setActiveTab('home')}
            onNavigateSettings={() => setActiveTab('settings')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.container}>
        {/* Active Screen Content */}
        <View style={styles.content}>{renderScreen()}</View>

        {/* ========================================================
            FLOATING BOTTOM NAVIGATION BAR (Matching Reference Screens)
            [ Home ] [ Trips ] ( SOS ) [ Map ] [ Profile ]
            ======================================================== */}
        <View
          style={[
            styles.tabBarWrapper,
            { backgroundColor: colors.tabBarBg || '#FFFFFF', borderColor: colors.tabBarBorder || '#F4DFE5' },
            SHADOWS.card,
          ]}
        >
          {/* Home Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'home' ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'home' ? colors.primary : colors.tabBarInactive },
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* Trips Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('trips')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'trips' ? 'map' : 'map-outline'}
              size={22}
              color={activeTab === 'trips' ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'trips' ? colors.primary : colors.tabBarInactive },
              ]}
            >
              Trips
            </Text>
          </TouchableOpacity>

          {/* Center Floating SOS Button */}
          <View style={styles.centerSosSlot}>
            <TouchableOpacity
              style={[styles.floatingSosBtn, SHADOWS.glowDanger]}
              onPress={() => setIsSosModalOpen(true)}
              activeOpacity={0.88}
            >
              <Text style={styles.floatingSosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          {/* Map Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('map')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'map' ? 'navigate' : 'navigate-outline'}
              size={22}
              color={activeTab === 'map' ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'map' ? colors.primary : colors.tabBarInactive },
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeTab === 'profile' ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'profile' ? colors.primary : colors.tabBarInactive },
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Distress Modal triggered from floating SOS */}
      <EmergencyModal
        isOpen={isSosModalOpen}
        alertType="MANUAL_SOS"
        onClose={() => setIsSosModalOpen(false)}
        onConfirmSos={handleFloatingSosConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 14 : 10,
    left: 16,
    right: 16,
    height: 66,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  centerSosSlot: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSosBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B69',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -20,
  },
  floatingSosText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
