import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, TYPOGRAPHY } from '../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  required = false,
  error,
  secureTextEntry,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  style,
  keyboardType,
  autoCapitalize = 'none',
}) => {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const isPassword = type === 'password' || secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label} {required && <Text style={{ color: colors.primary }}>*</Text>}
        </Text>
      )}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBg || '#FFFFFF',
            borderColor: error ? colors.danger : colors.inputBorder || '#F2D7E0',
          },
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {icon && (
          <View style={styles.leftIconContainer}>
            {typeof icon === 'string' ? (
              <Ionicons name={icon} size={18} color={colors.textSecondary || '#64748B'} />
            ) : (
              icon
            )}
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder || '#A0ABC0'}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType || (type === 'email' ? 'email-address' : type === 'numeric' ? 'numeric' : 'default')}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          cursorColor={colors.primary || '#FF5E7E'}
          selectionColor={colors.primary || '#FF5E7E'}
          style={[
            styles.input,
            { color: colors.text || '#1E293B' },
            multiline && { textAlignVertical: 'top', paddingTop: 10 },
          ]}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {!isPassword && rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconContainer}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Pressable>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  leftIconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 12,
    minHeight: 46,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    fontWeight: '600',
  },
});
