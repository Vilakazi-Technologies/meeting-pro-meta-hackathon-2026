import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND } from '../constants/theme';
import {
  environmentBannerCopy,
  resolveAppDataEnvironment,
} from '../lib/demoEnvironment';
import { useWorkspace } from '../contexts/WorkspaceContext';

type Props = {
  compact?: boolean;
  onLearnMore?: () => void;
};

/**
 * Makes demo vs live explicit for judges and investors (brief §5 Demo Mode).
 */
export function DemoEnvironmentBanner({ compact, onLearnMore }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const workspace = useWorkspace();
  const env = resolveAppDataEnvironment(workspace.isDemoData);
  const copy = environmentBannerCopy(env);

  if (env === 'supabase_live') return null;

  const accent =
    copy.tone === 'amber'
      ? '#F59E0B'
      : copy.tone === 'sky'
        ? BRAND.qualityBlue
        : palette.textMuted;

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        {
          borderColor: `${accent}44`,
          backgroundColor:
            effectiveTheme === 'dark' ? `${accent}14` : `${accent}12`,
        },
      ]}
      accessibilityRole="summary"
    >
      <Ionicons name="information-circle-outline" size={18} color={accent} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: palette.text }]}>{copy.title}</Text>
        {!compact ? (
          <Text style={[styles.detail, { color: palette.textSecondary }]}>
            {copy.detail}
          </Text>
        ) : null}
      </View>
      {workspace.mode === 'demo' ? (
        <Pressable
          onPress={() => void workspace.leaveDemo()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={[styles.link, { color: accent }]}>Leave demo</Text>
        </Pressable>
      ) : onLearnMore ? (
        <Pressable onPress={onLearnMore} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.link, { color: accent }]}>How it works</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  wrapCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  detail: {
    fontSize: FONT.xs,
    lineHeight: 18,
    marginTop: 4,
  },
  link: {
    fontSize: FONT.xs,
    fontWeight: '600',
    alignSelf: 'center',
  },
});
