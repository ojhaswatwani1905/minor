import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { tripService } from '../services/tripService';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const CreateTripScreen = ({ onBack, onTripCreated }) => {
  const { colors } = useTheme();
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [boundaryRadiusKm, setBoundaryRadiusKm] = useState('5.0');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!startLocation || !destination) {
      setError('Starting Point and Destination are required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await tripService.createTrip({
        startLocation,
        destination,
        route: route || `${startLocation} -> ${destination}`,
        expectedArrival,
        boundaryRadiusKm,
        guardianName,
        guardianPhone,
      });
      if (res.success) {
        onTripCreated && onTripCreated(res.trip);
      } else {
        setError(res.message || 'Failed to register trip');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background || '#FFF0F5' }]}>
      <View style={styles.headerWrapper}>
        <Header title="Plan New Trip" subtitle="Set parameters & safe zone corridor" onBack={onBack} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
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

          <Input
            icon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />}
            label="Starting Location / Base"
            value={startLocation}
            onChangeText={setStartLocation}
            placeholder="e.g. Bhopal Center"
            required
          />

          <Input
            icon={<Ionicons name="flag-outline" size={18} color={colors.textSecondary} />}
            label="Destination"
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Sanchi Stupa"
            required
          />

          <Input
            icon={<Ionicons name="map-outline" size={18} color={colors.textSecondary} />}
            label="Route Path"
            value={route}
            onChangeText={setRoute}
            placeholder="e.g. NH-86 Corridor"
          />

          <Input
            icon={<Ionicons name="time-outline" size={18} color={colors.textSecondary} />}
            label="Expected Return"
            value={expectedArrival}
            onChangeText={setExpectedArrival}
            placeholder="e.g. Today, 18:00"
          />

          <Input
            icon={<Ionicons name="radio-button-on-outline" size={18} color={colors.textSecondary} />}
            label="Safe Zone Radius (km)"
            value={boundaryRadiusKm}
            onChangeText={setBoundaryRadiusKm}
            placeholder="5.0"
            keyboardType="numeric"
          />

          <Button
            title="Create Expedition & Activate Safe Zone"
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            style={{ marginTop: 14 }}
          />
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
});
