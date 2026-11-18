import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const SosButton = ({ onSosTriggered, style }) => {
  const { colors } = useTheme();
  const [pressing, setPressing] = useState(false);

  const handleSos = () => {
    setPressing(true);
    setTimeout(() => {
      setPressing(false);
      onSosTriggered && onSosTriggered();
    }, 250);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Outer Pulse Glow Ring */}
      <View style={styles.pulseRing}>
        <TouchableOpacity
          onPress={handleSos}
          activeOpacity={0.88}
          style={[styles.sosCircle, pressing && styles.sosCirclePressed, SHADOWS.glowDanger]}
        >
          <Ionicons name="alert-circle" size={32} color="#FFFFFF" style={{ marginBottom: 2 }} />
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubText}>EMERGENCY</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Press for 1-Tap Immediate Distress Alert to Police Helpline (112), Command Center & Guardians
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  pulseRing: {
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: 'rgba(255, 59, 105, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sosCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF3B69',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sosCirclePressed: {
    backgroundColor: '#E02450',
    transform: [{ scale: 0.94 }],
  },
  sosText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  sosSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  description: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 16,
  },
});
