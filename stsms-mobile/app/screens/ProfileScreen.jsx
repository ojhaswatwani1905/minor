import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileService } from '../services/profileService';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const ProfileScreen = ({ onBack }) => {
  const { user, logout, updateUser } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState(user?.name || user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [guardianName, setGuardianName] = useState(user?.guardians?.[0]?.name || '');
  const [guardianPhone, setGuardianPhone] = useState(user?.guardians?.[0]?.phone || user?.emergencyContact || '');

  const initialValuesRef = useRef({
    name: user?.name || user?.fullName || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    guardianName: user?.guardians?.[0]?.name || '',
    guardianPhone: user?.guardians?.[0]?.phone || user?.emergencyContact || '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const AVATAR_PRESETS = [
    { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', label: 'Traveller 1' },
    { id: '2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', label: 'Traveller 2' },
    { id: '3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', label: 'Traveller 3' },
    { id: '4', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300', label: 'Traveller 4' },
    { id: '5', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300', label: 'Traveller 5' },
  ];

  const handleSelectAvatar = async (avatarUrl) => {
    if (!avatarUrl || isUploadingAvatar) return;
    setIsUploadingAvatar(true);
    setSaveError('');
    try {
      const res = await profileService.uploadAvatar(avatarUrl);
      if (res && res.success) {
        const finalUrl = res.avatarUrl || avatarUrl;
        if (updateUser) {
          await updateUser({ ...user, avatar: finalUrl });
        }
        setIsAvatarModalOpen(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setSaveError(res?.message || 'Failed to update profile picture.');
      }
    } catch (e) {
      setSaveError(e.message || 'Error updating profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Fetch real profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await profileService.getProfile();
        if (isMounted && res && (res.profile || res.user)) {
          const p = res.profile || res.user;
          const loadedName = p.fullName || p.name || '';
          const loadedPhone = p.phone || '';
          const loadedBlood = p.bloodGroup || '';
          const loadedGName = p.guardians?.[0]?.name || '';
          const loadedGPhone = p.guardians?.[0]?.phone || p.emergencyContact || '';

          if (loadedName) setName(loadedName);
          if (loadedPhone) setPhone(loadedPhone);
          if (loadedBlood) setBloodGroup(loadedBlood);
          if (loadedGName) setGuardianName(loadedGName);
          if (loadedGPhone) setGuardianPhone(loadedGPhone);

          initialValuesRef.current = {
            name: loadedName,
            phone: loadedPhone,
            bloodGroup: loadedBlood,
            guardianName: loadedGName,
            guardianPhone: loadedGPhone,
          };

          if (updateUser) {
            updateUser(p);
          }
        }
      } catch (err) {
        // Fallback to local user
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;

    // Dirty-check: Avoid submitting if nothing changed
    const isDirty =
      name.trim() !== (initialValuesRef.current.name || '').trim() ||
      phone.trim() !== (initialValuesRef.current.phone || '').trim() ||
      bloodGroup.trim() !== (initialValuesRef.current.bloodGroup || '').trim() ||
      guardianName.trim() !== (initialValuesRef.current.guardianName || '').trim() ||
      guardianPhone.trim() !== (initialValuesRef.current.guardianPhone || '').trim();

    if (!isDirty) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaved(false);

    try {
      const payload = {
        name: name.trim(),
        fullName: name.trim(),
        phone: phone.trim(),
        bloodGroup: bloodGroup.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        emergencyContact: guardianPhone.trim(),
        guardians: [
          {
            name: guardianName.trim() || 'Primary Guardian',
            phone: guardianPhone.trim(),
            relation: 'Family',
            verified: true,
          },
        ],
      };

      const res = await profileService.updateProfile(payload);
      if (res && res.success) {
        setSaved(true);
        initialValuesRef.current = {
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup: bloodGroup.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
        };
        const updated = res.profile || res.user || payload;
        if (updateUser) {
          await updateUser(updated);
        }
        setTimeout(() => setSaved(false), 3500);
      } else {
        setSaveError(res?.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setSaveError(err.message || 'Network error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header title="Tourist Profile" subtitle="Emergency contacts & identity" onBack={onBack} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {saved && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#06D6A0" style={{ marginRight: 6 }} />
            <Text style={styles.savedText}>Emergency Contact & Profile Details Saved</Text>
          </View>
        )}

        {saveError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        {/* Tourist Avatar Card */}
        <View
          style={[
            styles.userHeroCard,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setIsAvatarModalOpen(true)}
            activeOpacity={0.8}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: '#FFE5EC', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#FF3B69' }}>
                  {(name || user?.name || user?.fullName || 'T').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarCameraBadge}>
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{name || user?.name || user?.fullName || 'Active Tourist'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'tourist@stsms.gov'}</Text>
            <View style={styles.safetyPassBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#06D6A0" style={{ marginRight: 4 }} />
              <Text style={styles.safetyPassText}>Mobile Safety Pass: Active</Text>
            </View>
          </View>
        </View>

        {/* Profile Inputs Form */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          <View style={styles.formTitleRow}>
            <Text style={[styles.formHeading, { color: colors.text }]}>Personal Details</Text>
            {loading && <ActivityIndicator size="small" color="#FF5E7E" />}
          </View>

          <Input
            icon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Priya Sharma"
            required
          />

          <Input
            icon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
            label="Primary Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
            required
          />

          <Input
            icon={<Ionicons name="medkit-outline" size={18} color={colors.textSecondary} />}
            label="Medical Blood Group"
            value={bloodGroup}
            onChangeText={setBloodGroup}
            placeholder="e.g. O+, B+, A+"
            required
          />

          <Text style={[styles.formHeading, { color: colors.text, marginTop: 14 }]}>
            Emergency Guardian Contact
          </Text>

          <Input
            icon={<Ionicons name="people-outline" size={18} color={colors.textSecondary} />}
            label="Guardian Name / Relation"
            value={guardianName}
            onChangeText={setGuardianName}
            placeholder="e.g. Rajesh Sharma (Father)"
            required
          />

          <Input
            icon={<Ionicons name="chatbox-ellipses-outline" size={18} color={colors.textSecondary} />}
            label="Guardian Phone (Auto SMS)"
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
            required
          />

          <Button
            title={saving ? 'Saving Changes...' : 'Save Profile & Guardians'}
            onPress={handleSave}
            variant="primary"
            disabled={saving}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#FF3B69" style={{ marginRight: 6 }} />
          <Text style={styles.signOutText}>Sign Out of Tourist Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={isAvatarModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAvatarModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>Choose Profile Picture</Text>
              <TouchableOpacity onPress={() => setIsAvatarModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              Select a verified portrait or enter an image URL to sync with Command Center:
            </Text>

            {/* Presets Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              {AVATAR_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectAvatar(p.url)}
                  disabled={isUploadingAvatar}
                  style={{
                    borderWidth: user?.avatar === p.url ? 3 : 1,
                    borderColor: user?.avatar === p.url ? '#FF5E7E' : '#E2E8F0',
                    borderRadius: 36,
                    padding: 2,
                  }}
                >
                  <Image source={{ uri: p.url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Image URL input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B', marginBottom: 4 }}>Or Custom Image URL:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12 }}
                  placeholder="https://..."
                  value={customAvatarUrl}
                  onChangeText={setCustomAvatarUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => handleSelectAvatar(customAvatarUrl.trim())}
                  disabled={!customAvatarUrl.trim() || isUploadingAvatar}
                  style={{ backgroundColor: '#FF5E7E', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}
                >
                  {isUploadingAvatar ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Set</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {/* Clear / Initials Fallback */}
            <TouchableOpacity
              onPress={() => handleSelectAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Tourist')}`)}
              style={{ paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, color: '#FF5E7E', fontWeight: '700' }}>Reset to Avatar Initials</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FDF5',
    borderWidth: 1,
    borderColor: '#B2F5EA',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
  },
  savedText: {
    color: '#06D6A0',
    fontWeight: '800',
    fontSize: 12,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5EC',
    borderWidth: 1,
    borderColor: '#FFB6C1',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B69',
    fontWeight: '800',
    fontSize: 12,
    flex: 1,
  },
  formTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userHeroCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF5E7E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  safetyPassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  safetyPassText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06D6A0',
  },
  formCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#FFD1DC',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  signOutText: {
    color: '#FF3B69',
    fontSize: 14,
    fontWeight: '800',
  },
});
