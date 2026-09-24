import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const SosButton = ({ onSosTriggered }) => {
  const [pressing, setPressing] = useState(false);

  const handleSos = () => {
    setPressing(true);
    setTimeout(() => {
      setPressing(false);
      onSosTriggered && onSosTriggered();
    }, 400);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleSos}
        activeOpacity={0.8}
        style={[styles.button, pressing && styles.buttonPressing]}
      >
        <Text style={styles.sosText}>SOS</Text>
        <Text style={styles.subText}>1-Tap Alert</Text>
      </TouchableOpacity>
      <Text style={styles.description}>
        Press for 1-Tap Immediate Distress Beacon to Command Center & Guardians
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dc2626',
    borderWidth: 4,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonPressing: {
    backgroundColor: '#b91c1c',
    transform: [{ scale: 0.95 }],
  },
  sosText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  subText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fecaca',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  description: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 240,
  },
});

