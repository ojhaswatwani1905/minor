import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Button } from './Button';

export const EmergencyModal = ({ isOpen, onClose, alertType = '1-Tap Emergency SOS', onConfirmSos, onCancelSos }) => {
  const [countdown, setCountdown] = useState(5);
  const [isSilent, setIsSilent] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0 && !dispatched) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !dispatched) {
      handleFinalDispatch();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, countdown, dispatched]);

  const handleFinalDispatch = () => {
    setDispatched(true);
    onConfirmSos && onConfirmSos({
      type: alertType,
      isSilent,
      isVoice,
      timestamp: new Date().toISOString()
    });
  };

  const startVoiceRecording = () => {
    setIsVoice(true);
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
    }, 3000);
  };

  return (
    <Modal visible={!!isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>🚨 Emergency Distress Triggered</Text>
            </View>
            <Text style={styles.title}>{alertType}</Text>
          </View>

          {/* Countdown Circle */}
          {!dispatched ? (
            <View style={styles.countdownSection}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
              <Text style={styles.countdownSub}>
                Automatic Satellite SAR Broadcast in <Text style={styles.boldWhite}>{countdown} seconds</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.dispatchedBox}>
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.dispatchedTitle}>DISTRESS BEACON DISPATCHED!</Text>
              <Text style={styles.dispatchedSub}>Command Center & Primary Guardian Notified via Satellite Mesh.</Text>
            </View>
          )}

          {/* Mode Selectors */}
          <View style={styles.modesRow}>
            <TouchableOpacity
              onPress={() => setIsSilent(!isSilent)}
              style={[styles.modeBtn, isSilent && styles.activeSilentBtn]}
            >
              <Text style={[styles.modeBtnText, isSilent && styles.activeText]}>
                {isSilent ? '✓ Silent SOS Mode' : '🔇 Silent Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={startVoiceRecording}
              style={[styles.modeBtn, isVoice && styles.activeVoiceBtn]}
            >
              <Text style={[styles.modeBtnText, isVoice && styles.activeText]}>
                {recording ? '🎙️ Recording...' : isVoice ? '✓ Voice SOS Ready' : '🎤 Voice SOS'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!dispatched && (
              <Button
                title="Confirm Emergency Dispatch Now"
                onPress={handleFinalDispatch}
                variant="danger"
              />
            )}

            <Button
              title={dispatched ? "Cancel Distress Alert (PIN Safe)" : "Cancel Countdown (Accidental Press)"}
              onPress={() => {
                setCountdown(5);
                setDispatched(false);
                onCancelSos && onCancelSos();
                onClose();
              }}
              variant="secondary"
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
    maxWidth: 360,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 14,
  },
  alertBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  alertBadgeText: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  countdownSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 4,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  countdownText: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 28,
  },
  countdownSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  boldWhite: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dispatchedBox: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginVertical: 10,
  },
  checkBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  checkText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  dispatchedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  dispatchedSub: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#05080e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  activeSilentBtn: {
    backgroundColor: '#9333ea',
    borderColor: '#a855f7',
  },
  activeVoiceBtn: {
    backgroundColor: '#0891b2',
    borderColor: '#06b6d4',
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  activeText: {
    color: '#ffffff',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
    gap: 6,
  },
});

