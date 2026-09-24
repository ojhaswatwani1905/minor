import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';
import { authService } from '../services/authService';

export const ForgotPasswordScreen = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title="Reset Password" subtitle="Enter your email to receive recovery instructions" onBack={onNavigateLogin} />

        <View style={styles.card}>
          {sent ? (
            <View style={styles.sentBox}>
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.sentTitle}>Reset Instructions Transmitted</Text>
              <Text style={styles.sentSubtitle}>If an account exists for {email}, a recovery link has been sent.</Text>
              <Button title="Return to Sign In" onPress={onNavigateLogin} variant="secondary" />
            </View>
          ) : (
            <View style={styles.formBox}>
              <Input
                label="Registered Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="tourist@stsms.gov"
                type="email"
                required
              />
              <Button title="Send Password Reset Email" onPress={handleReset} loading={loading} variant="primary" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  sentBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkText: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 20,
  },
  sentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  sentSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  formBox: {
    gap: 12,
  },
});

