import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';

export const NotificationsScreen = ({ onBack }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: '🚨 Geofenced Avalanche Advisory Transmitted',
      body: 'Command Director broadcasted Level 4 Avalanche danger notice for Rohtang Sector.',
      timestamp: '10 mins ago',
      type: 'BROADCAST',
      unread: true
    },
    {
      id: 'notif-2',
      title: '✓ Guardian SMS Dispatch Verified',
      body: 'Automated SMS & satellite track link delivered to Rohan Nair (+91 98765 43210).',
      timestamp: '1 hour ago',
      type: 'SMS',
      unread: false
    },
    {
      id: 'notif-3',
      title: '📡 Satellite Mesh Handshake Successful',
      body: 'Connected to Starlink LEO Ground Gateway Node Alpha.',
      timestamp: '3 hours ago',
      type: 'SYSTEM',
      unread: false
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="Safety Alerts & Notifications"
        subtitle="Push broadcasts & guardian dispatch log"
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.8}>
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.list}>
        {notifications.map((n) => (
          <View
            key={n.id}
            style={[styles.card, n.unread ? styles.unreadCard : styles.readCard]}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.timestamp}>{n.timestamp}</Text>
            </View>
            <Text style={styles.body}>{n.body}</Text>
          </View>
        ))}
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
  markReadText: {
    color: '#22d3ee',
    fontWeight: 'bold',
    fontSize: 12,
  },
  list: {
    gap: 10,
    marginTop: 6,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  unreadCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  readCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: '#1e293b',
    opacity: 0.8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 10,
    color: '#64748b',
  },
  body: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});

