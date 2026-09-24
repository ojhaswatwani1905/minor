import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const Button = ({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) => {
  const getBackgroundColor = () => {
    if (variant === 'danger') return '#dc2626';
    if (variant === 'secondary') return '#1e293b';
    if (variant === 'outline') return 'transparent';
    return '#0891b2';
  };

  const getTextColor = () => {
    if (variant === 'outline') return '#22d3ee';
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  outlineBorder: {
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '800',
    fontSize: 14,
  },
});

