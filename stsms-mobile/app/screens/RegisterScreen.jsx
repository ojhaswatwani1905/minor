import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';

export const RegisterScreen = ({ onNavigateLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await register({ name, email, password, department: 'Tourist Explorer', guardianPhone });
      if (res && !res.success) {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Connection error to STSMS backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header title="Register Safety Account" subtitle="Create your high-altitude tourist profile" onBack={onNavigateLogin} />

        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>🚨 {error}</Text>
            </View>
          )}

          <Input
            label="Full Traveler Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Priya Nair"
            required
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="priya@example.com"
            type="email"
            required
          />

          <Input
            label="Guardian Emergency Contact Phone"
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="+91 98765 43210"
            required
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            type="password"
            required
          />

          <Button
            title="Create Account & Sync GPS"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
          />
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
  errorBanner: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

