import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND, SPACING, ThemePalette } from '../constants/theme';

/** Light / dark preview toggle — same accent tokens in both modes. */
export function ThemeModePicker() {
  const { effectiveTheme, setTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  return (
    <View style={styles.row}>
      <ModeChip
        label="Light"
        icon="sunny-outline"
        active={effectiveTheme === 'light'}
        onPress={() => setTheme('light')}
        palette={palette}
      />
      <ModeChip
        label="Dark"
        icon="moon-outline"
        active={effectiveTheme === 'dark'}
        onPress={() => setTheme('dark')}
        palette={palette}
      />
    </View>
  );
}

function ModeChip({
  label,
  icon,
  active,
  onPress,
  palette,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  palette: ThemePalette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${BRAND.qualityBlue}22` : `${palette.textMuted}12`,
          borderColor: active ? BRAND.qualityBlue : palette.glassBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={18} color={active ? BRAND.qualityBlue : palette.textSecondary} />
      <Text
        style={[
          styles.chipLabel,
          { color: active ? BRAND.qualityBlue : palette.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});
