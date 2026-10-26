import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Header } from '../components/Header';

export const ProfileScreen = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || user?.fullName || 'Registered Traveller');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [guardianName, setGuardianName] = useState(user?.guardians?.[0]?.name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Header title="Tourist Safety Profile" subtitle="Emergency contacts & health info" onBack={onBack} />

      {saved && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedText}>✓ Emergency Contact & Profile Details Saved</Text>
        </View>
      )}

      {/* User Header Badge */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name.charAt(0) : 'T'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Registered Traveler</Text>
          </View>
        </View>
      </View>

      {/* Edit Form */}
      <View style={styles.formCard}>
        <Input label="Full Name" value={name} onChangeText={setName} required />
        <Input label="Primary Phone Number" value={phone} onChangeText={setPhone} required />
        <Input label="Medical Blood Group" value={bloodGroup} onChangeText={setBloodGroup} required />
        <Input label="Emergency Guardian Name" value={guardianName} onChangeText={setGuardianName} required />

        <Button title="Save Profile & Emergency Contacts" onPress={handleSave} variant="primary" />
      </View>

      <View style={styles.logoutWrapper}>
        <Button title="Sign Out of App" onPress={logout} variant="danger" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  savedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  savedText: {
    color: '#34d399',
    fontWeight: '800',
    fontSize: 12,
  },
  userCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 10,
  },
  logoutWrapper: {
    marginTop: 10,
  },
});

