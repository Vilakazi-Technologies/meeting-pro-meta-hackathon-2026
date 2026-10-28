import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, BRAND } from '../constants/theme';
import { TYPO } from '../constants/typography';
import { COMPANY, PRODUCT } from '../constants/brand';
import { LAYOUT } from '../constants/layout';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Text action under the title — preferred over icon buttons (cleaner on web). */
  textAction?: {
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  };
  /** When true, show VILATECH · Meeting Pro eyebrow (default). Pass `false` to hide. */
  showBrandEyebrow?: boolean;
  /** Override eyebrow text (e.g. screen-specific section). */
  eyebrow?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  textAction,
  rightAction,
  showBrandEyebrow = true,
  eyebrow,
}: ScreenHeaderProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const eyebrowText = eyebrow ?? `${COMPANY.name} · ${PRODUCT.name}`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.textBlock}>
        {showBrandEyebrow && (
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDot, { backgroundColor: BRAND.qualityBlue }]} />
            <Text style={[styles.eyebrow, { color: palette.textMuted }]}>{eyebrowText}</Text>
          </View>
        )}
        <Text style={[styles.title, { color: palette.text }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
        ) : null}
        {textAction ? (
          <Pressable
            onPress={textAction.onPress}
            style={styles.textAction}
            accessibilityRole="button"
          >
            <Text style={styles.textActionLabel}>{textAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {rightAction && !textAction ? (
        <Pressable
          onPress={rightAction.onPress}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: `${rightAction.color ?? palette.textMuted}14`,
              borderColor: palette.glassBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          <Ionicons
            name={rightAction.icon}
            size={20}
            color={rightAction.color ?? palette.text}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  return (
    <View style={[styles.sectionBlock, style]}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.sectionRule, { backgroundColor: palette.separator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: LAYOUT.headerBottom,
    gap: 16,
  },
  textBlock: { flex: 1, minWidth: 0 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    ...TYPO.eyebrow,
    flexShrink: 1,
  },
  title: {
    ...TYPO.largeTitle,
    maxWidth: '100%',
  },
  subtitle: {
    ...TYPO.callout,
    marginTop: 6,
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  textAction: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  textActionLabel: {
    ...TYPO.callout,
    fontWeight: '600',
    color: BRAND.qualityBlue,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBlock: {
    marginTop: LAYOUT.sectionGap,
    marginBottom: LAYOUT.itemGap,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    ...TYPO.title3,
    flex: 1,
  },
  sectionAction: {
    ...TYPO.callout,
    fontWeight: '600',
    color: BRAND.qualityBlue,
  },
  sectionRule: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
