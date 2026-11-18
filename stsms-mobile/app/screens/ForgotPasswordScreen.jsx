import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const ForgotPasswordScreen = ({ onNavigateLogin }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return;
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Reset Password" subtitle="Enter your email to receive recovery instructions" onBack={onNavigateLogin} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          {sent ? (
            <View style={styles.sentBox}>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={24} color="#06D6A0" />
              </View>
              <Text style={[styles.sentTitle, { color: colors.text }]}>Instructions Transmitted</Text>
              <Text style={[styles.sentSubtitle, { color: colors.textSecondary }]}>
                If an account exists for {email}, a recovery link has been sent to your email.
              </Text>
              <Button
                title="Return to Sign In"
                onPress={onNavigateLogin}
                variant="primary"
                style={{ marginTop: 14 }}
              />
            </View>
          ) : (
            <View style={styles.formBox}>
              <Input
                icon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
                label="Registered Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="tourist@stsms.gov"
                type="email"
                required
              />
              <Button
                title="Send Recovery Email"
                onPress={handleReset}
                loading={loading}
                variant="primary"
                style={{ marginTop: 12 }}
              />
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
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1.5,
    marginTop: 12,
  },
  sentBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8FDF5',
    borderWidth: 1.5,
    borderColor: '#B2F5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sentTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sentSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  formBox: {
    paddingVertical: 4,
  },
});
