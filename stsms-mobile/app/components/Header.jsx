import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

export const Header = ({ title, subtitle, onBack, rightAction, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.cardBorderLight || '#FDF0F4' }, style]}>
      <View style={styles.leftGroup}>
        {onBack && (
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.cardWarm || '#FFFBF7',
                borderColor: colors.cardBorder || '#F6DFE6',
              },
              SHADOWS.soft,
            ]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? <View style={styles.rightActionWrap}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  rightActionWrap: {
    marginLeft: 8,
  },
});
