import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Button } from './Button';

export const CheckInModal = ({ isOpen, onConfirmSafe, onTriggerSos }) => {
  return (
    <Modal visible={!!isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.questionIcon}>
            <Text style={styles.questionText}>?</Text>
          </View>

          <Text style={styles.title}>Are You Okay?</Text>
          <Text style={styles.subtitle}>
            No movement detected for &gt; 15 minutes. Please confirm your safety status to prevent automated rescue dispatch.
          </Text>

          <View style={styles.btnGroup}>
            <Button
              title="✓ Yes, I am Safe"
              onPress={onConfirmSafe}
              variant="primary"
            />
            <Button
              title="🚨 Request Help Now"
              onPress={onTriggerSos}
              variant="danger"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  questionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  questionText: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  btnGroup: {
    width: '100%',
    gap: 8,
  },
});

