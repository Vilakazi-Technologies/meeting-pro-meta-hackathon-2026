import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, FONT, RADIUS, SPACING } from '../constants/theme';

interface GlassPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: ViewStyle;
}

/** Corporate primary action — solid, no marketing gradient. */
export function GlassPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon = 'arrow-forward',
  testID,
  style,
}: GlassPrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.wrap,
        { backgroundColor: inactive ? BRAND.gray700 : BRAND.qualityBlue },
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          <Ionicons name={icon} size={18} color="#FFF" />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 48,
    borderRadius: RADIUS.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    color: '#FFF',
    fontSize: FONT.base,
    fontWeight: '600',
  },
});
