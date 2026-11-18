import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const RegisterScreen = ({ onNavigateLogin }) => {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  const handleRegister = async () => {
    if (loading || isSubmittingRef.current) return;

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      let lat = null;
      let lng = null;
      let batteryLevel = null;
      let locationName = null;

      // 1. Fast, non-blocking battery sample
      try {
        const bat = await Battery.getBatteryLevelAsync();
        if (bat >= 0) batteryLevel = Math.round(bat * 100);
      } catch (e) {}

      // 2. Fast non-blocking location sample (prefer cached fix or 1.5s bounded query)
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown?.coords) {
            lat = lastKnown.coords.latitude;
            lng = lastKnown.coords.longitude;
            locationName = `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          } else {
            // Short 1.5s timeout race so registration is never delayed
            const freshPos = await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise((resolve) => setTimeout(() => resolve(null), 1500))
            ]);
            if (freshPos?.coords) {
              lat = freshPos.coords.latitude;
              lng = freshPos.coords.longitude;
              locationName = `GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            }
          }
        }
      } catch (e) {}

      // 3. Dispatch registration to backend
      const res = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        department: 'Tourist Explorer',
        guardianPhone: guardianPhone.trim() || '+91 98765 43210',
        lat,
        lng,
        batteryLevel,
        locationName,
      });

      if (res && !res.success) {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError(err.message || 'Connection error to STSMS backend');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
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
        <Header title="Create Account" subtitle="Join the smart tourist safety network" onBack={onNavigateLogin} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            icon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Priya Sharma"
            required
          />

          <Input
            icon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="priya@example.com"
            type="email"
            required
          />

          <Input
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            type="password"
            required
          />

          <Input
            icon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
            label="Guardian Emergency Phone"
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />

          <Button
            title="Create Tourist Profile"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            style={styles.submitBtn}
          />

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already registered?{' '}
            </Text>
            <TouchableOpacity onPress={onNavigateLogin} activeOpacity={0.7}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Log In</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    borderWidth: 1.5,
    marginTop: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEF',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD1DC',
  },
  errorText: {
    color: '#FF3B69',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    marginTop: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
  },
});
