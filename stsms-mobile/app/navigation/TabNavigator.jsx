import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreateTripScreen } from '../screens/CreateTripScreen';
import { CommunityHazardsScreen } from '../screens/CommunityHazardsScreen';
import { SafetyMonitoringScreen } from '../screens/SafetyMonitoringScreen';
import { useSafetyMonitoring } from '../hooks/useSafetyMonitoring';

export const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');

  const {
    inactivityMinutes,
    showCheckInPrompt,
    geofenceViolated,
    isOffline,
    fallDetected,
    confirmSafetyCheckIn,
    simulateFallDetection,
    simulateGeofenceBreach,
    setIsOffline
  } = useSafetyMonitoring(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {activeTab === 'home' ? (
            <HomeScreen
              onNavigateProfile={() => setActiveTab('profile')}
              onStartNewTrip={() => setActiveTab('createTrip')}
              onNavigateHazards={() => setActiveTab('hazards')}
            />
          ) : activeTab === 'hazards' ? (
            <CommunityHazardsScreen onBack={() => setActiveTab('home')} />
          ) : activeTab === 'monitoring' ? (
            <SafetyMonitoringScreen
              inactivityMinutes={inactivityMinutes}
              geofenceViolated={geofenceViolated}
              isOffline={isOffline}
              fallDetected={fallDetected}
              onSimulateFall={simulateFallDetection}
              onSimulateGeofence={simulateGeofenceBreach}
              onToggleOffline={() => setIsOffline(prev => !prev)}
              onBack={() => setActiveTab('home')}
            />
          ) : activeTab === 'createTrip' ? (
            <CreateTripScreen
              onBack={() => setActiveTab('home')}
              onTripCreated={() => setActiveTab('home')}
            />
          ) : (
            <ProfileScreen onBack={() => setActiveTab('home')} />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'home' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
              🏠 Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('hazards')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'hazards' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'hazards' && styles.activeTabText]}>
              🛡️ Hazards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('monitoring')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'monitoring' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'monitoring' && styles.activeTabText]}>
              📡 Sensors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('createTrip')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'createTrip' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'createTrip' && styles.activeTabText]}>
              📍 Expedition
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#22d3ee',
  },
});
