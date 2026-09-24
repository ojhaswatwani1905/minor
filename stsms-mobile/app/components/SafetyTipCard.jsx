import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SafetyTipCard = ({ title, category, description }) => {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{category || 'High Altitude Advisory'}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 4,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22d3ee',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});

