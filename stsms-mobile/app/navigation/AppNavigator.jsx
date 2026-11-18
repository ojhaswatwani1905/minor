import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let timer;
    if (!loading) {
      // Allow minimum smooth presentation of 1200ms
      timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {}
        setIsAppReady(true);
      }, 1200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  // Screen 1: Splash Screen (Matching Reference Screen 1)
  if (loading || !isAppReady) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
        <View style={styles.splashContent}>
          {/* Shield Badge with Checkmark */}
          <View style={[styles.shieldBadgeWrap, SHADOWS.glowCoral]}>
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>

          <Text style={[styles.splashTitle, { color: colors.text }]}>STSMS</Text>
          <Text style={[styles.splashSubtitle, { color: colors.textSecondary }]}>
            Smart Tourist Safety Monitoring System
          </Text>
          <Text style={styles.splashTagline}>
            Stay Safe, Travel Smart
          </Text>

          {/* Activity Indicator */}
          <ActivityIndicator size="small" color="#FF5E7E" style={{ marginTop: 24 }} />
        </View>

        {/* Bottom Three Indicator Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <TabNavigator />;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  splashContent: {
    alignItems: 'center',
    marginTop: 120,
  },
  shieldBadgeWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF5E7E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  splashSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 240,
  },
  splashTagline: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5E7E',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3D2DC',
  },
  activeDot: {
    width: 22,
    backgroundColor: '#FF5E7E',
  },
});
