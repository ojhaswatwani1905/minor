import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon = null,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#F3D2DC';
    switch (variant) {
      case 'danger':
        return '#FF3B69';
      case 'safe':
        return '#06D6A0';
      case 'warning':
        return '#FF9F1C';
      case 'secondary':
        return '#FFFBF7';
      case 'outline':
        return 'transparent';
      case 'soft':
        return '#FFE8EE';
      case 'dark':
        return '#1E293B';
      case 'primary':
      default:
        return '#FF5E7E';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#FFFFFF';
    switch (variant) {
      case 'outline':
        return '#FF5E7E';
      case 'soft':
        return '#FF476C';
      case 'secondary':
        return '#1E293B';
      case 'safe':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return '#FF5E7E';
    if (variant === 'secondary') return '#F4DFE5';
    return 'transparent';
  };

  const getShadow = () => {
    if (disabled) return null;
    if (variant === 'primary') return SHADOWS.glowCoral;
    if (variant === 'danger') return SHADOWS.glowDanger;
    if (variant === 'secondary') return SHADOWS.soft;
    return null;
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.84}
      style={[
        styles.button,
        isSmall && styles.buttonSmall,
        isLarge && styles.buttonLarge,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1.5 : 0,
        },
        getShadow(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              isSmall && styles.textSmall,
              isLarge && styles.textLarge,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  buttonSmall: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    marginVertical: 4,
  },
  buttonLarge: {
    paddingVertical: 17,
    paddingHorizontal: 28,
    borderRadius: RADIUS.pill,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  text: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 13,
    fontWeight: '700',
  },
  textLarge: {
    fontSize: 16,
    fontWeight: '800',
  },
});
