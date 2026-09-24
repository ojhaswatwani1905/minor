import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { tripService } from '../services/tripService';

export const CreateTripScreen = ({ onBack, onTripCreated }) => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [boundaryRadiusKm, setBoundaryRadiusKm] = useState('5.0');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [notes, setNotes] = useState('');
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
        notes
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Header title="Register Expedition Trip" subtitle="Setup route parameters & guardian alerts" onBack={onBack} />

      <View style={styles.formCard}>
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>🚨 {error}</Text>
          </View>
        )}

        <Input
          label="Starting Location / Base Camp"
          value={startLocation}
          onChangeText={setStartLocation}
          placeholder="e.g. Manali Base Camp (2,050m)"
          required
        />

        <Input
          label="Destination / Target Peak"
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Rohtang Pass Summit (3,978m)"
          required
        />

        <Input
          label="Expedition Route Path"
          value={route}
          onChangeText={setRoute}
          placeholder="e.g. Manali Base -> Solang Trail -> Rohtang Peak"
        />


        <Input
          label="Expected Return Date & Time"
          value={expectedArrival}
          onChangeText={setExpectedArrival}
          placeholder="e.g. Today, 18:00"
        />

        <Input
          label="Geofence Safety Radius (km)"
          value={boundaryRadiusKm}
          onChangeText={setBoundaryRadiusKm}
          placeholder="5.0"
        />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Guardian Alert Contact</Text>
          <Input
            label="Primary Guardian Name"
            value={guardianName}
            onChangeText={setGuardianName}
            placeholder="e.g. Rohan Nair"
          />
          <Input
            label="Guardian Emergency Phone"
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder="+91 98765 43210"
          />
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.label}>EXPEDITION NOTES / GEAR INFO</Text>
          <TextInput
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Carrying 2-way satellite mesh beacon + thermal sleeping bag."
            placeholderTextColor="#64748b"
            style={styles.textArea}
          />
        </View>

        <Button title="Register & Activate Satellite Safety →" onPress={handleSubmit} loading={loading} variant="primary" />
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
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 6,
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
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22d3ee',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: '#05080e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    color: '#ffffff',
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 60,
    marginBottom: 14,
  },
});

