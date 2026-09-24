import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export const Input = ({ label, value, onChangeText, placeholder, type = 'text', required = false, error, secureTextEntry }) => {
  const isPassword = type === 'password' || secureTextEntry;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        secureTextEntry={isPassword}
        keyboardType={type === 'email' ? 'email-address' : 'default'}
        autoCapitalize="none"
        style={[styles.input, error && styles.inputError]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  required: {
    color: '#f87171',
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 11,
    color: '#f87171',
    marginTop: 4,
  },
});

