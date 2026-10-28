import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING } from '../../constants/theme';
import { TYPO } from '../../constants/typography';

export function AuthDivider({ label = 'or sign in with email' }: { label?: string }) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  return (
    <View style={styles.wrap}>
      <View style={[styles.line, { backgroundColor: palette.separator }]} />
      <Text style={[TYPO.footnote, { color: palette.textMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: palette.separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
