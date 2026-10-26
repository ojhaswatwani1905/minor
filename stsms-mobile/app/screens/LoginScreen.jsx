import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const LoginScreen = ({ onNavigateRegister, onNavigateForgot }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && !res.success) {
        setError(res.message || 'Invalid login credentials');
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
        {/* Logo Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.title}>Smart Tourist Safety</Text>
          <Text style={styles.subtitle}>Sign in to sync your high-altitude expedition telemetry</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>🚨 {error}</Text>
            </View>
          )}

          <Input
            label="Tourist Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. tourist@stsms.gov"
            type="email"
            required
          />

          <Input
            label="Security Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            type="password"
            required
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={onNavigateForgot}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In to Safety Portal"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have a safety account?{' '}
              <Text style={styles.registerLink} onPress={onNavigateRegister}>
                Register Trip Account
              </Text>
            </Text>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  forgotText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  registerLink: {
    color: '#22d3ee',
    fontWeight: 'bold',
  },
  quickAccessBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessText: {
    color: '#22d3ee',
    fontWeight: '800',
    fontSize: 12,
  },
});

