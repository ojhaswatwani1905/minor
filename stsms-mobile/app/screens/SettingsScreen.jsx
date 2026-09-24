import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';

export const SettingsScreen = ({ onBack }) => {
  const { isDark, toggleTheme } = useTheme();
  const [checkInInterval, setCheckInInterval] = useState('15');
  const [gpsPrecision, setGpsPrecision] = useState('High Precision');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="App Settings & Preferences" subtitle="Theme, GPS sensitivity & safety timers" onBack={onBack} />

      {saved && (
        <View style={styles.savedBanner}>
          <Text style={styles.savedText}>✓ App Settings Saved</Text>
        </View>
      )}

      <View style={styles.card}>
        {/* Appearance Theme */}
        <View style={styles.rowBetween}>
          <View style={styles.textCol}>
            <Text style={styles.itemTitle}>Theme Appearance</Text>
            <Text style={styles.itemSub}>Switch between Dark Command and Light Mode</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn} activeOpacity={0.8}>
            <Text style={styles.themeBtnText}>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
          </TouchableOpacity>
        </View>

        {/* Check-In Interval */}
        <View style={styles.settingItem}>
          <Text style={styles.label}>AUTO "ARE YOU OKAY?" PROMPT INTERVAL</Text>
          <View style={styles.optionsRow}>
            {['15', '30', '60'].map((mins) => (
              <TouchableOpacity
                key={mins}
                onPress={() => setCheckInInterval(mins)}
                style={[styles.optionBtn, checkInInterval === mins && styles.activeOptionBtn]}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, checkInInterval === mins && styles.activeOptionText]}>
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* GPS Sensitivity */}
        <View style={styles.settingItem}>
          <Text style={styles.label}>GPS SATELLITE TRACKING MODE</Text>
          <View style={styles.optionsRow}>
            {['High Precision', 'Battery Saver'].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setGpsPrecision(mode)}
                style={[styles.optionBtn, gpsPrecision === mode && styles.activeOptionBtn]}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, gpsPrecision === mode && styles.activeOptionText]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title="Save Preferences" onPress={handleSave} variant="primary" />
      </View>

      {/* App Version Info */}
      <View style={styles.versionBox}>
        <Text style={styles.versionText}>STSMS Tourist Safety Companion v2.6.0</Text>
        <Text style={styles.versionText}>Connected to Command Center Engine</Text>
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
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 6,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  itemSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  themeBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  themeBtnText: {
    color: '#22d3ee',
    fontWeight: 'bold',
    fontSize: 12,
  },
  settingItem: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#05080e',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeOptionBtn: {
    backgroundColor: '#0891b2',
    borderColor: '#06b6d4',
  },
  optionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  activeOptionText: {
    color: '#ffffff',
  },
  versionBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  versionText: {
    fontSize: 10,
    color: '#64748b',
  },
});

