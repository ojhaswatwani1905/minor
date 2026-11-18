import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { getServerBaseUrl, setServerBaseUrl } from '../utils/api';

export const LoginScreen = ({ onNavigateRegister, onNavigateForgot }) => {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [serverNotice, setServerNotice] = useState('');

  useEffect(() => {
    getServerBaseUrl().then(url => setCustomUrl(url));
  }, []);

  const openServerModal = async () => {
    const url = await getServerBaseUrl();
    setCustomUrl(url);
    setServerNotice('');
    setShowServerModal(true);
  };

  const handleSaveServer = async () => {
    if (customUrl && customUrl.trim()) {
      await setServerBaseUrl(customUrl.trim());
      setServerNotice('✓ Server URL updated: ' + customUrl.trim());
      setTimeout(() => setShowServerModal(false), 1200);
    }
  };

  const handleResetServer = async () => {
    await setServerBaseUrl(null);
    const def = await getServerBaseUrl();
    setCustomUrl(def);
    setServerNotice('✓ Reset to auto-detected IP: ' + def);
    setTimeout(() => setShowServerModal(false), 1200);
  };

  const isSubmittingRef = useRef(false);

  const handleLogin = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    isSubmittingRef.current = true;
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res && !res.success) {
        setError(res.message || 'Invalid login credentials');
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
        {/* ========================================================
            HERO ILLUSTRATION & WELCOME (Matching Reference Screen 2)
            ======================================================== */}
        <View style={styles.heroSection}>
          {/* Heritage Monument Banner Illustration */}
          <View style={styles.illustrationWrap}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=80',
              }}
              style={styles.heroMonumentImage}
            />
            <View style={styles.heroOverlayGradient} />
            <TouchableOpacity
              style={styles.travellerBadge}
              onPress={openServerModal}
              activeOpacity={0.8}
            >
              <Ionicons name="server-outline" size={18} color="#FF5E7E" />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeTextWrap}>
            <View style={styles.welcomeTitleRow}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome Back</Text>
              <Text style={styles.waveEmoji}> 👋</Text>
            </View>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Stay Safe, Travel Smart
            </Text>
          </View>
        </View>

        {/* ========================================================
            LOGIN FORM CARD (Warm Cream Surface with Rounded Shapes)
            ======================================================== */}
        <View
          style={[
            styles.formCard,
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

          {/* Email / Mobile Input */}
          <Input
            icon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
            value={email}
            onChangeText={setEmail}
            placeholder="Email / Mobile Number"
            type="email"
          />

          {/* Password Input */}
          <Input
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            type="password"
          />

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeWrap}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: rememberMe ? colors.primary : colors.inputBorder || '#F2D7E0' },
                  rememberMe && { backgroundColor: colors.primary },
                ]}
              >
                {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={[styles.rememberMeText, { color: colors.textSecondary }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateForgot} activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Coral Log In Button */}
          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            style={styles.loginBtn}
          />

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder || '#F6DFE6' }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>Or Continue With</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder || '#F6DFE6' }]} />
          </View>

          {/* Social Icons Row */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { borderColor: colors.cardBorder || '#F6DFE6' }]}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={onNavigateRegister} activeOpacity={0.7}>
              <Text style={[styles.signUpText, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Backend Server Configuration Modal */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="server" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Server Host Setting</Text>
              </View>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter your computer's LAN IP address running the Express backend:
            </Text>

            <Input
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="http://10.168.112.216:5001/api"
              label="Backend Server Base URL"
            />

            {!!serverNotice && (
              <Text style={[styles.serverNotice, { color: colors.safe || '#06D6A0' }]}>
                {serverNotice}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                title="Save & Connect"
                onPress={handleSaveServer}
                variant="primary"
                style={{ flex: 1 }}
              />
              <Button
                title="Reset Default"
                onPress={handleResetServer}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 18,
  },
  serverNotice: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustrationWrap: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  heroMonumentImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 94, 126, 0.25)',
  },
  travellerBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeTextWrap: {
    alignItems: 'center',
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    fontWeight: '900',
  },
  waveEmoji: {
    fontSize: 24,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  formCard: {
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  rememberMeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberMeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 18,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  signUpText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
