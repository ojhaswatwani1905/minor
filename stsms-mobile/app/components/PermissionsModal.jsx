import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from './Button';

export const PermissionsModal = ({ visible, onGrantPermissions }) => {
  const [locationGranted, setLocationGranted] = useState(true);
  const [micGranted, setMicGranted] = useState(true);
  const [cameraGranted, setCameraGranted] = useState(true);

  const handleGrant = () => {
    onGrantPermissions && onGrantPermissions();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>MANDATORY SAFETY SETUP</Text>
            </View>
            <Text style={styles.title}>Required App Permissions</Text>
            <Text style={styles.subtitle}>
              STSMS requires hardware permissions for high-altitude GPS tracking, SOS audio & photo evidence.
            </Text>
          </View>

          <View style={styles.permList}>
            {/* Location Permission */}
            <View style={styles.permRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.permTitle}>GPS Satellite Location (Required)</Text>
                <Text style={styles.permSub}>Real-time 10s position sync & geofence perimeter alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLocationGranted(!locationGranted)}
                style={[styles.statusTag, locationGranted ? styles.tagActive : styles.tagInactive]}
              >
                <Text style={[styles.statusTagText, locationGranted ? styles.tagActiveText : styles.tagInactiveText]}>
                  {locationGranted ? 'Granted ✓' : 'Allow'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Microphone Permission */}
            <View style={styles.permRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>🎙️</Text>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.permTitle}>Microphone Access (Required)</Text>
                <Text style={styles.permSub}>2-Way Emergency SOS distress audio broadcast</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMicGranted(!micGranted)}
                style={[styles.statusTag, micGranted ? styles.tagActive : styles.tagInactive]}
              >
                <Text style={[styles.statusTagText, micGranted ? styles.tagActiveText : styles.tagInactiveText]}>
                  {micGranted ? 'Granted ✓' : 'Allow'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Camera Permission */}
            <View style={styles.permRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>📷</Text>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.permTitle}>Camera Access (Required)</Text>
                <Text style={styles.permSub}>SOS photo evidence & QR safety checkpost scanner</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCameraGranted(!cameraGranted)}
                style={[styles.statusTag, cameraGranted ? styles.tagActive : styles.tagInactive]}
              >
                <Text style={[styles.statusTagText, cameraGranted ? styles.tagActiveText : styles.tagInactiveText]}>
                  {cameraGranted ? 'Granted ✓' : 'Allow'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Grant Permissions & Continue →"
            onPress={handleGrant}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.92)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#22d3ee',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  permList: {
    gap: 12,
    marginVertical: 4,
  },
  permRow: {
    backgroundColor: '#05080e',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
  },
  permTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  permSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  tagInactive: {
    backgroundColor: '#1e293b',
  },
  tagActiveText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tagInactiveText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
