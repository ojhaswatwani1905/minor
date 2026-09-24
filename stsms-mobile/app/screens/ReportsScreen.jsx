import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

export const ReportsScreen = ({ onBack }) => {
  const [downloading, setDownloading] = useState(false);

  const handleExport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert('Report Exported', '📄 Safety Briefing Report (PDF) Generated & Saved!');
    }, 1500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Safety Briefing & Incident Reports" subtitle="Export certified expedition safety logs" onBack={onBack} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI Risk Index: 92/100 (Low Risk)</Text>
          </View>
          <Text style={styles.cardTitle}>Rohtang Expedition Clearance</Text>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total Checkpoints Passed:</Text>
            <Text style={styles.valWhite}>3 / 3 Pins</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Guardian Verification Status:</Text>
            <Text style={styles.valGreen}>SMS Confirmed</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Distress SOS Alerts Triggered:</Text>
            <Text style={styles.valGray}>0 Alerts</Text>
          </View>
        </View>

        <Button
          title={downloading ? "Generating PDF Briefing Report..." : "📄 Export Certified Safety Report (PDF)"}
          onPress={handleExport}
          loading={downloading}
          variant="primary"
        />
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
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 6,
  },
  cardHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22d3ee',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  detailsList: {
    gap: 8,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
  },
  valWhite: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  valGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34d399',
  },
  valGray: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
});

