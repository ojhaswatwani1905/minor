import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const SettingsScreen = ({ onBack }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [checkInInterval, setCheckInInterval] = useState('15');
  const [gpsPrecision, setGpsPrecision] = useState('High Precision');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header title="Settings" subtitle="Theme, GPS & safety timers" onBack={onBack} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {saved && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#06D6A0" style={{ marginRight: 6 }} />
            <Text style={styles.savedText}>Settings Saved Successfully</Text>
          </View>
        )}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardWarm || '#FFFBF7', borderColor: colors.cardBorder || '#F6DFE6' },
            SHADOWS.card,
          ]}
        >
          {/* Appearance Theme */}
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Visual Appearance</Text>
              <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                Pastel Rose Theme or Velvety Dark
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeBtn,
                { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={16}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.themeBtnText, { color: colors.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Check-In Interval */}
          <View style={styles.settingItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              AUTOMATIC CHECK-IN INTERVAL
            </Text>
            <View style={styles.optionsRow}>
              {['15', '30', '60'].map((mins) => {
                const isSelected = checkInInterval === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setCheckInInterval(mins)}
                    style={[
                      styles.optionBtn,
                      isSelected
                        ? [styles.activeOptionBtn, SHADOWS.glowCoral]
                        : { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.activeOptionText : { color: colors.textSecondary },
                      ]}
                    >
                      {mins} mins
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* GPS Tracking Sensitivity */}
          <View style={styles.settingItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              GPS LOCATION SENSITIVITY
            </Text>
            <View style={styles.optionsRow}>
              {['High Precision', 'Battery Saver'].map((mode) => {
                const isSelected = gpsPrecision === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setGpsPrecision(mode)}
                    style={[
                      styles.optionBtn,
                      isSelected
                        ? [styles.activeOptionBtn, SHADOWS.glowCoral]
                        : { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.cardBorder || '#F6DFE6' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.activeOptionText : { color: colors.textSecondary },
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title="Save Preferences"
            onPress={handleSave}
            variant="primary"
            style={{ marginTop: 14 }}
          />
        </View>

        {/* Version Footer */}
        <View style={styles.versionBox}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            STSMS Smart Tourist Safety Companion • v2.6.0
          </Text>
          <Text style={[styles.versionSub, { color: colors.textMuted }]}>
            Protected by Automated Geofence & Emergency Dispatch
          </Text>
        </View>
      </ScrollView>
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
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6DFE6',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingItem: {
    marginTop: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  activeOptionBtn: {
    backgroundColor: '#FF5E7E',
    borderColor: '#FF5E7E',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeOptionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  versionBox: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  versionSub: {
    fontSize: 10,
    marginTop: 2,
  },
});
