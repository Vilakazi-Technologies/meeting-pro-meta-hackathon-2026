import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, SPACING, BRAND } from '../constants/theme';

interface GlassInputProps extends TextInputProps {
  label?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export function GlassInput({
  label,
  hint,
  containerStyle,
  style,
  showPasswordToggle,
  secureTextEntry,
  ...inputProps
}: GlassInputProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = showPasswordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            borderColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.1)' : palette.glassBorder,
            backgroundColor: effectiveTheme === 'dark' ? BRAND.gray900 : palette.glassFill,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            showPasswordToggle && styles.inputWithToggle,
            { color: palette.text },
            style,
          ]}
          secureTextEntry={isSecure}
          {...inputProps}
        />
        {showPasswordToggle ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={[styles.toggleText, { color: palette.textMuted }]}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <Text style={[styles.hint, { color: palette.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    minHeight: 48,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: FONT.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 48,
  },
  inputWithToggle: {
    paddingRight: SPACING.xs,
  },
  toggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleText: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  hint: {
    fontSize: FONT.xs,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
});
